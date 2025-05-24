"use client";

import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { EventPayloadMap, GameEvent } from "../types";

type EventListener<T extends GameEvent> = (data: EventPayloadMap[T]) => void;

function toHttpUrl(wsUrl: string) {
  if (wsUrl.startsWith("ws://")) return "http://" + wsUrl.slice(5);
  if (wsUrl.startsWith("wss://")) return "https://" + wsUrl.slice(6);
  return wsUrl;
}

export const useGameSocket = (baseUrl: string, token: string) => {
  const socketRef = useRef<any>(null);
  const listenersRef = useRef<{
    [K in GameEvent]?: EventListener<K>[];
  }>({});

  useEffect(() => {
    const url = toHttpUrl(baseUrl); //Misleading - the url passed here is not baseUrl
    console.log("[Game WS] Connecting to:", url);
    const socket = io(url, {
      transports: ["websocket"],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Game WS] Connected");
    });

    // Add direct event listeners for each game event
    socket.on("lobby_tick", (data) => {
      console.log("[Game WS] Direct lobby_tick event:", data);
      const listeners = listenersRef.current["lobby_tick"];
      if (listeners) {
        listeners.forEach((cb) => cb(data));
      }
    });

    socket.on("game_starting_soon", (data) => {
      console.log("[Game WS] Direct game_starting_soon event:", data);
      const listeners = listenersRef.current["game_starting_soon"];
      if (listeners) {
        listeners.forEach((cb) => cb(data));
      }
    });

    socket.on("waiting_for_players", (data) => {
      console.log("[Game WS] Direct waiting_for_players event:", data);
      const listeners = listenersRef.current["waiting_for_players"];
      if (listeners) {
        listeners.forEach((cb) => cb(data));
      }
    });

    socket.on("game_start_cancelled", (data) => {
      console.log("[Game WS] Direct game_start_cancelled event:", data);
      const listeners = listenersRef.current["game_start_cancelled"];
      if (listeners) {
        listeners.forEach((cb) => cb(data));
      }
    });

    socket.on("new_round_starting", (data) => {
      console.log("[Game WS] Direct new_round_starting event:", data);
      const listeners = listenersRef.current["new_round_starting"];
      if (listeners) {
        listeners.forEach((cb) => cb(data));
      }
    });

    socket.on("slot_snapped", (data) => {
      console.log("[Game WS] Direct slot_snapped event:", data);
      const listeners = listenersRef.current["slot_snapped"];
      if (listeners) {
        listeners.forEach((cb) => cb(data));
      }
    });

    socket.on("round_over_timeout", (data) => {
      console.log("[Game WS] Direct round_over_timeout event:", data);
      const listeners = listenersRef.current["round_over_timeout"];
      if (listeners) {
        listeners.forEach((cb) => cb(data));
      }
    });

    socket.on("round_over_all_snapped", (data) => {
      console.log("[Game WS] Direct round_over_all_snapped event:", data);
      const listeners = listenersRef.current["round_over_all_snapped"];
      if (listeners) {
        listeners.forEach((cb) => cb(data));
      }
    });

    socket.on("break_starting", (data) => {
      console.log("[Game WS] Direct break_starting event:", data);
      const listeners = listenersRef.current["break_starting"];
      if (listeners) {
        listeners.forEach((cb) => cb(data));
      }
    });

    socket.on("game_over", (data) => {
      console.log("[Game WS] Direct game_over event:", data);
      const listeners = listenersRef.current["game_over"];
      if (listeners) {
        listeners.forEach((cb) => cb(data));
      }
    });

    socket.on("lobby_resetting_for_new_game", (data) => {
      console.log("[Game WS] Direct lobby_resetting_for_new_game event:", data);
      const listeners = listenersRef.current["lobby_resetting_for_new_game"];
      if (listeners) {
        listeners.forEach((cb) => cb(data));
      }
    });

    socket.on("submission_feedback", (data) => {
      console.log("[Game WS] Direct submission_feedback event:", data);
      const listeners = listenersRef.current["submission_feedback"];
      if (listeners) {
        listeners.forEach((cb) => cb(data));
      }
    });

    // I think this can be removed..
    socket.on("message", (event) => {
      console.log("[Game WS] Message event:", event);
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

  const offEvent = <T extends GameEvent>(
    event: T,
    callback: EventListener<T>
  ) => {
    const listeners = listenersRef.current[event];
    if (listeners) {
      const index = listeners.findIndex(cb => cb === callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  };

  return {
    sendEvent,
    onEvent,
    offEvent,
  };
};
