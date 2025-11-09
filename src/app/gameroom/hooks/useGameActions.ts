import { useAtom, useSetAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";
import {
  answerAtom,
  resetGameStateAtom,
  updateAnimationStateAtom,
} from "../store/gameAtoms";
import { AnimationState } from "../types/state";
import { getRandomSuccessSound, playSound } from "../utils";

const initialAnimationState: AnimationState = {
  slotId: null,
  showGlitter: false,
  nameFlash: false,
  shake: false,
  colorFlash: false,
  zoomEffect: false,
  rotateEffect: false,
  particlePosition: null,
  isBonus: false,
  playerColor: "",
  attentionAnimation: "",
  confettiPosition: null,
  showConfetti: false,
};

export const useGameActions = () => {
  const setAnswer = useSetAtom(answerAtom);
  const [updateAnimationState, setUpdateAnimationSet] = useAtom(
    updateAnimationStateAtom
  );
  const resetGameState = useSetAtom(resetGameStateAtom);
  const [animationState, setAnimationState] = useState<AnimationState>(
    initialAnimationState
  );

  const applyDOMAnimation = useCallback(
    (slotId: string, animationType: string) => {
      const element = document.querySelector(
        `[data-slot-id="${slotId}"]`
      ) as HTMLElement;

      if (!element) {
        console.warn(`Element with slot ID ${slotId} not found`);
        return;
      }

      // Remove any existing animation classes
      element.classList.remove(
        "animate-shake",
        "animate-bounce",
        "animate-pulse",
        "animate-zoom",
        "animate-rotate",
        "animate-flash",
        "animate-glitter"
      );

      // Apply the new animation class
      element.classList.add(`animate-${animationType}`);

      // Remove animation class after completion
      setTimeout(() => {
        element.classList.remove(`animate-${animationType}`);
      }, 2000);
    },
    []
  );

  const resetAnimations = useMemo(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    return () => {
      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        setAnimationState(initialAnimationState);
        // Also clear Jotai animation state
        setUpdateAnimationSet({
          attentionAnimation: "",
          slotId: "",
        });
        timeoutId = null;
      }, 2000);
    };
  }, [updateAnimationState]);

  // Auto-clear animation state after timeout
  const setAnimationWithTimeout = useCallback(
    (animationUpdate: any, timeout = 400) => {
      setUpdateAnimationSet(animationUpdate);

      setTimeout(() => {
        if (animationUpdate.attentionAnimation !== undefined) {
          setUpdateAnimationSet({
            attentionAnimation: "",
            slotId: "",
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
      // Calculate particle position based on DOM element
      let particlePosition = null;
      const element = document.querySelector(`[data-slot-id="${slotId}"]`);

      if (element) {
        const rect = element.getBoundingClientRect();
        particlePosition = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      } else {
        // Fallback position
        particlePosition = { x: 100 / 2, y: 100 / 2 };
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
      const mainContainer = document.querySelector(".main") || document.body;
      mainContainer.style.animation = "fullScreenShake 0.6s ease-in-out";

      // Remove screen shake after animation
      setTimeout(() => {
        mainContainer.style.animation = "";
      }, 600);

      // ENHANCED: Add success glow to the slot element
      if (element) {
        const glowElement = document.createElement("div");
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

      // Update both animation states
      setAnimationWithTimeout({
        attentionAnimation: animation,
        animatingTile: slotId,
      });

      setAnimationState({
        slotId: slotId,
        isBonus,
        playerColor,
        attentionAnimation: animation,
        particlePosition,
        showConfetti: false,
        confettiPosition: null,
        showGlitter: true,
        nameFlash: true,
        shake: true, // ENHANCED: Now enable shake
        colorFlash: true,
        zoomEffect: true,
        rotateEffect: true, // ENHANCED: Enable rotation for extra chaos
      });

      // Apply DOM animation
      applyDOMAnimation(slotId, animation);

      // ENHANCED: Play appropriate sound with enhanced volume/effects
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
    [setAnimationWithTimeout, applyDOMAnimation, resetAnimations]
  );

  // Get current animation state
  const getCurrentAnimationState = useCallback(() => {
    return animationState;
  }, [animationState]);

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
    getCurrentAnimationState,
    animationState,
  };
};
