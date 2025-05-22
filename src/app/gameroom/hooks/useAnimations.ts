"use client";

import type React from "react";

import { useCallback, useState } from "react";
import type { AnimationState } from "../types";
import { getRandomSuccessSound, playSound } from "../utils";

export const useAnimations = () => {
  const [animationState, setAnimationState] = useState<AnimationState>({
    animatingTile: null,
    showGlitter: false,
    nameFlash: false,
    screenShake: false,
    colorFlash: false,
    zoomEffect: false,
    rotateEffect: false,
    particlePosition: null,
    isBonus: false,
    playerColor: undefined,
  });

  // Trigger animations for a correct answer
  const triggerCorrectAnimations = useCallback(
    (
      questionId: number,
      event: React.MouseEvent | null = null,
      mainRef: React.RefObject<HTMLDivElement | null>,
      playerColor?: string
    ) => {
      // Determine if it's a bonus question
      const isCurrentBonus = questionId > 8;

      setAnimationState((prev) => ({
        ...prev,
        animatingTile: questionId,
        showGlitter: true,
        nameFlash: true,
        screenShake: true,
        colorFlash: Math.random() > 0.5, // Random chance
        zoomEffect: Math.random() > 0.5, // Random chance
        rotateEffect: Math.random() > 0.7, // Random chance
        isBonus: isCurrentBonus,
        playerColor: playerColor, // Store player color in animation state
        particlePosition: event
          ? { x: event.clientX, y: event.clientY }
          : mainRef.current
          ? {
              x: mainRef.current.getBoundingClientRect().width / 2,
              y: mainRef.current.getBoundingClientRect().height / 2,
            }
          : null,
      }));

      // Play sound - bonus sound for bonus questions, random success sound for regular questions
      if (isCurrentBonus) {
        playSound("bonus");
      } else {
        playSound(getRandomSuccessSound());
      }

      // Reset animations after they complete
      setTimeout(() => {
        setAnimationState({
          animatingTile: null,
          showGlitter: false,
          nameFlash: false,
          screenShake: false,
          colorFlash: false,
          zoomEffect: false,
          rotateEffect: false,
          particlePosition: null,
          isBonus: false,
          playerColor: undefined,
        });
      }, 2000);
    },
    []
  );

  return {
    animationState,
    triggerCorrectAnimations,
  };
};
