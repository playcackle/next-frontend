import { PlayerAccolade } from "./payloads";

export type Slot = {
  id: string;
  points_awarded: number;
  points: number;
  is_snapped: boolean;
  snapped_by_player_id: string | null;
  snapped_by_display_name: string | null;
  text_preview: string;
  canonical_text: string;
  is_rare: boolean;
  failed_attempts: number;
};

export type Score = {
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

export type LobbyStatus =
  | "WAITING"
  | "STARTING_SOON"
  | "IN_ROUND"
  | "ROUND_BREAK"
  | "POST_GAME_SHOWCASE"
  | "GAME_OVER_NO_NEW_GAME"
  | null;

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
  scores: Score[];
  accolades: Accolade[];
  finalScore: FinalScore[];
  playerAccolades: PlayerAccolade[];
  showCountDown: boolean;
  lobbyStatus: LobbyStatus;
  minPlayersNeeded: number;
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
