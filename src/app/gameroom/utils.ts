import { ATTENTION_ANIMATIONS, SOUND_SUCCESS } from "./constants";
import type { SoundType } from "./types/state";

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
  return `animate__animated animate__${
    ATTENTION_ANIMATIONS[
      Math.floor(Math.random() * ATTENTION_ANIMATIONS.length)
    ]
  }`;
};

/**
 * Get a random success sound
 */
export const getRandomSuccessSound = (): SoundType => {
  return SOUND_SUCCESS[
    Math.floor(Math.random() * SOUND_SUCCESS.length)
  ] as SoundType;
};

/**
 * Play a sound effect
 */
export const playSound = (type: SoundType): void => {
  try {
    if (typeof window === "undefined") {
      return;
    }

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
 * Debounce function to limit how often a function can be called
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generate a consistent color from a string (player_id)
 */
export const getPlayerColor = (playerId: string): string => {
  const colors = [
    "#FF00AA", // Neon pink
    "#00DDFF", // Neon blue
    "#00FF66", // Neon green
    "#B700FF", // Neon purple
    "#FFD700", // Gold
    "#FF6B35", // Orange
    "#00FFF0", // Cyan
    "#FF1493", // Deep pink
    "#7B68EE", // Medium slate blue
    "#00CED1", // Dark turquoise
  ];

  // Generate a consistent index from player_id
  let hash = 0;
  for (let i = 0; i < playerId.length; i++) {
    hash = playerId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

/**
 * Get initials from display name
 */
export const getInitials = (displayName: string): string => {
  const words = displayName.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

/**
 * Get player avatar image URL or fallback data
 */
export const getPlayerAvatar = (
  playerId: string,
  displayName: string
): {
  type: "image" | "generated";
  value: string;
  color?: string;
  initials?: string;
} => {
  // Check if it's Bot Bob
  if (playerId === "botbob" || displayName.toLowerCase() === "botbob") {
    return {
      type: "image",
      value: "/images/botbob.png",
    };
  }

  // Check if there's a custom avatar for this specific player
  // You can extend this to check for player-specific images
  // const customAvatarPath = `/images/avatars/${playerId}.png`;
  // Add logic here to check if the file exists and return it

  // Default to the generic player avatar
  return {
    type: "image",
    value: "/images/player_default.png",
  };
};
