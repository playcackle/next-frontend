import { useEffect } from "react";
import {
  LobbySyncPayload,
  LobbyTickPayload,
  NewRoundStartedPayload,
  RoundOverPayload,
  SlotSnappedPayload,
  SubmissionFeedbackPayload,
} from "../types/payloads";
import { getRandomAttentionAnimation } from "../utils";
import { useGameSocket } from "./useGameSocket";
import { useAnimationState, useGameState } from "./useGameState";
import { useGameActions } from "./useGameActions";

export const useGameEvents = (gameWsUrl: string, token: string) => {
  const { onEvent, sendEvent, isConnected } = useGameSocket(gameWsUrl, token);
  const { updateGameState, slots, gameState } = useGameState();
  const { updateAnimationState } = useAnimationState();
  const { triggerCorrectAnswerEffects } = useGameActions();

  const setAnimationWithClear = (animationUpdate: any, delay = 100) => {
    updateAnimationState(animationUpdate);
    setTimeout(() => {
      if (animationUpdate.attentionAnimation !== undefined) {
        updateAnimationState({
          attentionAnimation: "",
          slotId: "",
        });
      }
    }, delay);
  };

  useEffect(() => {
    updateGameState({ loading: !isConnected });
  }, [isConnected]);

  useEffect(() => {
    // Lobby tick event
    onEvent("lobby_state_sync", (data: LobbySyncPayload) => {
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
    });
    onEvent("lobby_tick", (data: LobbyTickPayload) => {
      updateGameState({
        playerCount: data.player_count,
        timeRemaining: data.time_remaining_seconds ?? 0,
        scores: data.scores ?? [],
      });
    });

    // Round over events
    onEvent("round_over", (data: RoundOverPayload) => {
      updateGameState({
        isRoundBreak: true,
        slots: [],
        scores: data.scores ?? [],
      });
    });

    onEvent("round_starting_soon", () => {
      updateGameState({
        showCountDown: true,
      });
    });

    // New round starting
    onEvent("new_round_started", (data: NewRoundStartedPayload) => {
      updateGameState({
        isRoundBreak: false,
        roundName: data.topic_name,
        slots: data.slots,
        roundNumber: data.round_number,
        showCountDown: false,
      });
    });

    // Game over
    onEvent("game_over", (data) => {
      updateGameState({
        finalScore: data.final_scores,
      });
    });

    // Lobby resetting for new game
    onEvent("lobby_resetting_for_new_game", () => {
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

    onEvent("slot_snapped", (data: SlotSnappedPayload) => {
      debugger;
      updateGameState({
        slots: data.slots,
        scores: data.scores,
      });
    });

    // Submission feedback
    onEvent("submission_feedback", (data: SubmissionFeedbackPayload) => {
      if (data.status === "success") {
        const animation = getRandomAttentionAnimation();

        // Find the slot to check if it's rare/bonus
        const slot = slots.find((s) => s.id === data.id);
        const isBonus = slot?.is_rare || false;
        const playerColor = null; // Could be enhanced to get player color

        // Trigger visual and audio effects
        triggerCorrectAnswerEffects(
          data.id!,
          animation,
          isBonus,
          playerColor
        );
      }
    });
  }, [
    onEvent,
    slots,
    gameState,
    updateGameState,
    updateAnimationState,
    triggerCorrectAnswerEffects,
  ]);

  return { sendEvent };
};
