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
} from "../types/payloads";
import {
  getRandomAttentionAnimation,
  getRandomSnappedSound,
  playSound,
} from "../utils";
import { clearRoundHintsAtom, clearSlotHeatAtom, slotHeatAtom } from "../store/gameAtoms";
import { useGameActions } from "./useGameActions";
import { useGameSocket } from "./useGameSocket";
import { useGameState } from "./useGameState";

export const useGameEvents = (gameWsUrl: string, token: string) => {
  const { onEvent, sendEvent, isConnected, connectionStatus } = useGameSocket(gameWsUrl, token);
  const { updateGameState, slots } = useGameState();
  const { triggerCorrectAnswerEffects } = useGameActions();
  const clearRoundHints = useSetAtom(clearRoundHintsAtom);
  const setSlotHeat = useSetAtom(slotHeatAtom);
  const clearSlotHeat = useSetAtom(clearSlotHeatAtom);

  const slotsRef = useRef(slots);
  useEffect(() => {
    slotsRef.current = slots;
  }, [slots]);

  const sendEventRef = useRef(sendEvent);
  useEffect(() => {
    sendEventRef.current = sendEvent;
  }, [sendEvent]);

  useEffect(() => {
    const isUncertain = !isConnected || connectionStatus === "reconnecting";
    updateGameState({ loading: isUncertain });
  }, [isConnected, connectionStatus, updateGameState]);

  const handleLobbySyncRef = useRef((data: LobbySyncPayload) => {
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
    onEvent("lobby_state_sync", (data: LobbySyncPayload) =>
      handleLobbySyncRef.current(data),
    );
    onEvent("lobby_tick", (data: LobbyTickPayload) =>
      handleLobbyTickRef.current(data),
    );
    onEvent("round_over", (data: RoundOverPayload) =>
      handleRoundOverRef.current(data),
    );
    onEvent("round_starting_soon", () => handleRoundStartingSoonRef.current());
    onEvent("new_round_started", (data: NewRoundStartedPayload) =>
      handleNewRoundStartedRef.current(data),
    );
    onEvent("game_over", (data: any) => handleGameOverRef.current(data));
    onEvent("lobby_resetting_for_new_game", () =>
      handleLobbyResettingRef.current(),
    );
    onEvent("slot_snapped", (data: SlotSnappedPayload) =>
      handleSlotSnappedRef.current(data),
    );
    onEvent("submission_feedback", (data: SubmissionFeedbackPayload) =>
      handleSubmissionFeedbackRef.current(data),
    );
  }, [onEvent]);

  return { sendEvent, connectionStatus };
};
