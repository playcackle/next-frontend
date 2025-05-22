"use server";

export const joinGameroom = async (playerId: string) => {
  const response = await fetch(`${process.env.BACKEND_JOIN_URL}/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ player_id: playerId }),
    // …
  });
  if (!response.ok) {
    const errorData = await response.json();
    return {
      error: errorData.message || "Registration failed!",
    };
  }
  const gameroom = await response.json();
  return gameroom;
};
