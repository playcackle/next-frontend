import { useSetAtom, useStore } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  clearRoundHintsAtom,
  clearSlotHeatAtom,
  clearUnifiedMessagesAtom,
  connectionStatusAtom,
  gameStateAtom,
  lobbyStatusAtom,
  playAgainStateAtom,
  resetPlayAgainStateAtom,
  slotHeatAtom,
  updateGameStateAtom,
  updatePlayAgainStateAtom,
} from "../store/gameAtoms";
import {
  GameOverPayload,
  LobbySyncPayload,
  LobbyTickPayload,
  NewRoundStartedPayload,
  PlayAgainCountUpdatePayload,
  PlayAgainPlayerUpdatePayload,
  PlayAgainPromptPayload,
  PlayAgainResultPayload,
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
import { useGameActions } from "./useGameActions";
import { useGameSocket } from "./useGameSocket";

/** Grace period (ms) before a disconnection triggers the full loading screen.
 *  Brief blips (< 3s) show only the reconnection banner, not the loading overlay. */
const LOADING_GRACE_PERIOD_MS = 3000;

export const useGameEvents = (gameWsUrl: string, token: string) => {
  const router = useRouter();
  const { onEvent, sendEvent, isConnected, connectionStatus, reconnect } =
    useGameSocket(gameWsUrl, token);
  const { triggerCorrectAnswerEffects } = useGameActions();
  const store = useStore();

  // All Jotai setters are stable references — never cause effect re-runs
  const updateGameState = useSetAtom(updateGameStateAtom);
  const clearRoundHints = useSetAtom(clearRoundHintsAtom);
  const clearUnifiedMessages = useSetAtom(clearUnifiedMessagesAtom);
  const setSlotHeat = useSetAtom(slotHeatAtom);
  const clearSlotHeat = useSetAtom(clearSlotHeatAtom);
  const setConnectionStatus = useSetAtom(connectionStatusAtom);
  const updatePlayAgainState = useSetAtom(updatePlayAgainStateAtom);
  const resetPlayAgainState = useSetAtom(resetPlayAgainStateAtom);

  // triggerCorrectAnswerEffects closes over performanceModeAtom which can change;
  // a ref prevents re-registering all socket listeners on performance mode toggle
  const triggerEffectsRef = useRef(triggerCorrectAnswerEffects);
  useEffect(() => {
    triggerEffectsRef.current = triggerCorrectAnswerEffects;
  }, [triggerCorrectAnswerEffects]);

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

    if (isHealthy) {
      setConnectionStatus("connected");
    } else if (connectionStatus === "reconnecting") {
      setConnectionStatus("reconnecting");
    } else if (connectionStatus === "disconnected") {
      setConnectionStatus("disconnected");
    }

    if (isHealthy) {
      if (graceTimerRef.current) {
        clearTimeout(graceTimerRef.current);
        graceTimerRef.current = null;
      }
      return;
    }

    if (!hasReceivedFirstSync.current) return;

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

  useEffect(() => {
    const cleanups = [
      onEvent("lobby_state_sync", (data: LobbySyncPayload) => {
        hasReceivedFirstSync.current = true;
        updateGameState({
          roundNumber: data.round_number,
          roundExample: data.topic_example,
          roundPrompt: data.topic_prompt,
          totalRounds: data.total_rounds,
          playerCount: data.player_count,
          timeRemaining: data.time_remaining_seconds ?? 0,
          roundName: data.topic_name ?? "",
          showCountDown:
            data.time_remaining_seconds! < 5 &&
            data.time_remaining_seconds! > 0 &&
            (data.status === "ROUND_BREAK" ||
              data.status === "POST_GAME_SHOWCASE"),
          isRoundBreak: data.status === "ROUND_BREAK",
          scores: data.scores ?? [],
          slots: data.slots ?? [],
          loading: false,
          lobbyStatus: data.status,
        });
        
        // Restore opt-in state from state sync (for reconnects during showcase)
        if (data.status === "POST_GAME_SHOWCASE" && data.play_again_state) {
          updatePlayAgainState({
            showPrompt: true,
            confirmedCount: data.play_again_state.confirmed_count,
            totalWaiting: data.play_again_state.total_waiting,
            neededToStart: data.play_again_state.needed_to_start,
          });
        } else if (data.status !== "POST_GAME_SHOWCASE") {
          resetPlayAgainState();
        }
      }),

      onEvent("lobby_tick", (data: LobbyTickPayload) => {
        updateGameState({
          playerCount: data.player_count,
          timeRemaining: data.time_remaining_seconds ?? 0,
          scores: data.scores ?? [],
        });
        if (data.slot_heats) {
          setSlotHeat(data.slot_heats);
        }
      }),

      onEvent("round_over", (data: RoundOverPayload) => {
        updateGameState({
          isRoundBreak: true,
          lobbyStatus: "ROUND_BREAK",
          scores: data.scores ?? [],
          accolades: data.accolades ?? [],
          timeRemaining: data.break_duration_seconds ?? 0,
        });
        playSound("timeUp");
        (sendEvent as (e: string, d: any) => void)(
          "request_state_sync",
          undefined,
        );
      }),

      onEvent("round_starting_soon", () => {
        updateGameState({ showCountDown: true });
      }),

      onEvent("new_round_started", (data: NewRoundStartedPayload) => {
        updateGameState({
          isRoundBreak: false,
          roundName: data.topic_name,
          roundExample: data.topic_example,
          roundPrompt: data.topic_prompt,
          slots: data.slots,
          roundNumber: data.round_number,
          showCountDown: false,
          accolades: [],
          lobbyStatus: "IN_ROUND",
        });
        clearRoundHints();
        clearSlotHeat();
        playSound("newRound");
      }),

      onEvent("game_over", (data: GameOverPayload) => {
        updateGameState({
          finalScore: data.final_scores,
          playerAccolades: data.player_accolades ?? [],
          showCountDown: false,
          timeRemaining: 0,
          isRoundBreak: false,
          lobbyStatus: "POST_GAME_SHOWCASE",
        });
        playSound("timeUp");
      }),

      onEvent("play_again_prompt", (data: PlayAgainPromptPayload) => {
        updatePlayAgainState({
          showPrompt: true,
          timeoutSeconds: data.timeout_seconds,
          minPlayers: data.min_players,
          playersWaiting: data.players_waiting,
          confirmedCount: 0,
          totalWaiting: data.players_waiting,
          neededToStart: Math.max(0, data.min_players),
          userResponse: null,
          playerResponses: {}, // Reset individual responses when new prompt appears
        });
      }),

      onEvent("play_again_count_update", (data: PlayAgainCountUpdatePayload) => {
        updatePlayAgainState({
          confirmedCount: data.confirmed_count,
          totalWaiting: data.total_waiting,
          neededToStart: data.needed_to_start,
        });
      }),

      onEvent("play_again_player_update", (data: PlayAgainPlayerUpdatePayload) => {
        // Update the individual player response so UI can show who opted in/out
        updatePlayAgainState({
          playerResponses: {
            ...store.get(playAgainStateAtom).playerResponses,
            [data.player_id]: {
              displayName: data.display_name,
              response: data.response,
            },
          },
        });
      }),

      onEvent("play_again_result", () => {
        // Result received - no action needed, userResponse already set
      }),

      onEvent("lobby_resetting_for_new_game", () => {
        const playAgainState = store.get(playAgainStateAtom);

        // Clear the game state for new round
        updateGameState({
          roundNumber: 0,
          roundName: "",
          roundExample: "",
          roundPrompt: "",
          isRoundBreak: false,
          slots: [],
          scores: [],
          finalScore: [],
          playerAccolades: [],
          showCountDown: false,
          lobbyStatus: "WAITING",
        });
        clearUnifiedMessages();
        
        // If player opted in ("yes"), stay in lobby to receive new game content
        // Otherwise redirect to home
        if (playAgainState.userResponse !== "yes") {
          store.set(resetPlayAgainStateAtom);
          router.push("/");
        } else {
          // Reset play again state for the new game
          store.set(resetPlayAgainStateAtom);
        }
      }),

      onEvent("slot_snapped", (data: SlotSnappedPayload) => {
        updateGameState({
          slots: data.slots,
          scores: data.scores,
        });
        playSound(getRandomSnappedSound());
      }),

      onEvent("submission_feedback", (data: SubmissionFeedbackPayload) => {
        if (data.status === "success") {
          const animation = getRandomAttentionAnimation();
          const slots = store.get(gameStateAtom).slots;
          const slot = slots.find((s) => s.id === data.id);
          triggerEffectsRef.current(
            data.id!,
            animation,
            slot?.is_rare ?? false,
            null,
          );
        }
      }),

      onEvent("waiting_for_players", (data: WaitingForPlayersPayload) => {
        const currentStatus = store.get(gameStateAtom).lobbyStatus;
        const isRoundActive =
          currentStatus === "IN_ROUND" ||
          currentStatus === "ROUND_BREAK" ||
          currentStatus === "POST_GAME_SHOWCASE";
        updateGameState({
          ...(isRoundActive ? {} : { lobbyStatus: "WAITING" }),
          playerCount: data.current_players,
          minPlayersNeeded: data.min_players_needed,
        });
      }),
    ];

    return () => cleanups.forEach((fn) => fn?.());
  }, [
    onEvent,
    updateGameState,
    clearRoundHints,
    clearSlotHeat,
    clearUnifiedMessages,
    setSlotHeat,
    sendEvent,
    router,
    store,
  ]);

  return { sendEvent, connectionStatus, reconnect };
};
