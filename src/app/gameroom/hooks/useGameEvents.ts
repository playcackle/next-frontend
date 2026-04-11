import { useEffect, useRef } from "react";
import { useSetAtom } from "jotai";
import {
  GameOverPayload,
  LobbySyncPayload,
  LobbyTickPayload,
  NewRoundStartedPayload,
  RoundOverPayload,
  SlotSnappedPayload,
  SubmissionFeedbackPayload,
  WaitingForPlayersPayload,
} from "../types/payloads";
import {
  getRandomAttentionAnimation,
  getRandomSnappedSound,
  playSound,
} from "../utils";
import { clearRoundHintsAtom, clearSlotHeatAtom, connectionStatusAtom, slotHeatAtom } from "../store/gameAtoms";
import { useGameActions } from "./useGameActions";
import { useGameSocket } from "./useGameSocket";
import { useGameState } from "./useGameState";

/** Grace period (ms) before a disconnection triggers the full loading screen.
 *  Brief blips (< 3s) show only the reconnection banner, not the loading overlay. */
const LOADING_GRACE_PERIOD_MS = 3000;

export const useGameEvents = (gameWsUrl: string, token: string) => {
  const { onEvent, sendEvent, isConnected, connectionStatus, reconnect } = useGameSocket(gameWsUrl, token);
  const { updateGameState, slots, lobbyStatus } = useGameState();
  const { triggerCorrectAnswerEffects } = useGameActions();
  const clearRoundHints = useSetAtom(clearRoundHintsAtom);
  const setSlotHeat = useSetAtom(slotHeatAtom);
  const clearSlotHeat = useSetAtom(clearSlotHeatAtom);
  const setConnectionStatus = useSetAtom(connectionStatusAtom);

  const slotsRef = useRef(slots);
  useEffect(() => {
    slotsRef.current = slots;
  }, [slots]);

  const lobbyStatusRef = useRef(lobbyStatus);
  useEffect(() => {
    lobbyStatusRef.current = lobbyStatus;
  }, [lobbyStatus]);

  const sendEventRef = useRef(sendEvent);
  useEffect(() => {
    sendEventRef.current = sendEvent;
  }, [sendEvent]);

  // ---------------------------------------------------------------------------
  // Connection → loading gate with grace period
  // ---------------------------------------------------------------------------
  // Instead of flipping `loading: true` instantly on disconnect (which hides the
  // entire game UI), we:
  //   1. Update the lightweight `connectionStatusAtom` immediately (for banner)
  //   2. Only set `loading: true` if the disconnection persists beyond the grace
  //      period — giving socket.io time to reconnect transparently.
  // ---------------------------------------------------------------------------
  const graceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasReceivedFirstSync = useRef(false);

  useEffect(() => {
    const isHealthy = isConnected && connectionStatus === "connected";

    // Always push the lightweight connection status for the banner
    if (isHealthy) {
      setConnectionStatus("connected");
    } else if (connectionStatus === "reconnecting") {
      setConnectionStatus("reconnecting");
    } else {
      setConnectionStatus("disconnected");
    }

    if (isHealthy) {
      // Connection restored — cancel any pending loading timer
      if (graceTimerRef.current) {
        clearTimeout(graceTimerRef.current);
        graceTimerRef.current = null;
      }
      // Don't clear loading here — lobby_state_sync will clear it with real data
      return;
    }

    // If we haven't received the first state sync yet, we're still in initial
    // loading — keep `loading: true` (it starts as true in initGameState).
    if (!hasReceivedFirstSync.current) {
      return;
    }

    // Connection is unhealthy — start grace timer before showing loading screen
    if (!graceTimerRef.current) {
      graceTimerRef.current = setTimeout(() => {
        graceTimerRef.current = null;
        updateGameState({ loading: true });
      }, LOADING_GRACE_PERIOD_MS);
    }

    return () => {
      if (graceTimerRef.current) {
        clearTimeout(graceTimerRef.current);
        graceTimerRef.current = null;
      }
    };
  }, [isConnected, connectionStatus, updateGameState, setConnectionStatus]);

  const handleLobbySyncRef = useRef((data: LobbySyncPayload) => {
    hasReceivedFirstSync.current = true;
    updateGameState({
      roundNumber: data.round_number,
      roundExample: data.topic_example,
      roundPrompt: data.topic_prompt,
      totalRounds: data.total_rounds,
      playerCount: data.player_count,
      timeRemaining: data.time_remaining_seconds ?? 0,
      roundName: data.topic_name || "",
      showCountDown:
        data.time_remaining_seconds! < 5 &&
        data.time_remaining_seconds! > 0 &&
        (data.status === "ROUND_BREAK" || data.status === "POST_GAME_SHOWCASE"),
      isRoundBreak: data.status === "ROUND_BREAK",
      isPostGameShowcase: data.status === "POST_GAME_SHOWCASE",
      scores: data.scores ?? [],
      slots: data.slots ?? [],
      loading: false, // Clear loading gate once we have confirmed state
      lobbyStatus: data.status,
    });
  });

  const handleLobbyTickRef = useRef((data: LobbyTickPayload) => {
    updateGameState({
      playerCount: data.player_count,
      timeRemaining: data.time_remaining_seconds ?? 0,
      scores: data.scores ?? [],
    });
    if (data.slot_heats) {
      setSlotHeat(data.slot_heats);
    }
  });

  const handleRoundOverRef = useRef((data: RoundOverPayload) => {
    updateGameState({
      isRoundBreak: true,
      scores: data.scores ?? [],
      accolades: data.accolades ?? [],
    });
    playSound("timeUp");
    // Request full state snapshot to populate slots for AnswerReveal
    (sendEventRef.current as (e: string, d: any) => void)("request_state_sync", undefined);
  });

  const handleRoundStartingSoonRef = useRef(() => {
    updateGameState({
      showCountDown: true,
    });
  });

  const handleNewRoundStartedRef = useRef((data: NewRoundStartedPayload) => {
    updateGameState({
      isRoundBreak: false,
      roundName: data.topic_name,
      roundExample: data.topic_example,
      roundPrompt: data.topic_prompt,
      slots: data.slots,
      roundNumber: data.round_number,
      showCountDown: false,
      accolades: [], // Clear accolades for new round
      lobbyStatus: "IN_ROUND", // Clear any stale WAITING/STARTING_SOON status
    });
    clearRoundHints();
    clearSlotHeat();
    playSound("newRound");
  });

  const handleGameOverRef = useRef((data: GameOverPayload) => {
    updateGameState({
      finalScore: data.final_scores,
      isPostGameShowcase: true,
      playerAccolades: data.player_accolades ?? [],
      showCountDown: false,
      timeRemaining: 0,
    });
    playSound("timeUp");
  });

  const handleWaitingForPlayersRef = useRef((data: WaitingForPlayersPayload) => {
    // If a round is already in progress (or we're in the break/showcase UI),
    // a stale `waiting_for_players` event must not flip us back to the
    // "Waiting for more idiots" panel. Only honor it when lobby is idle.
    const currentStatus = lobbyStatusRef.current;
    const isRoundActive =
      currentStatus === "IN_ROUND" ||
      currentStatus === "ROUND_BREAK" ||
      currentStatus === "POST_GAME_SHOWCASE";

    updateGameState({
      ...(isRoundActive ? {} : { lobbyStatus: "WAITING" }),
      playerCount: data.current_players,
      minPlayersNeeded: data.min_players_needed,
    });
  });

  const handleLobbyResettingRef = useRef(() => {
    updateGameState({
      roundNumber: 0,
      roundName: "",
      roundExample: "",
      roundPrompt: "",
      isRoundBreak: false,
      isPostGameShowcase: false,
      slots: [],
      scores: [],
      finalScore: [],
      playerAccolades: [],
      showCountDown: false,
    });
  });

  const handleSlotSnappedRef = useRef((data: SlotSnappedPayload) => {
    updateGameState({
      slots: data.slots,
      scores: data.scores,
    });
    playSound(getRandomSnappedSound());
  });

  const handleSubmissionFeedbackRef = useRef(
    (data: SubmissionFeedbackPayload) => {
      if (data.status === "success") {
        const animation = getRandomAttentionAnimation();

        // Find the slot to check if it's rare/bonus
        const slot = slotsRef.current.find((s) => s.id === data.id);
        const isBonus = slot?.is_rare || false;
        const playerColor = null;

        // Trigger visual and audio effects
        triggerCorrectAnswerEffects(data.id!, animation, isBonus, playerColor);
      }
    },
  );

  useEffect(() => {
    handleLobbySyncRef.current = (data: LobbySyncPayload) => {
      hasReceivedFirstSync.current = true;
      updateGameState({
        roundNumber: data.round_number,
        roundExample: data.topic_example,
        roundPrompt: data.topic_prompt,
        totalRounds: data.total_rounds,
        playerCount: data.player_count,
        timeRemaining: data.time_remaining_seconds ?? 0,
        roundName: data.topic_name,
        showCountDown:
          data.time_remaining_seconds! < 5 &&
          data.time_remaining_seconds! > 0 &&
          (data.status === "ROUND_BREAK" ||
            data.status === "POST_GAME_SHOWCASE"),
        isRoundBreak: data.status === "ROUND_BREAK",
        isPostGameShowcase: data.status === "POST_GAME_SHOWCASE", // Keep in sync with initial ref
        scores: data.scores ?? [],
        slots: data.slots ?? [],
        loading: false, // Clear loading gate once we have confirmed state
        lobbyStatus: data.status,
      });
    };

    handleSubmissionFeedbackRef.current = (data: SubmissionFeedbackPayload) => {
      if (data.status === "success") {
        const animation = getRandomAttentionAnimation();
        const slot = slotsRef.current.find((s) => s.id === data.id);
        const isBonus = slot?.is_rare || false;
        const playerColor = null;
        triggerCorrectAnswerEffects(data.id!, animation, isBonus, playerColor);
      }
    };
  }, [updateGameState, triggerCorrectAnswerEffects]);

  useEffect(() => {
    const cleanups = [
      onEvent("lobby_state_sync", (data: LobbySyncPayload) => {
        handleLobbySyncRef.current(data);
      }),
      onEvent("lobby_tick", (data: LobbyTickPayload) => {
        handleLobbyTickRef.current(data);
      }),
      onEvent("round_over", (data: RoundOverPayload) => {
        handleRoundOverRef.current(data);
      }),
      onEvent("round_starting_soon", () => {
        handleRoundStartingSoonRef.current();
      }),
      onEvent("new_round_started", (data: NewRoundStartedPayload) => {
        handleNewRoundStartedRef.current(data);
      }),
      onEvent("game_over", (data: any) => {
        handleGameOverRef.current(data);
      }),
      onEvent("lobby_resetting_for_new_game", () => {
        handleLobbyResettingRef.current();
      }),
      onEvent("slot_snapped", (data: SlotSnappedPayload) => {
        handleSlotSnappedRef.current(data);
      }),
      onEvent("submission_feedback", (data: SubmissionFeedbackPayload) => {
        handleSubmissionFeedbackRef.current(data);
      }),
      onEvent("waiting_for_players", (data: WaitingForPlayersPayload) => {
        handleWaitingForPlayersRef.current(data);
      }),
    ];
    return () => cleanups.forEach((fn) => fn?.());
  }, [onEvent]);

  return { sendEvent, connectionStatus, reconnect };
};
