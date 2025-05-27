"use client";

import { useCallback, useMemo, useState } from "react";
import type { AnimationState } from "../types";
import { getRandomSuccessSound, playSound } from "../utils";

const initialAnimationState: AnimationState = {
  animatingTile: null,
  showGlitter: false,
  nameFlash: false,
  shake: false,
  colorFlash: false,
  zoomEffect: false,
  rotateEffect: false,
  particlePosition: null,
  isBonus: false,
  playerColor: undefined,
};

export const useAnimations = () => {
  const [animationState, setAnimationState] = useState<AnimationState>(
    initialAnimationState
  );

  // Memoize animation reset timeout to prevent recreation
  const resetAnimations = useMemo(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    return () => {
      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        setAnimationState(initialAnimationState);
        timeoutId = null;
      }, 2000);
    };
  }, []);

  // Trigger animations for a correct answer
  const triggerCorrectAnimations = useCallback(
    (
      questionId: number,
      event: React.MouseEvent | null = null,
      mainRef: React.RefObject<HTMLDivElement | null>,
      isBonus: boolean,
      playerColor?: string
    ) => {
      // Calculate particle position
      let particlePosition = null;
      if (event) {
        particlePosition = { x: event.clientX, y: event.clientY };
      } else if (mainRef.current) {
        const rect = mainRef.current.getBoundingClientRect();
        particlePosition = {
          x: rect.width / 2,
          y: rect.height / 2,
        };
      }

      // Set new animation state
      setAnimationState({
        animatingTile: questionId,
        showGlitter: true,
        nameFlash: true,
        shake: true,
        colorFlash: Math.random() > 0.5,
        zoomEffect: Math.random() > 0.5,
        rotateEffect: Math.random() > 0.7,
        isBonus,
        playerColor,
        particlePosition,
      });

      // Play appropriate sound
      try {
        if (isBonus) {
          playSound("bonus");
        } else {
          playSound(getRandomSuccessSound());
        }
      } catch (error) {
        console.warn("Failed to play sound:", error);
      }

      // Reset animations after completion
      resetAnimations();
    },
    [resetAnimations]
  );

  return {
    animationState,
    triggerCorrectAnimations,
  };
};
