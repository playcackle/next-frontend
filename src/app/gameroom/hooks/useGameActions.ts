import { useSetAtom } from "jotai";
import { useCallback, useMemo } from "react";
import {
  answerAtom,
  resetGameStateAtom,
  updateAnimationStateAtom,
} from "../store/gameAtoms";
import { getRandomSuccessSound, playSound } from "../utils";

export const useGameActions = () => {
  const setAnswer = useSetAtom(answerAtom);
  const updateAnimationState = useSetAtom(updateAnimationStateAtom);
  const resetGameState = useSetAtom(resetGameStateAtom);

  const applyDOMAnimation = useCallback(
    (slotId: string, animationType: string) => {
      const element = document.getElementById(`slot-${slotId}`) as HTMLElement;

      if (!element) {
        console.warn(`Element with slot ID ${slotId} not found`);
        return;
      }

      // Remove any existing animation classes
      element.classList.remove(
        "animate__shakeX",
        "animate__bounce",
        "animate__pulse",
        "animate__zoom",
        "animate__rotate",
        "animate__flash",
        "animate__glitter"
      );

      // Apply the new animation class
      element.classList.add(...animationType.split(" "));

      // Remove animation class after completion
      setTimeout(() => {
        element.classList.remove(...animationType.split(" "));
      }, 2000);
    },
    []
  );

  const resetAnimations = useMemo(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    return () => {
      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        updateAnimationState({
          attentionAnimation: "",
          slotId: null,
          showGlitter: false,
          showConfetti: false,
          confettiPosition: null,
          particlePosition: null,
          isBonus: false,
          playerColor: "",
        });
        timeoutId = null;
      }, 2000);
    };
  }, [updateAnimationState]);

  // Auto-clear animation state after timeout
  const setAnimationWithTimeout = useCallback(
    (animationUpdate: any, timeout = 400) => {
      updateAnimationState(animationUpdate);

      setTimeout(() => {
        if (animationUpdate.attentionAnimation !== undefined) {
          updateAnimationState({
            attentionAnimation: "",
          });
        }
      }, timeout);
    },
    [updateAnimationState]
  );

  const triggerCorrectAnswerEffects = useCallback(
    (
      slotId: string,
      animation: string,
      isBonus: boolean = false,
      playerColor: string | null
    ) => {
      const shouldShowConfetti = Math.random() < 0.4;

      // Calculate particle position based on DOM element
      let particlePosition = null;
      let confettiPosition = null;
      const element = document.getElementById(`slot-${slotId}`) as HTMLElement;

      if (element) {
        const rect = element.getBoundingClientRect();
        particlePosition = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
        confettiPosition = {
          x: rect.left + rect.width / 2,
          y: rect.top - 20, // Position 20px above the slot
        };
      } else {
        // Fallback position
        particlePosition = {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        };
        confettiPosition = {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2 - 50,
        };
      }

      // ENHANCED: Add color burst overlay effect
      const colorBurstOverlay = document.createElement("div");
      colorBurstOverlay.className = `colorBurstOverlay ${
        isBonus ? "bonus" : ""
      }`;
      document.body.appendChild(colorBurstOverlay);

      // Remove color burst after animation
      setTimeout(() => {
        if (colorBurstOverlay.parentNode) {
          colorBurstOverlay.parentNode.removeChild(colorBurstOverlay);
        }
      }, 1200);

      // ENHANCED: Add screen shake to the main container
      const mainContainer = (document.querySelector(".main") ||
        document.body) as HTMLElement;
      mainContainer.style.animation = "fullScreenShake 0.6s ease-in-out";

      // Remove screen shake after animation
      setTimeout(() => {
        mainContainer.style.animation = "";
      }, 600);

      // ENHANCED: Add success glow to the slot element
      if (element) {
        const glowElement = document.createElement("div") as HTMLElement;
        glowElement.className = `successGlow ${isBonus ? "bonus" : ""}`;
        element.style.position = "relative";
        element.appendChild(glowElement);

        // Remove glow after animation
        setTimeout(() => {
          if (glowElement.parentNode) {
            glowElement.parentNode.removeChild(glowElement);
          }
        }, 1500);
      }

      updateAnimationState({
        slotId: slotId,
        attentionAnimation: animation,
        isBonus,
        playerColor: playerColor || "",
        particlePosition,
        confettiPosition,
        showConfetti: shouldShowConfetti, // Use random chance instead of always true
        showGlitter: true,
      });

      // Apply DOM animation
      applyDOMAnimation(slotId, animation);

      try {
        if (isBonus) {
          playSound("bonus");
          // Double sound for bonus slots
          setTimeout(() => playSound("bonus"), 200);
        } else {
          const sound = getRandomSuccessSound();
          playSound(sound);
        }
      } catch (error) {
        console.warn("Failed to play sound:", error);
      }

      // Reset animations after completion
      resetAnimations();
    },
    [updateAnimationState, applyDOMAnimation, resetAnimations]
  );

  const submitAnswer = (
    answer: string,
    sendEvent: (event: string, data: any) => void
  ) => {
    if (!answer.trim()) return;
    sendEvent("submit_answer", answer);
    setAnswer("");
  };

  return {
    submitAnswer,
    resetGameState,
    triggerCorrectAnswerEffects,
    setAnimationWithTimeout,
  };
};
