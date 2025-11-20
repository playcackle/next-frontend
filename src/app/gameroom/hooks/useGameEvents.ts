import { useEffect, useRef } from "react";
import {
  LobbySyncPayload,
  LobbyTickPayload,
  NewRoundStartedPayload,
  RoundOverPayload,
  SlotSnappedPayload,
  SubmissionFeedbackPayload,
} from "../types/payloads";
import { getRandomAttentionAnimation } from "../utils";
import { useGameActions } from "./useGameActions";
import { useGameSocket } from "./useGameSocket";
import { useGameState } from "./useGameState";

export const useGameEvents = (gameWsUrl: string, token: string) => {
  const { onEvent, sendEvent, isConnected } = useGameSocket(gameWsUrl, token);
  const { updateGameState, slots } = useGameState();
  const { triggerCorrectAnswerEffects } = useGameActions();

  const slotsRef = useRef(slots);
  useEffect(() => {
    slotsRef.current = slots;
  }, [slots]);

  useEffect(() => {
    updateGameState({ loading: !isConnected });
  }, [isConnected, updateGameState]);

  const handleLobbySyncRef = useRef((data: LobbySyncPayload) => {
    updateGameState({
      roundNumber: data.round_number,
      totalRounds: data.total_rounds,
      playerCount: data.player_count,
      timeRemaining: data.time_remaining_seconds ?? 0,
      roundName: data.topic_name || "",
      showCountDown:
        data.time_remaining_seconds! < 5 &&
        data.time_remaining_seconds! > 0 &&
        (data.status === "ROUND_BREAK" || data.status === "POST_GAME_SHOWCASE"),
      isRoundBreak: data.status === "ROUND_BREAK",
      scores: data.scores ?? [],
      slots: data.slots ?? [],
    });
  });

  const handleLobbyTickRef = useRef((data: LobbyTickPayload) => {
    updateGameState({
      playerCount: data.player_count,
      timeRemaining: data.time_remaining_seconds ?? 0,
      scores: data.scores ?? [],
    });
  });

  const handleRoundOverRef = useRef((data: RoundOverPayload) => {
    updateGameState({
      isRoundBreak: true,
      scores: data.scores ?? [],
    });
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
      slots: data.slots,
      roundNumber: data.round_number,
      showCountDown: false,
    });
  });

  const handleGameOverRef = useRef((data: any) => {
    updateGameState({
      finalScore: data.final_scores,
    });
  });

  const handleLobbyResettingRef = useRef(() => {
    updateGameState({
      roundNumber: 0,
      roundName: "",
      isRoundBreak: false,
      slots: [],
      scores: [],
      finalScore: [],
      showCountDown: false,
    });
  });

  const handleSlotSnappedRef = useRef((data: SlotSnappedPayload) => {
    updateGameState({
      slots: data.slots,
      scores: data.scores,
    });
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
    }
  );

  useEffect(() => {
    handleLobbySyncRef.current = (data: LobbySyncPayload) => {
      updateGameState({
        roundNumber: data.round_number,
        totalRounds: data.total_rounds,
        playerCount: data.player_count,
        timeRemaining: data.time_remaining_seconds ?? 0,
        roundName: data.topic_name || "",
        showCountDown:
          data.time_remaining_seconds! < 5 &&
          data.time_remaining_seconds! > 0 &&
          (data.status === "ROUND_BREAK" ||
            data.status === "POST_GAME_SHOWCASE"),
        isRoundBreak: data.status === "ROUND_BREAK",
        scores: data.scores ?? [],
        slots: data.slots ?? [],
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
    onEvent("lobby_state_sync", (data) => handleLobbySyncRef.current(data));
    onEvent("lobby_tick", (data) => handleLobbyTickRef.current(data));
    onEvent("round_over", (data) => handleRoundOverRef.current(data));
    onEvent("round_starting_soon", () => handleRoundStartingSoonRef.current());
    onEvent("new_round_started", (data) =>
      handleNewRoundStartedRef.current(data)
    );
    onEvent("game_over", (data) => handleGameOverRef.current(data));
    onEvent("lobby_resetting_for_new_game", () =>
      handleLobbyResettingRef.current()
    );
    onEvent("slot_snapped", (data) => handleSlotSnappedRef.current(data));
    onEvent("submission_feedback", (data) =>
      handleSubmissionFeedbackRef.current(data)
    );
  }, [onEvent]);

  return { sendEvent };
};
