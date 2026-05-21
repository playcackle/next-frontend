import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { joinGameroom, type LobbyJoinSuccess } from "../joinGameroom";

// ============================================================================
// Mock fetch
// ============================================================================
const originalFetch = globalThis.fetch;
let consoleSpy: ReturnType<typeof vi.spyOn>;

function mockFetchOnce(response: {
  ok: boolean;
  status?: number;
  json: () => Promise<any>;
}) {
  globalThis.fetch = vi.fn().mockResolvedValueOnce({
    ok: response.ok,
    status: response.status ?? (response.ok ? 200 : 500),
    json: response.json,
  });
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_LOBBY_MANAGER_URL", "http://localhost:8001");
  consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.unstubAllEnvs();
  consoleSpy.mockRestore();
});

// ============================================================================
// Success cases
// ============================================================================
describe("joinGameroom – success", () => {
  it("joins via lobby manager when no joinBaseUrl provided", async () => {
    const successData: LobbyJoinSuccess = {
      player_id: "p1",
      token: "tok-abc",
      game_ws_url: "ws://localhost:8000/game",
    };

    mockFetchOnce({ ok: true, json: async () => successData });

    const result = await joinGameroom({
      lobbyId: "lobby-1",
      playerId: "p1",
    });

    expect(result).toEqual(successData);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8001/lobbies/lobby-1/join",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ player_id: "p1" }),
      })
    );
  });

  it("joins via joinBaseUrl when provided (direct gameroom URL)", async () => {
    const successData: LobbyJoinSuccess = {
      player_id: "p2",
      token: "tok-def",
      game_ws_url: "ws://gameroom-2:8000/game",
    };

    mockFetchOnce({ ok: true, json: async () => successData });

    const result = await joinGameroom({
      lobbyId: "lobby-2",
      playerId: "p2",
      joinBaseUrl: "http://gameroom-2:8000/",
    });

    expect(result).toEqual(successData);
    // Should use joinBaseUrl + /join, not lobby manager
    expect(fetch).toHaveBeenCalledWith(
      "http://gameroom-2:8000/join",
      expect.anything()
    );
  });

  it("trims trailing slash from joinBaseUrl", async () => {
    mockFetchOnce({
      ok: true,
      json: async () => ({
        player_id: "p1",
        token: "t",
        game_ws_url: "ws://a/game",
      }),
    });

    await joinGameroom({
      lobbyId: "l",
      playerId: "p1",
      joinBaseUrl: "http://host:8000/",
    });

    expect(fetch).toHaveBeenCalledWith(
      "http://host:8000/join",
      expect.anything()
    );
  });
});

// ============================================================================
// Error cases
// ============================================================================
describe("joinGameroom – errors", () => {
  it("returns error object on non-OK response", async () => {
    mockFetchOnce({
      ok: false,
      status: 409,
      json: async () => ({ detail: "Lobby is full" }),
    });

    const result = await joinGameroom({
      lobbyId: "lobby-1",
      playerId: "p1",
    });

    expect(result).toEqual({
      isError: true,
      error: "Lobby is full",
    });
  });

  it("returns network error when fetch throws", async () => {
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error("network down"));

    const result = await joinGameroom({
      lobbyId: "lobby-1",
      playerId: "p1",
    });

    expect(result).toEqual({
      isError: true,
      error: "Unable to reach lobby. Please try again shortly.",
    });
  });

  it("throws when NEXT_PUBLIC_LOBBY_MANAGER_URL is missing and no joinBaseUrl", async () => {
    vi.stubEnv("NEXT_PUBLIC_LOBBY_MANAGER_URL", "");

    const result = await joinGameroom({
      lobbyId: "lobby-1",
      playerId: "p1",
    });

    // Should be caught and return error (not throw)
    expect(result).toEqual({
      isError: true,
      error: "Unable to reach lobby. Please try again shortly.",
    });
  });
});
