import { atom } from "jotai";
import { AnswerChip } from "../components/answerChips/AnswerChips";
import { AnimationState, GameState, Slot } from "../types/state";
import { ChatMessageData } from "../types/payloads";

// Unified message type for combining chat and answer attempts
export type UnifiedMessage = ChatMessageData & {
  message_type: 'chat' | 'answer_attempt' | 'successful_answer' | 'failed_answer';
  submission_result?: 'success' | 'too_slow' | 'incorrect' | 'already_snapped';
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
export const recentAnswersAtom = atom<AnswerChip[]>([]);

// Unified message system atoms
export const unifiedMessagesAtom = atom<UnifiedMessage[]>([]);
export const unifiedInputAtom = atom<string>("");

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

// Unified message action atoms
export const addUnifiedMessageAtom = atom(
  null,
  (get, set, message: UnifiedMessage) => {
    const current = get(unifiedMessagesAtom);
    const updated = [...current, message].slice(-100); // Keep last 100 messages
    set(unifiedMessagesAtom, updated);
  }
);

export const clearUnifiedMessagesAtom = atom(
  null,
  (get, set) => {
    set(unifiedMessagesAtom, []);
  }
);

