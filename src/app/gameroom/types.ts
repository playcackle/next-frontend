// ========================
// Base Types
// ========================

export type GameEvent =
  | "connection_success"
  | "game_starting_soon"
  | "waiting_for_players"
  | "game_start_cancelled"
  | "lobby_tick"
  | "new_round_starting"
  | "slot_snapped"
  | "round_over_timeout"
  | "round_over_all_snapped"
  | "break_starting"
  | "game_over"
  | "lobby_resetting_for_new_game"
  | "submission_feedback"
  | "submit_answer";

export type ChatEvent = "connection_success_chat" | "new_message" | "message_error";

// ========================
// Game Event Payloads
// ========================

export type ConnectionSuccessPayload = {
  message: string;
};

export type GameStartingSoonPayload = {
  message: string;
  countdown_seconds: number;
  start_timestamp_utc: string;
};

export type WaitingForPlayersPayload = {
  message: string;
  current_players: number;
  min_players_needed: number;
};

export type GameStartCancelledPayload = {
  message: string;
};

export type LobbyTickPayload = {
  status: "WAITING" | "STARTING_SOON" | "IN_ROUND" | "ROUND_BREAK" | "POST_GAME_SHOWCASE" | "GAME_OVER_NO_NEW_GAME";
  current_round: number;
  time_remaining_seconds: number | null;
  player_count: number;
  topic_name: string | null;
  lobby_id: string;
  timestamp_utc: string;
};

export type AnswerSlot = {
  slot_id: string;
  points: number;
  is_snapped: boolean;
  snapped_by_player_id: string | null;
  snapped_by_display_name: string | null;
  text_preview: string;
};

export type NewRoundStartingPayload = {
  round_number: number;
  topic_name: string;
  round_duration_seconds: number;
  answer_slots: AnswerSlot[];
  round_end_timestamp_utc: string;
};

export type SlotSnappedPayload = {
  slot_id: string;
  player_id: string;
  display_name: string;
  text: string;
  points_awarded: number;
  player_score: number;
  is_round_over: boolean;
};

export type UnrevealedAnswer = {
  slot_id: string;
  text: string;
  points: number;
};

export type PlayerScore = {
  player_id: string;
  display_name: string;
  score: number;
  round_score: number;
};

export type RoundOverTimeoutPayload = {
  round_number: number;
  message: string;
  unrevealed_answers: UnrevealedAnswer[];
  player_scores: PlayerScore[];
};

export type RoundOverAllSnappedPayload = {
  round_number: number;
  message: string;
  player_scores: PlayerScore[];
};

export type PodiumPlayer = {
  rank: number;
  player_id: string;
  display_name: string;
  score: number;
};

export type BreakStartingPayload = {
  round_number_ended: number;
  break_duration_seconds: number;
  next_round_number: number;
  break_end_timestamp_utc: string;
  podium: PodiumPlayer[];
};

export type FinalScore = {
  player_id: string;
  display_name: string;
  score: number;
  rank: number;
};

export type GameOverPayload = {
  message: string;
  final_scores: FinalScore[];
  post_game_showcase_duration_seconds: number;
  new_game_cycle_start_timestamp_utc: string;
};

export type LobbyResettingForNewGamePayload = {
  message: string;
};

export type SubmissionFeedbackPayload = {
  status: "correct" | "incorrect" | "already_snapped" | "too_slow" | "round_not_active" | "not_in_play" | "error";
  message: string;
  slot_id?: string;
  points_awarded?: number;
  your_score?: number;
};

// ========================
// Chat Event Payloads
// ========================

export type ChatMessageData = {
  player_id: string;
  display_name: string;
  text: string;
  timestamp: string;
};

export type ChatEventPayloadMap = {
  connection_success_chat: { message: string };
  new_message: ChatMessageData;
  message_error: { error: string };
};

// ========================
// Event-to-Payload Mapping
// ========================

export type EventPayloadMap = {
  connection_success: ConnectionSuccessPayload;
  game_starting_soon: GameStartingSoonPayload;
  waiting_for_players: WaitingForPlayersPayload;
  game_start_cancelled: GameStartCancelledPayload;
  lobby_tick: LobbyTickPayload;
  new_round_starting: NewRoundStartingPayload;
  slot_snapped: SlotSnappedPayload;
  round_over_timeout: RoundOverTimeoutPayload;
  round_over_all_snapped: RoundOverAllSnappedPayload;
  break_starting: BreakStartingPayload;
  game_over: GameOverPayload;
  lobby_resetting_for_new_game: LobbyResettingForNewGamePayload;
  submission_feedback: SubmissionFeedbackPayload;
};

export type GameroomData = {
  id: string;
  name: string;
  description: string;
  color: string;
  difficulty: string;
  slots: number;
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

// Payload for successful connection
export type ConnectionSuccessChatPayload = {
  message: string; // "Successfully connected to chat. Player ID: {player_id}"
};

// Payload for a new message
export type ChatMessagePayload = {
  player_id: string;
  display_name: string;
  text: string;
  timestamp: string; // ISO datetime string
};
