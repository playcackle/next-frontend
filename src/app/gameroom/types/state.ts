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

export type Accolade = {
  accolade_type: string;
  player_id: string;
  player_display_name: string;
  title: string;
  description: string;
  metric_value: number;
};

export type GameState = {
  playerCount: number;
  timeRemaining: number;
  roundName: string;
  roundPrompt?: string;
  roundExample?: string;
  roundNumber: number;
  totalRounds: number;
  isRoundBreak: boolean;
  isPostGameShowcase: boolean;
  loading: boolean;
  soundsLoaded: boolean;
  slots: Slot[];
  scores: Scores[];
  accolades: Accolade[];
  finalScore: FinalScore[];
  playerAccolades: import("./payloads").PlayerAccolades[];
  showCountDown: boolean;
};

export type AnimationState = {
  attentionAnimation: string;
  slotId: string | null;
  showGlitter: boolean;
  nameFlash: boolean;
  shake: boolean;
  colorFlash: boolean;
  zoomEffect: boolean;
  rotateEffect: boolean;
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
