/**
 * OPTIMIZED GAME COMPONENTS WITH DEBOUNCING
 *
 * This file contains enhanced versions of the game components with strategic
 * debouncing optimizations to improve performance and user experience.
 *
 * Key optimizations:
 * - Debounced high-frequency events (lobby ticks, user input)
 * - Prevented double-submissions and spam
 * - Reduced unnecessary re-renders
 * - Maintained real-time responsiveness for critical actions
 */

// =====================================================
// ENHANCED GAME SOCKET HOOK
// =====================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { EventPayloadMap, GameEvent } from "../types";
import { debounce } from "../utils";

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

// Connection configuration
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_BASE = 1000;

export const useGameSocket = (baseUrl: string, token: string) => {
  // ==================== REFS AND STATE ====================

  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Map<GameEvent, Set<EventListener<any>>>>(
    new Map()
  );
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      }, 1000), // 1 second debounce for error logging
    []
  );

  // ==================== CONNECTION MANAGEMENT ====================

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    // Stop trying after max attempts
    if (socketState.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      setSocketState((prev) => ({
        ...prev,
        connectionStatus: "error",
        error: "Max reconnection attempts reached",
      }));
      return;
    }

    // Calculate exponential backoff delay (max 30 seconds)
    const delay = Math.min(
      RECONNECT_DELAY_BASE * Math.pow(2, socketState.reconnectAttempts),
      30000
    );

    // Update state to show reconnecting status
    setSocketState((prev) => ({
      ...prev,
      connectionStatus: "reconnecting",
      reconnectAttempts: prev.reconnectAttempts + 1,
    }));

    // Schedule the reconnection attempt
    reconnectTimeoutRef.current = setTimeout(() => {
      initializeSocket();
    }, delay);
  }, [socketState.reconnectAttempts]);

  // ==================== SOCKET INITIALIZATION ====================

  const initializeSocket = useCallback(() => {
    // Clean up any existing socket connection
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }

    // Create new socket connection
    const socket = io(baseUrl, {
      transports: ["websocket"],
      auth: { token },
      timeout: 10000,
      forceNew: true,
    });

    socketRef.current = socket;

    // ========== CONNECTION EVENT HANDLERS ==========

    socket.on("connect", () => {
      // Successful connection - reset everything
      setSocketState({
        isConnected: true,
        connectionStatus: "connected",
        error: null,
        reconnectAttempts: 0,
      });
      clearReconnectTimeout();
    });

    socket.on("disconnect", (reason) => {
      // Connection lost
      setSocketState((prev) => ({
        ...prev,
        isConnected: false,
        connectionStatus: "disconnected",
        error: `Disconnected: ${reason}`,
      }));

      // Auto-reconnect unless user manually disconnected
      if (reason !== "io client disconnect") {
        scheduleReconnect();
      }
    });

    socket.on("connect_error", (error) => {
      // Connection failed
      setSocketState((prev) => ({
        ...prev,
        isConnected: false,
        connectionStatus: "error",
        error: `Connection error: ${error.message}`,
      }));
      scheduleReconnect();
    });

    // ========== GAME EVENT HANDLERS ==========

    // HIGH-FREQUENCY EVENTS (with debouncing)
    // Lobby tick events come frequently and can cause UI lag
    const debouncedLobbyTick = debounce((data) => {
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
    }, 50); // 50ms debounce - smooth but responsive

    // REGULAR GAME EVENTS (no debouncing needed)
    // These events are less frequent and need immediate handling
    const gameEvents: GameEvent[] = [
      "game_starting_soon",
      "waiting_for_players",
      "game_start_cancelled",
      "new_round_starting",
      "slot_snapped",
      "round_over_timeout",
      "round_over_all_snapped",
      "break_starting",
      "game_over",
      "lobby_resetting_for_new_game",
      "submission_feedback",
    ];

    // Set up the high-frequency event handler
    socket.on("lobby_tick", debouncedLobbyTick);

    // Set up regular event handlers
    gameEvents.forEach((eventName) => {
      socket.on(eventName, (data) => {
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
  }, [
    baseUrl,
    token,
    scheduleReconnect,
    clearReconnectTimeout,
    debouncedErrorLog,
  ]);

  // ==================== LIFECYCLE MANAGEMENT ====================

  useEffect(() => {
    // Initialize socket when component mounts or dependencies change
    initializeSocket();

    // Cleanup function
    return () => {
      clearReconnectTimeout();
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      // Clear all event listeners
      listenersRef.current.forEach((listeners) => listeners.clear());
      listenersRef.current.clear();
    };
  }, [initializeSocket, clearReconnectTimeout]);

  // ==================== PUBLIC API ====================

  // Send events to server (with debouncing to prevent spam)
  const sendEvent = useCallback(
    debounce(
      <T extends GameEvent>(
        event: T,
        data: T extends "submit_answer" ? string : EventPayloadMap[T]
      ) => {
        debugger;
        const socket = socketRef.current;
        if (!socket?.connected) {
          console.warn(`Cannot send ${event}: socket not connected`);
          return false;
        }

        try {
          socket.emit("message", JSON.stringify({ event, data }));
          return true;
        } catch (error) {
          debouncedErrorLog(`Error sending ${event}:`, error);
          return false;
        }
      },
      100
    ), // 100ms debounce to prevent rapid-fire submissions
    [debouncedErrorLog]
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
    []
  );

  // Manual reconnect function
  const reconnect = useCallback(() => {
    setSocketState((prev) => ({ ...prev, reconnectAttempts: 0 }));
    initializeSocket();
  }, [initializeSocket]);

  return {
    sendEvent,
    onEvent,
    reconnect,
    ...socketState,
  };
};
