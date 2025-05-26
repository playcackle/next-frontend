import {
  ATTENTION_ANIMATIONS,
  ENTRANCE_ANIMATIONS,
  SUCCESS_SOUNDS,
} from "./constants";
import type { SoundType } from "./types";

/**
 * Format time as MM:SS
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

/**
 * Get a random attention animation
 */
export const getRandomAttentionAnimation = (): string => {
  return `animate__animated ${
    ATTENTION_ANIMATIONS[
      Math.floor(Math.random() * ATTENTION_ANIMATIONS.length)
    ]
  }`;
};

/**
 * Get a random entrance animation
 */
export const getRandomEntranceAnimation = (): string => {
  return `animate__animated ${
    ENTRANCE_ANIMATIONS[Math.floor(Math.random() * ENTRANCE_ANIMATIONS.length)]
  }`;
};

/**
 * Get a random success sound
 */
export const getRandomSuccessSound = (): SoundType => {
  return SUCCESS_SOUNDS[
    Math.floor(Math.random() * SUCCESS_SOUNDS.length)
  ] as SoundType;
};

/**
 * Play a sound effect
 */
export const playSound = (type: SoundType): void => {
  try {
    if (typeof window === "undefined") return;

    // @ts-ignore
    if (window.playSoundEffect) {
      // @ts-ignore
      window.playSoundEffect(type);
    }
  } catch (e) {
    console.error("Sound playback failed:", e);
  }
};
