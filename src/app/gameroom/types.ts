export type Slot = {
  id: number;
  answered: boolean;
  points: number;
  answeredBy?: string;
  animation?: string;
  entranceAnimation?: string;
  entranceDelay?: number;
  correctAnswer: string;
  revealAnimation?: string;
  revealDelay?: number;
  playerAvatar?: string;
  playerColor?: string;
};

export type GameroomData = {
  id: string;
  name: string;
  description: string;
  color: string;
  difficulty: string;
  questions: number;
  capacity: number;
  activePlayers: number;
};

export type PlayerAction = {
  playerId: number;
  questionId: number;
  timestamp: number;
  animationComplete: boolean;
};

export type Message = {
  user: string;
  text: string;
  time: string;
};

export type GameState = {
  timeRemaining: number;
  timeExpired: boolean;
  isIntermission: boolean;
  intermissionTimeRemaining: number;
  roundNumber: number;
  showCountdown: boolean;
  countdownValue: number;
  showConfetti: boolean;
  otherPlayerAnswering: boolean;
};

export type AnimationState = {
  animatingTile: number | null;
  showGlitter: boolean;
  nameFlash: boolean;
  screenShake: boolean;
  colorFlash: boolean;
  zoomEffect: boolean;
  rotateEffect: boolean;
  particlePosition: { x: number; y: number } | null;
  isBonus: boolean;
  playerColor?: string; // Add player color
};

export type SoundType =
  | "correct"
  | "bonus"
  | "success1"
  | "success2"
  | "success3"
  | "timeUp";
