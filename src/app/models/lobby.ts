export type LobbyTile = {
  lobby_id: string;
  collection_name: string;
  status: string;
  player_count: number;
};

export type GameRoom = {
  token: string;
  game_ws_url: string;
  chat_ws_url: string;
};
