/**
 * GAME SOCKET HOOK — resilient connection with native socket.io reconnection
 *
 * Key design decisions:
 * - Uses socket.io's built-in reconnection for transparent mid-game reconnects
 * - Never triggers full loading screen on transient disconnects
 * - Exposes granular connectionStatus for UI overlay banners
 * - Relies on server-emitted state sync after connect/reconnect
 */

import { captureException } from "@/lib/sentry";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  SOCKET_MAX_RECONNECT_ATTEMPTS,
  SOCKET_RECONNECT_DELAY_BASE,
  SOCKET_RECONNECT_DELAY_MAX,
} from "../constants";
import { EventPayloadMap, GameEvent } from "../types/payloads";
import { debounce } from "../utils";

// Module-level guard: capture at most once per 30 seconds across all socket instances
let lastConnectErrorCapture = 0;

type EventListener<T extends GameEvent> = (data: EventPayloadMap[T]) => void;

interface SocketState {
  isConnected: boolean;
  connectionStatus:
    | "connecting"
    | "connected"
    | "disconnected"
    | "error"
    | "reconnecting";
  error: string | null;
  reconnectAttempts: number;
}


export const useGameSocket = (baseUrl: string, token: string) => {
  // ==================== REFS AND STATE ====================

  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Map<GameEvent, Set<EventListener<any>>>>(
    new Map(),
  );

  const [socketState, setSocketState] = useState<SocketState>({
    isConnected: false,
    connectionStatus: "connecting",
    error: null,
    reconnectAttempts: 0,
  });

  // ==================== DEBOUNCED UTILITIES ====================

  // Prevent console spam from repeated errors
  const debouncedErrorLog = useMemo(
    () =>
      debounce((message: string, error?: any) => {
        console.error(message, error);
      }, 1000),
    [],
  );

  // ==================== SOCKET INITIALIZATION ====================

  useEffect(() => {
    // Skip connection when URL is empty (no gameroom selected)
    if (!baseUrl) {
      return;
    }

    // Create socket with native reconnection enabled
    const socket = io(baseUrl, {
      transports: ["websocket"],
      auth: { token },
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: SOCKET_MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: SOCKET_RECONNECT_DELAY_BASE,
      reconnectionDelayMax: SOCKET_RECONNECT_DELAY_MAX,
    });

    socketRef.current = socket;

    // ========== CONNECTION EVENT HANDLERS ==========

    socket.on("connect", () => {
      // NOTE: We no longer emit "request_state_sync" here because the server
      // already sends "lobby_state_sync" in on_connect. Having both caused a race
      // condition where the client-requested sync could arrive with stale state
      // (e.g. still showing IN_ROUND when the server had already transitioned
      // to ROUND_BREAK). The server's auto-emitted state sync is authoritative.
      setSocketState({
        isConnected: true,
        connectionStatus: "connected",
        error: null,
        reconnectAttempts: 0,
      });
    });

    socket.on("disconnect", (reason) => {
      setSocketState((prev) => ({
        ...prev,
        isConnected: false,
        connectionStatus: "disconnected",
        error: `Disconnected: ${reason}`,
      }));
      // socket.io will auto-reconnect unless user manually disconnected
    });

    socket.on("connect_error", (error) => {
      const now = Date.now();
      if (now - lastConnectErrorCapture > 30_000) {
        lastConnectErrorCapture = now;
        captureException(error, { tags: { source: "socket_connect_error" } });
      }
      setSocketState((prev) => ({
        ...prev,
        isConnected: false,
        connectionStatus: "error",
        error: `Connection error: ${error.message}`,
      }));
    });

    // Native socket.io reconnection events
    socket.io.on("reconnect_attempt", (attempt) => {
      setSocketState((prev) => ({
        ...prev,
        connectionStatus: "reconnecting",
        reconnectAttempts: attempt,
      }));
    });

    socket.io.on("reconnect", () => {
      setSocketState({
        isConnected: true,
        connectionStatus: "connected",
        error: null,
        reconnectAttempts: 0,
      });
      // The server already emits lobby_state_sync on the underlying "connect"
      // event (which fires before "reconnect"), so no request_state_sync is needed.
    });

    socket.io.on("reconnect_failed", () => {
      setSocketState((prev) => ({
        ...prev,
        connectionStatus: "disconnected",
        error: "Max reconnection attempts reached",
      }));
    });

    // ========== GAME EVENT HANDLERS ==========

    // HIGH-FREQUENCY EVENTS (with debouncing)
    const debouncedLobbyTick = debounce((data: any) => {
      const listeners = listenersRef.current.get("lobby_tick");
      if (listeners && listeners.size > 0) {
        listeners.forEach((callback) => {
          try {
            callback(data);
          } catch (error) {
            debouncedErrorLog("Error in lobby_tick listener:", error);
          }
        });
      }
    }, 50);

    // REGULAR GAME EVENTS (no debouncing needed)
    const gameEvents: GameEvent[] = [
      "game_starting_soon",
      "waiting_for_players",
      "game_start_cancelled",
      "round_starting_soon",
      "new_round_started",
      "slot_snapped",
      "round_over",
      "break_starting",
      "game_over",
      "lobby_resetting_for_new_game",
      "submission_feedback",
      "lobby_state_sync",
      "play_again_prompt",
      "play_again_count_update",
      "play_again_player_update",
      "play_again_result",
      "unified_message",
      "message_error",
    ];

    socket.on("lobby_tick", debouncedLobbyTick);

    gameEvents.forEach((eventName) => {
      socket.on(eventName, (data: any) => {
        const listeners = listenersRef.current.get(eventName);
        if (listeners && listeners.size > 0) {
          listeners.forEach((callback) => {
            try {
              callback(data);
            } catch (error) {
              debouncedErrorLog(`Error in ${eventName} listener:`, error);
            }
          });
        }
      });
    });

    // ========== CLEANUP ==========
    return () => {
      socket.removeAllListeners();
      socket.io.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      // Do not clear listenersRef here. These are logical subscribers owned by
      // useGameEvents/onEvent cleanup, not by a specific Socket.IO instance.
      // Clearing them during socket re-initialization can leave the new socket
      // connected with no app-level listeners for events such as unified_message.
    };
  }, [baseUrl, token, debouncedErrorLog]);

  // ==================== PUBLIC API ====================

  // Send events to server immediately (no debounce — submissions are time-sensitive)
  const sendEvent = useCallback(
    <T extends GameEvent>(
      event: T,
      data: T extends "submit_answer"
        ? string
        : T extends "send_message"
          ? string
          : T extends "play_again_response"
            ? { want_to_play: boolean }
            : EventPayloadMap[T],
    ) => {
      const socket = socketRef.current;
      if (!socket?.connected) {
        console.warn(`Cannot send ${event}: socket not connected`);
        return false;
      }

      try {
        socket.emit(event, data);
        return true;
      } catch (error) {
        debouncedErrorLog(`Error sending ${event}:`, error);
        return false;
      }
    },
    [debouncedErrorLog],
  );

  // Register event listeners
  const onEvent = useCallback(
    <T extends GameEvent>(event: T, callback: EventListener<T>) => {
      if (!listenersRef.current.has(event)) {
        listenersRef.current.set(event, new Set());
      }
      const listeners = listenersRef.current.get(event)!;
      listeners.add(callback);

      // Return cleanup function
      return () => {
        listeners.delete(callback);
        if (listeners.size === 0) {
          listenersRef.current.delete(event);
        }
      };
    },
    [],
  );

  // Manual reconnect function (for "Retry" button in UI)
  const reconnect = useCallback(() => {
    const socket = socketRef.current;
    if (socket && !socket.connected) {
      // Reset the Manager's attempt counter so reconnection logic fires fully
      socket.io.reconnectionAttempts(SOCKET_MAX_RECONNECT_ATTEMPTS);
      setSocketState((prev) => ({
        ...prev,
        reconnectAttempts: 0,
        connectionStatus: "reconnecting",
        error: null,
      }));
      socket.connect();
    }
  }, []);

  return {
    sendEvent,
    onEvent,
    reconnect,
    ...socketState,
  };
};
