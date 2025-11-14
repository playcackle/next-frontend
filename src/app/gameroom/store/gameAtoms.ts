import { atom } from "jotai";
import { ChatMessageData } from "../types/payloads";
import { AnimationState, GameState, Slot } from "../types/state";

// Unified message type for combining chat and answer attempts
export type UnifiedMessage = ChatMessageData & {
  message_type:
    | "chat"
    | "answer_attempt"
    | "successful_answer"
    | "failed_answer";
  submission_result?: "success" | "too_slow" | "incorrect" | "already_snapped";
  points_awarded?: number;
  is_rare?: boolean;
  canonical_text?: string;
  is_own_message?: boolean;
};

const initGameState = {
  playerCount: 0,
  timeRemaining: 150,
  roundName: "",
  roundNumber: 0,
  totalRounds: 10, // Default value, will be overridden by backend
  isRoundBreak: false,
  loading: true,
  soundsLoaded: false,
  slots: [],
  scores: [],
  finalScore: [],
  showCountDown: false,
};
// Core game state atoms
export const gameStateAtom = atom<GameState>(initGameState);

export const slotsAtom = atom<Slot[]>([]);
export const answerAtom = atom<string>("");

// Unified message system atoms
export const unifiedMessagesAtom = atom<UnifiedMessage[]>([]);
export const unifiedInputAtom = atom<string>("");

export const animationStateAtom = atom<AnimationState>({
  attentionAnimation: "",
  slotId: null,
  showConfetti: false,
  confettiPosition: null,
  particlePosition: null,
  showGlitter: false,
  isBonus: false,
  playerColor: "",
});

// Actions atoms (write-only atoms for state updates)
export const updateGameStateAtom = atom(
  null,
  (get, set, update: Partial<GameState>) => {
    const current = get(gameStateAtom);
    // Ensure we preserve totalRounds if not explicitly provided in update
    const merged = { ...current, ...update };
    // Explicit preservation of totalRounds to prevent lobby_tick from clearing it
    if (update.totalRounds === undefined && current.totalRounds !== undefined) {
      merged.totalRounds = current.totalRounds;
    }
    set(gameStateAtom, merged);
  }
);

export const updateAnimationStateAtom = atom(
  null,
  (get, set, update: Partial<AnimationState>) => {
    const current = get(animationStateAtom);
    const merged = { ...current, ...update };
    set(animationStateAtom, merged);
  }
);

export const resetGameStateAtom = atom(null, (get, set) => {
  set(gameStateAtom, initGameState);
  set(answerAtom, "");
  set(animationStateAtom, {
    attentionAnimation: "",
    slotId: null,
    showConfetti: false,
    confettiPosition: null,
    particlePosition: null,
    showGlitter: false,
    isBonus: false,
    playerColor: "",
  });
});

// Unified message action atoms
export const addUnifiedMessageAtom = atom(
  null,
  (get, set, message: UnifiedMessage) => {
    const current = get(unifiedMessagesAtom);
    const updated = [...current, message].slice(-100); // Keep last 100 messages
    set(unifiedMessagesAtom, updated);
  }
);

export const clearUnifiedMessagesAtom = atom(null, (get, set) => {
  set(unifiedMessagesAtom, []);
});
