import { describe, expect, it } from "vitest";
import { createStore } from "jotai";
import {
  gameStateAtom,
  updateGameStateAtom,
  resetGameStateAtom,
  loadingAtom,
  playerCountAtom,
  timeRemainingAtom,
  roundNumberAtom,
  totalRoundsAtom,
  isRoundBreakAtom,
  isPostGameShowcaseAtom,
  slotsAtom,
  scoresAtom,
  showCountDownAtom,
  answerAtom,
  connectionStatusAtom,
  unifiedMessagesAtom,
  addUnifiedMessageAtom,
  clearUnifiedMessagesAtom,
  roundHintsAtom,
  slotHeatAtom,
  clearSlotHeatAtom,
  type UnifiedMessage,
} from "../gameAtoms";

function createTestStore() {
  return createStore();
}

// ============================================================================
// Initial state
// ============================================================================
describe("gameStateAtom initial state", () => {
  it("starts with loading: true", () => {
    const store = createTestStore();
    expect(store.get(loadingAtom)).toBe(true);
  });

  it("starts with playerCount: 0", () => {
    const store = createTestStore();
    expect(store.get(playerCountAtom)).toBe(0);
  });

  it("starts with default totalRounds: 10", () => {
    const store = createTestStore();
    expect(store.get(totalRoundsAtom)).toBe(10);
  });

  it("starts with empty slots and scores", () => {
    const store = createTestStore();
    expect(store.get(slotsAtom)).toEqual([]);
    expect(store.get(scoresAtom)).toEqual([]);
  });

  it("starts with connectionStatus: connecting", () => {
    const store = createTestStore();
    expect(store.get(connectionStatusAtom)).toBe("connecting");
  });
});

// ============================================================================
// updateGameStateAtom
// ============================================================================
describe("updateGameStateAtom", () => {
  it("merges partial updates into game state", () => {
    const store = createTestStore();
    store.set(updateGameStateAtom, { playerCount: 5, timeRemaining: 120 });

    expect(store.get(playerCountAtom)).toBe(5);
    expect(store.get(timeRemainingAtom)).toBe(120);
    // Other fields unchanged
    expect(store.get(loadingAtom)).toBe(true);
  });

  it("preserves totalRounds when update does not include it", () => {
    const store = createTestStore();
    // Set totalRounds to 15
    store.set(updateGameStateAtom, { totalRounds: 15 });
    expect(store.get(totalRoundsAtom)).toBe(15);

    // Update without totalRounds — should NOT reset to undefined
    store.set(updateGameStateAtom, { playerCount: 3 });
    expect(store.get(totalRoundsAtom)).toBe(15);
  });

  it("allows explicit totalRounds override", () => {
    const store = createTestStore();
    store.set(updateGameStateAtom, { totalRounds: 15 });
    store.set(updateGameStateAtom, { totalRounds: 20 });
    expect(store.get(totalRoundsAtom)).toBe(20);
  });

  it("sets loading to false", () => {
    const store = createTestStore();
    expect(store.get(loadingAtom)).toBe(true);
    store.set(updateGameStateAtom, { loading: false });
    expect(store.get(loadingAtom)).toBe(false);
  });
});

// ============================================================================
// resetGameStateAtom
// ============================================================================
describe("resetGameStateAtom", () => {
  it("resets all game state to initial values", () => {
    const store = createTestStore();
    // Modify state
    store.set(updateGameStateAtom, {
      playerCount: 10,
      roundNumber: 5,
      loading: false,
      isRoundBreak: true,
    });
    store.set(answerAtom, "test answer");

    // Reset
    store.set(resetGameStateAtom);

    expect(store.get(playerCountAtom)).toBe(0);
    expect(store.get(roundNumberAtom)).toBe(0);
    expect(store.get(loadingAtom)).toBe(true);
    expect(store.get(isRoundBreakAtom)).toBe(false);
    expect(store.get(answerAtom)).toBe("");
  });
});

