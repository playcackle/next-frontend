"use client";

import { useEffect, useRef, useState } from "react";
import { ChatEvent, ChatEventPayloadMap } from "../types";

type ChatMessage = ChatEventPayloadMap["new_message"];

export const useChatSocket = (url: string) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("Chat socket connected.");
    };

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as {
          event: ChatEvent;
          data: ChatEventPayloadMap[ChatEvent];
        };

        if (parsed.event === "new_message") {
          setMessages((prev) => [...prev, parsed.data as ChatMessage]);
        } else if (parsed.event === "connection_success_chat") {
          console.log("connection_success_chat");
        }
      } catch (err) {
        console.error("Error parsing chat event:", event.data);
      }
    };

    socket.onerror = (err) => {
      console.error("Chat socket error:", err);
    };

    socket.onclose = () => {
      console.warn("Chat socket closed.");
    };

    return () => {
      socket.close();
    };
  }, [url]);

  const sendMessage = (text: string) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          event: "send_message",
          data: { text },
        })
      );
    }
  };

  return {
    messages,
    sendMessage,
  };
};
