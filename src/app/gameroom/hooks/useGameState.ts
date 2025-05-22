"use client";

import { useCallback, useEffect, useState } from "react";
import {
  COUNTDOWN_THRESHOLD,
  INTERMISSION_TIME,
  ROUND_TIME,
} from "../[id]/constants";
import type { Message } from "../types";
import { getCurrentTime, playSound } from "../utils";

// Update the GameState type to include confetti position
export type GameState = {
  timeRemaining: number;
  timeExpired: boolean;
  isIntermission: boolean;
  intermissionTimeRemaining: number;
  roundNumber: number;
  showCountdown: boolean;
  countdownValue: number;
  showConfetti: boolean;
  confettiPosition: { x: number; y: number } | null;
};

interface UseGameStateProps {
  onTimeExpired: () => void;
  onIntermissionEnd: () => void;
  addMessage: (message: Message) => void;
}

export const useGameState = ({
  onTimeExpired,
  onIntermissionEnd,
  addMessage,
}: UseGameStateProps) => {
  // Update the initial state in useGameState
  const [gameState, setGameState] = useState<GameState>({
    timeRemaining: ROUND_TIME,
    timeExpired: false,
    isIntermission: false,
    intermissionTimeRemaining: INTERMISSION_TIME,
    roundNumber: 1,
    showCountdown: false,
    countdownValue: 0,
    showConfetti: false,
    confettiPosition: null,
  });

  // Timer countdown for the main game
  useEffect(() => {
    if (gameState.isIntermission || gameState.timeExpired) return;

    if (gameState.timeRemaining <= 0) {
      if (!gameState.timeExpired) {
        onTimeExpired();
      }
      return;
    }

    const timer = setInterval(() => {
      setGameState((prev) => {
        // Start the countdown animation when time is running low
        const showCountdown =
          prev.timeRemaining <= COUNTDOWN_THRESHOLD &&
          prev.timeRemaining > 0 &&
          !prev.showCountdown;

        return {
          ...prev,
          timeRemaining: prev.timeRemaining - 1,
          showCountdown:
            showCountdown || (prev.showCountdown && prev.timeRemaining > 1),
          countdownValue:
            prev.timeRemaining <= COUNTDOWN_THRESHOLD
              ? prev.timeRemaining
              : prev.countdownValue,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    gameState.timeRemaining,
    gameState.timeExpired,
    gameState.isIntermission,
    onTimeExpired,
  ]);

  // Timer countdown for intermission
  useEffect(() => {
    if (!gameState.isIntermission) return;

    if (gameState.intermissionTimeRemaining <= 0) {
      onIntermissionEnd();
      return;
    }

    const timer = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        intermissionTimeRemaining: prev.intermissionTimeRemaining - 1,
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [
    gameState.intermissionTimeRemaining,
    gameState.isIntermission,
    onIntermissionEnd,
  ]);

  // Start intermission
  const startIntermission = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      isIntermission: true,
      intermissionTimeRemaining: INTERMISSION_TIME,
      showCountdown: false,
    }));
  }, [addMessage]);

  // Start new round
  const startNewRound = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      timeExpired: false,
      isIntermission: false,
      timeRemaining: ROUND_TIME,
      showConfetti: false,
      showCountdown: false,
      otherPlayerAnswering: false,
      roundNumber: prev.roundNumber + 1,
    }));

    // Add message to chat
    addMessage({
      user: "System",
      text: `Round ${gameState.roundNumber + 1} starting! Get ready!`,
      time: getCurrentTime(),
    });

    // Play a sound to signal the start
    playSound("success3");
  }, [gameState.roundNumber, addMessage]);

  // Handle time expiration
  const handleTimeExpired = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      timeExpired: true,
      showCountdown: false,
      showConfetti: true,
    }));

    // Play a sound effect
    playSound("timeUp");
  }, [addMessage]);

  // Set other player answering state
  const setOtherPlayerAnswering = useCallback((value: boolean) => {
    setGameState((prev) => ({
      ...prev,
      otherPlayerAnswering: value,
    }));
  }, []);

  // Set show confetti state
  const setShowConfetti = useCallback((value: boolean) => {
    setGameState((prev) => ({
      ...prev,
      showConfetti: value,
    }));
  }, []);

  // Add a function to set the confetti position
  const setConfettiPosition = useCallback(
    (position: { x: number; y: number } | null) => {
      setGameState((prev) => ({
        ...prev,
        confettiPosition: position,
      }));
    },
    []
  );

  // Include the new function in the return value
  return {
    gameState,
    startIntermission,
    startNewRound,
    handleTimeExpired,
    setOtherPlayerAnswering,
    setShowConfetti,
    setConfettiPosition,
  };
};
