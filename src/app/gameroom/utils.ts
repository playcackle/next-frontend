import {
  ATTENTION_ANIMATIONS,
  ENTRANCE_ANIMATIONS,
  SUCCESS_SOUNDS,
} from "./constants";
import type { Slot, SoundType } from "./types";

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
  return ATTENTION_ANIMATIONS[
    Math.floor(Math.random() * ATTENTION_ANIMATIONS.length)
  ];
};

/**
 * Get a random entrance animation
 */
export const getRandomEntranceAnimation = (): string => {
  return ENTRANCE_ANIMATIONS[
    Math.floor(Math.random() * ENTRANCE_ANIMATIONS.length)
  ];
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

/**
 * Initialize slots with random animations and staggered delays
 */
export const initializeSlots = (
  count: number,
  answers: string[],
  roundNumber = 1
): Slot[] => {
  return Array.from({ length: count }, (_, i) => {
    const randomAnimation = getRandomEntranceAnimation();
    const answerIndex = (i + roundNumber - 1) % answers.length;

    return {
      id: i + 1,
      answered: false,
      points: (i + 1) * 100,
      entranceAnimation: `animate__animated ${randomAnimation}`,
      entranceDelay: (i + 1) * 0.15, // 150ms delay between each tile
      correctAnswer: answers[answerIndex],
      revealAnimation: "animate__animated animate__flipInX",
      revealDelay: (i + 1) * 0.3, // 300ms delay for reveal animation
    };
  });
};

/**
 * Initialize bonus slots with random animations and staggered delays
 */
export const initializeBonusQuestions = (
  startId: number,
  count: number,
  answers: string[],
  roundNumber = 1
): Slot[] => {
  return Array.from({ length: count }, (_, i) => {
    const id = startId + i;
    const randomAnimation = getRandomEntranceAnimation();
    const answerIndex = (id + roundNumber + 4) % answers.length;

    return {
      id,
      answered: false,
      points: id === startId ? 1000 : 2000, // First bonus is 1000, second is 2000
      entranceAnimation: `animate__animated ${randomAnimation}`,
      entranceDelay: id * 0.15,
      correctAnswer: answers[answerIndex],
      revealAnimation: "animate__animated animate__flipInX",
      revealDelay: id * 0.3,
    };
  });
};
