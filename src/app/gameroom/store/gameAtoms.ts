import { atom } from "jotai";
import { AnimationState, GameState, Slot } from "../types/state";

const initGameState = {
  playerCount: 0,
  timeRemaining: 150,
  roundName: "",
  roundNumber: 0,
  isRoundBreak: false,
  loading: true,
  soundsLoaded: false,
  slots: [],
  scores: [],
  finalScore: [],
  showCountDown: false,
  recentAnswers: [],
};
// Core game state atoms
export const gameStateAtom = atom<GameState>(initGameState);

export const slotsAtom = atom<Slot[]>([]);
export const answerAtom = atom<string>("");

// Animation state atoms
export const animationStateAtom = atom<AnimationState>({
  entranceAnimation: "",
  attentionAnimation: "",
  animatingTile: "",
  showConfetti: false,
  confettiPosition: null as { x: number; y: number } | null,
});

// Actions atoms (write-only atoms for state updates)
export const updateGameStateAtom = atom(
  null,
  (get, set, update: Partial<GameState>) => {
    const current = get(gameStateAtom);
    set(gameStateAtom, { ...current, ...update });
  }
);

export const updateAnimationStateAtom = atom(
  null,
  (get, set, update: Partial<AnimationState>) => {
    const current = get(animationStateAtom);
    set(animationStateAtom, { ...current, ...update });
  }
);

export const resetGameStateAtom = atom(null, (get, set) => {
  set(gameStateAtom, initGameState);
  set(answerAtom, "");
  set(animationStateAtom, {
    entranceAnimation: "",
    attentionAnimation: "",
    animatingTile: "",
    showConfetti: false,
    confettiPosition: null,
  });
});
