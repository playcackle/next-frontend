"use server";

export const joinGameroom = async (playerId: string) => {
  const response = await fetch(`${process.env.BACKEND_JOIN_URL}/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ player_id: playerId }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    return {
      isError: true,
      error: errorData.message || "Registration failed!",
    };
  }
  const gameroom = await response.json();

  // Transform WebSocket URLs for browser access
  // Replace backend URLs with client-accessible URLs
  const clientBackendUrl =
    process.env.BACKEND_JOIN_URL || process.env.BACKEND_JOIN_URL;

  if (gameroom.game_ws_url) {
    // Replace the base URL part with client-accessible URL
    gameroom.game_ws_url = gameroom.game_ws_url.replace(
      /^https?:\/\/[^\/]+/,
      clientBackendUrl
    );
  }
  if (gameroom.chat_ws_url) {
    gameroom.chat_ws_url = gameroom.chat_ws_url.replace(
      /^https?:\/\/[^\/]+/,
      clientBackendUrl
    );
  }

  return gameroom;
};