// ============================================================================
// Derived atoms (selectors)
// ============================================================================
describe("derived atoms", () => {
  it("loadingAtom reflects gameState.loading", () => {
    const store = createTestStore();
    store.set(updateGameStateAtom, { loading: false });
    expect(store.get(loadingAtom)).toBe(false);
    store.set(updateGameStateAtom, { loading: true });
    expect(store.get(loadingAtom)).toBe(true);
  });

  it("isRoundBreakAtom reflects gameState.isRoundBreak", () => {
    const store = createTestStore();
    store.set(updateGameStateAtom, { isRoundBreak: true });
    expect(store.get(isRoundBreakAtom)).toBe(true);
  });

  it("isPostGameShowcaseAtom reflects gameState.isPostGameShowcase", () => {
    const store = createTestStore();
    store.set(updateGameStateAtom, { isPostGameShowcase: true });
    expect(store.get(isPostGameShowcaseAtom)).toBe(true);
  });

  it("showCountDownAtom reflects gameState.showCountDown", () => {
    const store = createTestStore();
    store.set(updateGameStateAtom, { showCountDown: true });
    expect(store.get(showCountDownAtom)).toBe(true);
  });
});

// ============================================================================
// Unified messages
// ============================================================================
describe("unified messages", () => {
  const makeChatMsg = (text: string): UnifiedMessage => ({
    player_id: "p1",
    display_name: "Alice",
    text,
    timestamp: new Date().toISOString(),
    message_type: "chat",
  });

  const makeHintMsg = (text: string): UnifiedMessage => ({
    player_id: "botbob",
    display_name: "BotBob",
    text,
    timestamp: new Date().toISOString(),
    message_type: "bot_hint",
  });

  it("adds chat messages to unifiedMessagesAtom", () => {
    const store = createTestStore();
    store.set(addUnifiedMessageAtom, makeChatMsg("hello"));
    expect(store.get(unifiedMessagesAtom)).toHaveLength(1);
    expect(store.get(unifiedMessagesAtom)[0].text).toBe("hello");
  });

  it("routes bot_hint messages to roundHintsAtom, not unifiedMessages", () => {
    const store = createTestStore();
    store.set(addUnifiedMessageAtom, makeHintMsg("Try animals!"));
    expect(store.get(unifiedMessagesAtom)).toHaveLength(0);
    expect(store.get(roundHintsAtom)).toHaveLength(1);
  });

  it("caps unifiedMessages at 100 entries", () => {
    const store = createTestStore();
    for (let i = 0; i < 110; i++) {
      store.set(addUnifiedMessageAtom, makeChatMsg(`msg-${i}`));
    }
    expect(store.get(unifiedMessagesAtom)).toHaveLength(100);
    // Should have the latest messages, not the earliest
    expect(store.get(unifiedMessagesAtom)[99].text).toBe("msg-109");
  });

  it("clearUnifiedMessagesAtom empties the list", () => {
    const store = createTestStore();
    store.set(addUnifiedMessageAtom, makeChatMsg("hello"));
    store.set(clearUnifiedMessagesAtom);
    expect(store.get(unifiedMessagesAtom)).toHaveLength(0);
  });
});

// ============================================================================
// Slot heat
// ============================================================================
describe("slotHeatAtom", () => {
  it("starts empty", () => {
    const store = createTestStore();
    expect(store.get(slotHeatAtom)).toEqual({});
  });

  it("can be set and cleared", () => {
    const store = createTestStore();
    store.set(slotHeatAtom, { slot1: 50, slot2: 80 });
    expect(store.get(slotHeatAtom)).toEqual({ slot1: 50, slot2: 80 });

    store.set(clearSlotHeatAtom);
    expect(store.get(slotHeatAtom)).toEqual({});
  });
});

// ============================================================================
// connectionStatusAtom
// ============================================================================
describe("connectionStatusAtom", () => {
  it("can be set to all valid states", () => {
    const store = createTestStore();
    const states = ["connecting", "connected", "reconnecting", "disconnected"] as const;
    for (const s of states) {
      store.set(connectionStatusAtom, s);
      expect(store.get(connectionStatusAtom)).toBe(s);
    }
  });
});
