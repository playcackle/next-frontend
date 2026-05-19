// ========================
// Base Types
// ========================

import { Accolade, FinalScore, LobbyStatus, PodiumPlayer, Score, Slot } from "./state";

export type GameEvent =
  | "connection_success"
  | "game_starting_soon"
  | "waiting_for_players"
  | "game_start_cancelled"
  | "lobby_tick"
  | "round_starting_soon"
  | "new_round_started"
  | "slot_snapped"
  | "round_over"
  | "break_starting"
  | "game_over"
  | "lobby_resetting_for_new_game"
  | "submission_feedback"
  | "submit_answer"
  | "request_state_sync"
  | "lobby_state_sync"
  | "play_again_prompt"
  | "play_again_count_update"
  | "play_again_player_update"
  | "play_again_result"
  | "play_again_response"
  | "send_message"
  | "unified_message"
  | "message_error";

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

export type RoundStartingSoonPayload = {
  message: string;
  round_number: number; // The upcoming round number
  countdown_seconds: number; // Remaining seconds until round start
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

export type LobbySyncPayload = {
  status:
    | "WAITING"
    | "STARTING_SOON"
    | "IN_ROUND"
    | "ROUND_BREAK"
    | "POST_GAME_SHOWCASE"
    | "GAME_OVER_NO_NEW_GAME";
  round_number: number;
  total_rounds: number;
  time_remaining_seconds: number | null;
  player_count: number;
  topic_name: string;
  topic_prompt: string;
  topic_example: string;
  lobby_id: string;
  timestamp_utc: string;
  slots: Slot[];
  scores: Score[];
  accolades: PlayerAccolade[];
  play_again_state?: {
    confirmed_count: number;
    total_waiting: number;
    needed_to_start: number;
  };
};

export type LobbyTickPayload = {
  status: LobbyStatus;
  time_remaining_seconds: number | null;
  player_count: number;
  scores: Score[];
};

export type NewRoundStartedPayload = {
  round_number: number;
  topic_name: string;
  topic_prompt?: string;
  topic_example?: string;
  round_duration_seconds: number;
  slots: Slot[];
  round_end_timestamp_utc: string;
};

export type SlotSnappedPayload = {
  id: string;
  player_id: string;
  display_name: string;
  canonical_text: string;
  points_awarded: number;
  player_score: number;
  is_round_over: boolean;
  slots: Slot[];
  scores: Score[];
};

export type UnrevealedAnswer = {
  id: string;
  text: string;
  points: number;
};

export type RoundOverPayload = {
  round_number: number;
  message: string;
  unrevealed_answers: UnrevealedAnswer[];
  scores: Score[];
  accolades: Accolade[];
  break_duration_seconds: number;
};

export type BreakStartingPayload = {
  round_number_ended: number;
  break_duration_seconds: number;
  next_round_number: number;
  break_end_timestamp_utc: string;
  podium: PodiumPlayer[];
};

export type GameOverPayload = {
  message: string;
  final_scores: FinalScore[];
  post_game_showcase_duration_seconds: number;
  new_game_cycle_start_timestamp_utc: string;
  player_accolades: PlayerAccolade[];
};

export type PlayerAccolade = {
  player_id: string;
  display_name: string;
  score: number;
  accolades_count: Record<string, number>;
};

export type LobbyResettingForNewGamePayload = {
  message: string;
};

export type SubmissionFeedbackPayload = {
  status:
    | "success"
    | "correct"
    | "incorrect"
    | "already_snapped"
    | "too_slow"
    | "round_not_active"
    | "not_in_play"
    | "error";
  message: string;
  id?: string;
  points_awarded?: number;
  your_score?: number;
};

// ========================
// Play Again Opt-In Payloads
// ========================

export type PlayAgainPromptPayload = {
  message: string;
  timeout_seconds: number;
  min_players: number;
  players_waiting: number;
};

export type PlayAgainCountUpdatePayload = {
  confirmed_count: number;
  total_waiting: number;
  needed_to_start: number;
};

export type PlayAgainPlayerUpdatePayload = {
  player_id: string;
  display_name: string;
  response: "in" | "out";
};

export type PlayAgainResultPayload = {
  will_restart: boolean;
  reason: string;
  confirmed_players: number;
  total_players: number;
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
  round_starting_soon: RoundStartingSoonPayload;
  new_round_started: NewRoundStartedPayload;
  slot_snapped: SlotSnappedPayload;
  round_over: RoundOverPayload;
  break_starting: BreakStartingPayload;
  game_over: GameOverPayload;
  lobby_resetting_for_new_game: LobbyResettingForNewGamePayload;
  submission_feedback: SubmissionFeedbackPayload;
  lobby_state_sync: LobbySyncPayload;
  submit_answer: any;
  send_message: string;
  unified_message: any;
  message_error: { error: string };
  request_state_sync: undefined;
  play_again_prompt: PlayAgainPromptPayload;
  play_again_count_update: PlayAgainCountUpdatePayload;
  play_again_player_update: PlayAgainPlayerUpdatePayload;
  play_again_result: PlayAgainResultPayload;
  play_again_response: { want_to_play: boolean };
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
