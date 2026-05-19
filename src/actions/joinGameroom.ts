type JoinPayload = {
  lobbyId: string;
  playerId: string;
  joinBaseUrl?: string | null;
};

export type LobbyJoinSuccess = {
  player_id: string;
  token: string;
  game_ws_url: string;
  /** Deprecated transitional alias; runtime uses game_ws_url. */
  chat_ws_url?: string | null;
  // Not returned by the API — injected client-side from LobbyInfo when joining
  discord_invite_url?: string | null;
};

type LobbyJoinError = {
  isError: true;
  error: string;
};

type LobbyJoinResponse = LobbyJoinSuccess | LobbyJoinError;

const formatJoinUrl = (baseUrl: string) => {
  const trimmed = baseUrl.endsWith("/")
    ? baseUrl.slice(0, baseUrl.length - 1)
    : baseUrl;
  return `${trimmed}/join`;
};

const resolveLobbyManagerUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_LOBBY_MANAGER_URL;
  if (!baseUrl) {
    throw new Error("Lobby Manager URL is not configured.");
  }
  return baseUrl;
};

const postJoin = async (url: string, playerId: string) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ player_id: playerId }),
  });

  if (!response.ok) {
    let errorMessage = "Unable to join lobby.";
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch (error) {
      console.error("Failed to parse join error:", error);
    }
    return {
      isError: true,
      error: errorMessage,
    } as LobbyJoinError;
  }

  return (await response.json()) as LobbyJoinSuccess;
};

export const joinGameroom = async ({
  lobbyId,
  playerId,
  joinBaseUrl,
}: JoinPayload): Promise<LobbyJoinResponse> => {
  try {
    if (joinBaseUrl) {
      return await postJoin(formatJoinUrl(joinBaseUrl), playerId);
    }

    const lobbyManagerUrl = resolveLobbyManagerUrl();
    return await postJoin(
      `${lobbyManagerUrl}/lobbies/${lobbyId}/join`,
      playerId
    );
  } catch (error) {
    console.error("Failed during lobby join:", error);
    return {
      isError: true,
      error: "Unable to reach lobby. Please try again shortly.",
    };
  }
};
