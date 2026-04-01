import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  formatTime,
  debounce,
  getPlayerColor,
  getInitials,
  getPlayerAvatar,
  playSound,
} from "../utils";

// ============================================================================
// formatTime
// ============================================================================
describe("formatTime", () => {
  it("formats zero seconds", () => {
    expect(formatTime(0)).toBe("00:00");
  });

  it("formats seconds under a minute", () => {
    expect(formatTime(5)).toBe("00:05");
    expect(formatTime(59)).toBe("00:59");
  });

  it("formats full minutes", () => {
    expect(formatTime(60)).toBe("01:00");
    expect(formatTime(120)).toBe("02:00");
  });

  it("formats minutes and seconds", () => {
    expect(formatTime(90)).toBe("01:30");
    expect(formatTime(150)).toBe("02:30");
    expect(formatTime(605)).toBe("10:05");
  });

  it("handles large values", () => {
    expect(formatTime(3600)).toBe("60:00");
  });
});

// ============================================================================
// debounce
// ============================================================================
describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("delays execution by the specified wait time", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("resets the timer on subsequent calls", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);

    debounced();
    vi.advanceTimersByTime(100);
    debounced(); // reset
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("passes arguments through to the original function", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced("hello", 42);
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith("hello", 42);
  });

  it("only fires the last call when called multiple times", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced("a");
    debounced("b");
    debounced("c");
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith("c");
  });
});

// ============================================================================
// getPlayerColor
// ============================================================================
describe("getPlayerColor", () => {
  it("returns a hex color string", () => {
    const color = getPlayerColor("player-123");
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("returns the same color for the same player ID", () => {
    const color1 = getPlayerColor("player-abc");
    const color2 = getPlayerColor("player-abc");
    expect(color1).toBe(color2);
  });

  it("returns different colors for different player IDs", () => {
    // With 10 colors in the palette, different IDs should usually differ
    const colors = new Set(
      ["alice", "bob", "charlie", "dave", "eve"].map(getPlayerColor)
    );
    expect(colors.size).toBeGreaterThan(1);
  });
});

// ============================================================================
// getInitials
// ============================================================================
describe("getInitials", () => {
  it("returns first two chars for single-word name", () => {
    expect(getInitials("Alice")).toBe("AL");
  });

  it("returns first and last initials for multi-word name", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("handles three-word names", () => {
    expect(getInitials("Mary Jane Watson")).toBe("MW");
  });

  it("handles extra whitespace", () => {
    expect(getInitials("  Bob  Smith  ")).toBe("BS");
  });
});

// ============================================================================
// getPlayerAvatar
// ============================================================================
describe("getPlayerAvatar", () => {
  it("returns Bot Bob image for botbob player ID", () => {
    const avatar = getPlayerAvatar("botbob", "BotBob");
    expect(avatar.type).toBe("image");
    expect(avatar.value).toBe("/images/botbob.png");
  });

  it("returns Bot Bob image case-insensitively for display name", () => {
    const avatar = getPlayerAvatar("some-id", "botbob");
    expect(avatar.type).toBe("image");
    expect(avatar.value).toBe("/images/botbob.png");
  });

  it("returns default player avatar for regular players", () => {
    const avatar = getPlayerAvatar("player-123", "Alice");
    expect(avatar.type).toBe("image");
    expect(avatar.value).toBe("/images/player_default.png");
  });
});

// ============================================================================
// playSound
// ============================================================================
describe("playSound", () => {
  it("calls window.playSoundEffect when available", () => {
    const mockPlay = vi.fn();
    // @ts-ignore
    window.playSoundEffect = mockPlay;

    playSound("success1");
    expect(mockPlay).toHaveBeenCalledWith("success1");

    // @ts-ignore
    delete window.playSoundEffect;
  });

  it("does not throw when window.playSoundEffect is missing", () => {
    expect(() => playSound("success1")).not.toThrow();
  });
});
