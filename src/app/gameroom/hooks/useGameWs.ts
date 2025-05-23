"use client";

import { useEffect, useRef } from "react";
import { EventPayloadMap, GameEvent } from "../types";

type EventListener<T extends GameEvent> = (data: EventPayloadMap[T]) => void;

export const useGameSocket = (url: string) => {
  const socketRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<{
    [K in GameEvent]?: EventListener<K>[];
  }>({});

  useEffect(() => {
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("Game socket connected.");
    };

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as {
          event: GameEvent;
          data: EventPayloadMap[GameEvent];
        };

        const { event: eventName, data } = parsed;

        const listeners = listenersRef.current[eventName];
        if (listeners) {
          listeners.forEach((cb) => cb(data as any));
        }
      } catch (err) {
        console.error("Invalid game socket message:", event.data);
      }
    };

    socket.onerror = (err) => {
      console.error("Game socket error:", err);
    };

    socket.onclose = () => {
      console.warn("Game socket closed.");
    };

    return () => {
      socket.close();
    };
  }, [url]);

  // Allow component to send an event
  const sendEvent = <T extends GameEvent>(
    event: T,
    data: EventPayloadMap[T]
  ) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ event, data }));
    } else {
      console.warn("Socket not ready. Can't send:", event);
    }
  };

  // Allow component to listen to a specific event
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
  };
};
