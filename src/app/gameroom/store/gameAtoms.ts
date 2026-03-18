import { atom } from "jotai";
import { ChatMessageData } from "../types/payloads";
import { AnimationState, GameState } from "../types/state";

// Unified message type for combining chat and answer attempts
export type UnifiedMessage = ChatMessageData & {
  message_type:
    | "chat"
    | "bot_hint"
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
  isPostGameShowcase: false,
  loading: true,
  soundsLoaded: false,
  slots: [],
  scores: [],
  accolades: [],
  finalScore: [],
  playerAccolades: [],
  showCountDown: false,
};
// Core game state atoms
export const gameStateAtom = atom<GameState>(initGameState);

// Derived atoms - allows components to subscribe to only specific pieces of state
// This prevents unnecessary re-renders when unrelated state changes
export const playerCountAtom = atom((get) => get(gameStateAtom).playerCount);
export const timeRemainingAtom = atom(
  (get) => get(gameStateAtom).timeRemaining
);
export const roundNameAtom = atom((get) => get(gameStateAtom).roundName);
export const roundPromptAtom = atom((get) => get(gameStateAtom).roundPrompt);
export const roundExampleAtom = atom((get) => get(gameStateAtom).roundExample);
export const roundNumberAtom = atom((get) => get(gameStateAtom).roundNumber);
export const totalRoundsAtom = atom((get) => get(gameStateAtom).totalRounds);
export const isRoundBreakAtom = atom((get) => get(gameStateAtom).isRoundBreak);
export const isPostGameShowcaseAtom = atom((get) => get(gameStateAtom).isPostGameShowcase);
export const playerAccoladesAtom = atom((get) => get(gameStateAtom).playerAccolades);
export const loadingAtom = atom((get) => get(gameStateAtom).loading);
export const soundsLoadedAtom = atom((get) => get(gameStateAtom).soundsLoaded);
export const slotsAtom = atom((get) => get(gameStateAtom).slots);
export const scoresAtom = atom((get) => get(gameStateAtom).scores);
export const accoladesAtom = atom((get) => get(gameStateAtom).accolades);
export const finalScoreAtom = atom((get) => get(gameStateAtom).finalScore);
export const showCountDownAtom = atom(
  (get) => get(gameStateAtom).showCountDown
);

export const answerAtom = atom<string>("");

// Unified message system atoms
export const unifiedMessagesAtom = atom<UnifiedMessage[]>([]);
export const unifiedInputAtom = atom<string>("");
// Hints sent by BotBob during the current round, displayed in the dedicated HintPanel
export const roundHintsAtom = atom<UnifiedMessage[]>([]);

// Per-slot max similarity score seen this round (slot_id -> 0-100), sourced from lobby_tick
export const slotHeatAtom = atom<Record<string, number>>({});

export const animationStateAtom = atom<AnimationState>({
  attentionAnimation: "",
  slotId: null,
  showGlitter: false,
  nameFlash: false,
  shake: false,
  colorFlash: false,
  zoomEffect: false,
  rotateEffect: false,
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
    showGlitter: false,
    nameFlash: false,
    shake: false,
    colorFlash: false,
    zoomEffect: false,
    rotateEffect: false,
    isBonus: false,
    playerColor: "",
  });
});

// Unified message action atoms
export const addUnifiedMessageAtom = atom(
  null,
  (get, set, message: UnifiedMessage) => {
    if (message.message_type === "bot_hint") {
      // Hints go to the dedicated HintPanel, not the chat feed
      const current = get(roundHintsAtom);
      set(roundHintsAtom, [...current, message]);
    } else {
      const current = get(unifiedMessagesAtom);
      const updated = [...current, message].slice(-100); // Keep last 100 messages
      set(unifiedMessagesAtom, updated);
    }
  }
);

export const clearUnifiedMessagesAtom = atom(null, (get, set) => {
  set(unifiedMessagesAtom, []);
});

export const clearRoundHintsAtom = atom(null, (get, set) => {
  set(roundHintsAtom, []);
});

export const clearSlotHeatAtom = atom(null, (get, set) => {
  set(slotHeatAtom, {});
});
