"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { EventPayloadMap, GameEvent } from "../types";

type EventListener<T extends GameEvent> = (data: EventPayloadMap[T]) => void;

export const useGameSocket = (baseUrl: string, token: string) => {
  const socketRef = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef<{
    [K in GameEvent]?: EventListener<K>[];
  }>({});

  useEffect(() => {
    if (socketRef.current) return;
    const socket = io(baseUrl, {
      transports: ["websocket"],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
    });

    // Add direct event listeners for each game event
    socket.on("lobby_tick", (data) => {
      const listeners = listenersRef.current["lobby_tick"];
      if (listeners) {
        listeners.forEach((cb) => cb(data));
      }
    });

    socket.on("game_starting_soon", (data) => {
      const listeners = listenersRef.current["game_starting_soon"];
      if (listeners) {
        listeners.forEach((cb) => cb(data));
      }
    });

    socket.on("waiting_for_players", (data) => {
      const listeners = listenersRef.current["waiting_for_players"];
      if (listeners) {
        listeners.forEach((cb) => cb(data));
      }
    });

    socket.on("game_start_cancelled", (data) => {
      const listeners = listenersRef.current["game_start_cancelled"];
      if (listeners) {
        listeners.forEach((cb) => cb(data));
      }
    });

    socket.on("new_round_starting", (data) => {
      const listeners = listenersRef.current["new_round_starting"];
      if (listeners) {
        listeners.forEach((cb) => cb(data));
      }
    });

    socket.on("slot_snapped", (data) => {
      const listeners = listenersRef.current["slot_snapped"];
      if (listeners) {
        listeners.forEach((cb) => cb(data));
      }
    });

    socket.on("round_over_timeout", (data) => {
      const listeners = listenersRef.current["round_over_timeout"];
      if (listeners) {
        listeners.forEach((cb) => cb(data));
      }
    });

    socket.on("round_over_all_snapped", (data) => {
      const listeners = listenersRef.current["round_over_all_snapped"];
      if (listeners) {
        listeners.forEach((cb) => cb(data));
      }
    });

    socket.on("break_starting", (data) => {
      const listeners = listenersRef.current["break_starting"];
      if (listeners) {
        listeners.forEach((cb) => cb(data));
      }
    });

    socket.on("game_over", (data) => {
      const listeners = listenersRef.current["game_over"];
      if (listeners) {
        listeners.forEach((cb) => cb(data));
      }
    });

    socket.on("lobby_resetting_for_new_game", (data) => {
      const listeners = listenersRef.current["lobby_resetting_for_new_game"];
      if (listeners) {
        listeners.forEach((cb) => cb(data));
      }
    });

    socket.on("submission_feedback", (data) => {
      const listeners = listenersRef.current["submission_feedback"];
      if (listeners) {
        listeners.forEach((cb) => cb(data));
      }
    });

    // I think this can be removed..
    socket.on("message", (event) => {
      try {
        const parsed = JSON.parse(event) as {
          event: GameEvent;
          data: EventPayloadMap[GameEvent];
        };

        const { event: eventName, data } = parsed;
        console.log(`[Game WS] Parsed event: ${eventName}`, data);

        const listeners = listenersRef.current[eventName];
        if (listeners) {
          listeners.forEach((cb) => cb(data as any));
        }
      } catch (err) {
        console.error("[Game WS] Invalid message:", event);
      }
    });

    socket.on("error", (err) => {
      console.error("[Game WS] Socket error:", err);
    });

    socket.on("disconnect", () => {
      console.warn("[Game WS] Disconnected");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [baseUrl, token]);

  const sendEvent = <T extends GameEvent>(
    event: T,
    data: T extends "submit_answer" ? string : EventPayloadMap[T]
  ) => {
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit("message", JSON.stringify({ event, data }));
    } else {
      console.warn("Socket not ready. Can't send:", event);
    }
  };

  const onEvent = <T extends GameEvent>(
    event: T,
    callback: EventListener<T>
  ) => {
    if (!listenersRef.current[event]) {
      listenersRef.current[event] = [];
    }
    listenersRef.current[event]!.push(callback);
  };

  return {
    sendEvent,
    onEvent,
    isConnected,
  };
};
