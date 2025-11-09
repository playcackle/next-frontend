export type Slot = {
  id: string;
  points: number;
  is_snapped: boolean;
  snapped_by_player_id: string | null;
  snapped_by_display_name: string | null;
  text_preview: string;
  canonical_text: string;
  is_rare: boolean;
};

export type Scores = {
  player_id: string;
  display_name: string;
  score: number;
  round_score: number;
};

export type FinalScore = {
  player_id: string;
  display_name: string;
  score: number;
  rank: number;
};

export type PodiumPlayer = {
  rank: number;
  player_id: string;
  display_name: string;
  score: number;
};

export type GameState = {
  playerCount: number;
  timeRemaining: number;
  roundName: string;
  roundNumber: number;
  totalRounds: number;
  isRoundBreak: boolean;
  loading: boolean;
  soundsLoaded: boolean;
  slots: Slot[];
  scores: Scores[];
  finalScore: FinalScore[];
  showCountDown: boolean;
};

export type AnimationState = {
  attentionAnimation: string;
  slotId: string | null;
  showConfetti: boolean;
  confettiPosition: { x: number; y: number } | null;
  showGlitter: boolean;
  nameFlash: boolean;
  shake: boolean;
  colorFlash: boolean;
  zoomEffect: boolean;
  rotateEffect: boolean;
  particlePosition: { x: number; y: number } | null;
  isBonus: boolean;
  playerColor: string | null;
};

export type SoundType =
  | "correct"
  | "bonus"
  | "success1"
  | "success2"
  | "success3"
  | "timeUp";
