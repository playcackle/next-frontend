import { useMemo } from "react";
import {
  debounce,
  getRandomAttentionAnimation,
  getRandomEntranceAnimation,
} from "../utils";

export const createOptimizedGameHandlers = ({
  updateGameState,
  setSubmitting,
  setAnswer,
  triggerCorrectAnimations,
  mainRef,
  gameRoomWs,
  gameState,
  setSlots,
}: any) => {
  // ==================== FORM SUBMISSION ====================

  // Prevent double-click submissions and rapid-fire answers
  const debouncedHandleSubmitAnswer = useMemo(
    () =>
      debounce((e: React.FormEvent) => {
        e.preventDefault();

        // Validation checks
        if (!gameState.answer.trim() || gameState.isSubmitting || !gameRoomWs) {
          return;
        }

        // Submit the answer
        setSubmitting(true);
        const success = gameRoomWs.sendEvent("submit_answer", gameState.answer);

        if (success) {
          setAnswer(""); // Clear input on successful submission
        } else {
          setSubmitting(false); // Reset if submission failed
        }
      }, 300), // 300ms debounce - prevents accidental double submissions
    [
      gameState.answer,
      gameState.isSubmitting,
      gameRoomWs,
      setSubmitting,
      setAnswer,
    ]
  );

  // ==================== GAME EVENT HANDLERS ====================

  // Handle frequent lobby updates smoothly
  const debouncedHandleLobbyTick = useMemo(
    () =>
      debounce((data: any) => {
        updateGameState({
          playerCount: data.player_count,
          timeRemaining: data.time_remaining_seconds ?? 0,
        });
      }, 100), // 100ms debounce for smooth timer updates
    [updateGameState]
  );

  // Handle submission feedback with animation coordination
  const debouncedHandleSubmissionFeedback = useMemo(
    () =>
      debounce((data: any) => {
        console.log("[Game WS] Submission feedback:", data);
        setSubmitting(false);

        if (data.status === "correct") {
          // Trigger success animations and sounds
          const animation = getRandomAttentionAnimation();
          updateGameState({
            attentionAnimation: animation,
            animatingTile: data.slot_id!,
          });

          triggerCorrectAnimations(
            parseInt(data.slot_id!),
            null,
            mainRef,
            false
          );

          // Play success sound if available
          if (typeof window !== "undefined" && "playFallbackAudio" in window) {
            (window as any).playFallbackAudio();
          }
        }
      }, 200), // 200ms debounce prevents animation conflicts
    [setSubmitting, updateGameState, triggerCorrectAnimations]
  );

  // ==================== RETURN OPTIMIZED HANDLERS ====================

  return {
    // Form handlers
    handleSubmitAnswer: (e: React.FormEvent) => {
      e.preventDefault();
      debouncedHandleSubmitAnswer(e);
    },

    // Game event handlers
    handleLobbyTick: (data: any) => debouncedHandleLobbyTick(data),
    handleSubmissionFeedback: (data: any) =>
      debouncedHandleSubmissionFeedback(data),

    // Immediate handlers (no debouncing needed)
    handleRoundOverTimeout: (data: any) => {
      updateGameState({
        playerScore: data.player_scores,
        isIntermission: true,
      });
    },

    handleNewRoundStarting: (data: any) => {
      const entranceAnimation = getRandomEntranceAnimation();
      updateGameState({
        entranceAnimation,
        isIntermission: false,
      });
      setSlots(data.answer_slots);
    },

    handleRoundOverAllSnapped: (data: any) => {
      updateGameState({
        playerScore: data.player_scores,
        isIntermission: true,
      });
    },

    handleGameOver: (data: any) => {
      updateGameState({
        finalScore: data.final_scores,
      });
    },
  };
};
