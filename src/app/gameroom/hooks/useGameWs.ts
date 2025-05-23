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
    const url = toHttpUrl(baseUrl) + "/game";
    const socket = io(url, {
      transports: ["websocket"],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Game socket connected.");
    });

    socket.on("message", (event) => {
      try {
        const parsed = JSON.parse(event) as {
          event: GameEvent;
          data: EventPayloadMap[GameEvent];
        };

        const { event: eventName, data } = parsed;

        const listeners = listenersRef.current[eventName];
        if (listeners) {
          listeners.forEach((cb) => cb(data as any));
        }
      } catch (err) {
        console.error("Invalid game socket message:", event);
      }
    });

    socket.on("error", (err) => {
      console.error("Game socket error:", err);
    });

    socket.on("disconnect", () => {
      console.warn("Game socket closed.");
    });

    return () => {
      socket.disconnect();
    };
  }, [baseUrl, token]);

  const sendEvent = <T extends GameEvent>(
    event: T,
    data: EventPayloadMap[T]
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
