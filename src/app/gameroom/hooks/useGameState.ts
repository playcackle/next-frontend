import { useCallback, useMemo, useState } from "react";
import { FinalScore, PlayerScore, Slot } from "../types";
import { debounce } from "../utils";

interface GameState {
  // Game timing
  isIntermission: boolean;
  timeRemaining: number;
  intermissionTimeRemaining: number;
  topicName: string;

  // Players and scoring
  playerCount: number;
  playerScore: PlayerScore[];
  finalScore: FinalScore[];

  // Game content
  slots: Slot[];

  // UI state
  isSubmitting: boolean;
  answer: string;

  // Animation state
  animatingTile: string;
  entranceAnimation: string;
  attentionAnimation: string;
}

const initialGameState: GameState = {
  isIntermission: false,
  timeRemaining: 45,
  intermissionTimeRemaining: 90,
  playerCount: 1,
  playerScore: [],
  finalScore: [],
  slots: [],
  isSubmitting: false,
  answer: "",
  animatingTile: "",
  entranceAnimation: "",
  attentionAnimation: "",
  topicName: "",
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  // ==================== DEBOUNCED UPDATES ====================

  // For non-critical updates that can be slightly delayed
  const debouncedUpdateGameState = useMemo(
    () =>
      debounce((updates: Partial<GameState>) => {
        setGameState((prev) => ({ ...prev, ...updates }));
      }, 50), // 50ms debounce for smooth updates
    []
  );

  // ==================== SMART STATE UPDATES ====================

  // Decides whether to update immediately or with debouncing
  const updateGameState = useCallback(
    (updates: Partial<GameState>) => {
      // Critical game state that needs immediate updates
      const criticalKeys = ["isSubmitting", "timeRemaining", "isIntermission"];
      const hasCriticalUpdate = Object.keys(updates).some((key) =>
        criticalKeys.includes(key)
      );

      if (hasCriticalUpdate) {
        // Critical updates happen immediately for responsive gameplay
        setGameState((prev) => ({ ...prev, ...updates }));
      } else {
        // Non-critical updates can be debounced for performance
        debouncedUpdateGameState(updates);
      }
    },
    [debouncedUpdateGameState]
  );

  // ==================== SPECIFIC UPDATERS ====================

  // Reset to initial state
  const resetGameState = useCallback(() => {
    setGameState(initialGameState);
  }, []);

  // Handle user typing in answer input
  const setAnswer = useCallback((answer: string) => {
    // Update immediately for responsive typing feel
    setGameState((prev) => ({ ...prev, answer }));
  }, []);

  // Handle submission state (critical - no debouncing)
  const setSubmitting = useCallback((isSubmitting: boolean) => {
    setGameState((prev) => ({ ...prev, isSubmitting }));
  }, []);

  // Handle new game slots (important content - no debouncing)
  const setSlots = useCallback((slots: Slot[]) => {
    setGameState((prev) => ({ ...prev, slots }));
  }, []);

  return {
    gameState,
    updateGameState,
    resetGameState,
    setAnswer,
    setSubmitting,
    setSlots,
  };
};
