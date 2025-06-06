import { useEffect } from "react";
import {
  LobbyTickPayload,
  NewRoundStartingPayload,
  RoundOverPayload,
  SlotSnappedPayload,
  SubmissionFeedbackPayload,
} from "../types/payloads";
import { Slot } from "../types/state";
import {
  getRandomAttentionAnimation,
  getRandomEntranceAnimation,
} from "../utils";
import { useGameSocket } from "./useGameSocket";
import { useAnimationState, useGameState } from "./useGameState";

export const useGameEvents = (gameWsUrl: string, token: string) => {
  const { onEvent, sendEvent, isConnected } = useGameSocket(gameWsUrl, token);
  const { updateGameState, slots, gameState } = useGameState();
  const { updateAnimationState } = useAnimationState();

  const setAnimationWithClear = (animationUpdate: any, delay = 100) => {
    console.log("set animate");
    updateAnimationState(animationUpdate);
    setTimeout(() => {
      if (animationUpdate.entranceAnimation !== undefined) {
        updateAnimationState({ entranceAnimation: "" });
      }
      if (animationUpdate.attentionAnimation !== undefined) {
        updateAnimationState({
          attentionAnimation: "",
          animatingSlotId: "",
        });
      }
    }, delay);
  };

  useEffect(() => {
    updateGameState({ loading: !isConnected });
  }, [isConnected]);

  useEffect(() => {
    // Lobby tick event
    onEvent("lobby_state_sync", (data: LobbyTickPayload) => {
      updateGameState({
        roundNumber: data.current_round,
        playerCount: data.player_count,
        timeRemaining: data.time_remaining_seconds ?? 0,
        roundName: data.topic_name || "",
        showCountDown:
          data.time_remaining_seconds! < 6 &&
          data.time_remaining_seconds! > 0 &&
          (data.status === "ROUND_BREAK" ||
            data.status === "POST_GAME_SHOWCASE"),
        isRoundBreak: data.status === "ROUND_BREAK",
        scores: data.scores,
        slots: data.slots || [],
      });
    });
    onEvent("lobby_tick", (data: LobbyTickPayload) => {
      updateGameState({
        playerCount: data.player_count,
        timeRemaining: data.time_remaining_seconds ?? 0,
        isRoundBreak: data.status === "ROUND_BREAK",
        scores: data.scores,
      });
    });

    // Round over events
    onEvent("round_over", (data: RoundOverPayload) => {
      console.log("round over");
      updateGameState({
        isRoundBreak: true,
        slots: [],
        scores: data.player_scores || [],
      });
    });

    onEvent("round_starting_soon", () => {
      updateGameState({
        showCountDown: true,
        isRoundBreak: false,
      });
    });

    // New round starting
    onEvent("new_round_started", (data: NewRoundStartingPayload) => {
      setAnimationWithClear({
        entranceAnimation: getRandomEntranceAnimation(),
      });
      updateGameState({
        isRoundBreak: false,
        roundName: data.topic_name,
        slots: data.active_slots,
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

    onEvent("slot_snapped", (data: SlotSnappedPayload) => {
      const slot = slots.find((x) => x.id === data.id);
      if (slot) {
        const otherSlots = slots.filter((x: Slot) => x.id !== data.id);
        updateGameState({ slots: [...otherSlots, slot] });
      }
    });

    // Submission feedback
    onEvent("submission_feedback", (data: SubmissionFeedbackPayload) => {
      if (data.status === "success") {
        const animation = getRandomAttentionAnimation();
        updateAnimationState({
          attentionAnimation: animation,
          animatingSlotId: data.id!,
        });

        // Play success sound
        if (typeof window !== "undefined" && "playFallbackAudio" in window) {
          (window as any).playFallbackAudio();
        }
      }
    });
  }, [onEvent, slots, gameState, updateGameState, updateAnimationState]);

  return { sendEvent };
};
