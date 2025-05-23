import { EventPayloadMap, GameEvent } from "../types";

// Type alias for generic handler
export type GameEventHandler<T extends GameEvent> = (
  data: EventPayloadMap[T]
) => void;

export const gameEventHandlers: {
  [K in GameEvent]: GameEventHandler<K>;
} = {
  connection_success: (data) => {
    console.log("Connected:", data.message);
  },
  game_starting_soon: (data) => {
    console.log(`Game starting in ${data.countdown_seconds} seconds.`);
  },
  waiting_for_players: (data) => {
    console.log(
      `Waiting for players (${data.current_players}/${data.min_players_needed})`
    );
  },
  game_start_cancelled: (data) => {
    console.warn(data.message);
  },
  lobby_tick: (data) => {
    console.log("Lobby Tick:", data.status, data.topic_name);
  },
  new_round_starting: (data) => {
    console.log(`Round ${data.round_number} starting:`, data.topic_name);
  },
  slot_snapped: (data) => {
    console.log(`${data.display_name} snapped: ${data.text}`);
  },
  round_over_timeout: (data) => {
    console.log("Round over (timeout):", data.message);
  },
  round_over_all_snapped: (data) => {
    console.log("Round complete (all snapped):", data.message);
  },
  break_starting: (data) => {
    console.log("Break starting. Next round:", data.next_round_number);
  },
  game_over: (data) => {
    console.log("Game Over!", data.final_scores);
  },
  lobby_resetting_for_new_game: (data) => {
    console.log("Lobby resetting:", data.message);
  },
  submission_feedback: (data) => {
    console.log("Submission feedback:", data.message);
  },
};
