"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { ChatEvent, ChatEventPayloadMap } from "../types";

type ChatMessage = ChatEventPayloadMap["new_message"];

export const useChatSocket = (url: string, token: string) => {
  const socketRef = useRef<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const socket = io(url, {
      transports: ["websocket"],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Chat socket connected.");
    });

    socket.on("message", (event) => {
      try {
        const parsed = JSON.parse(event) as {
          event: ChatEvent;
          data: ChatEventPayloadMap[ChatEvent];
        };

        if (parsed.event === "new_message") {
          setMessages((prev) => [...prev, parsed.data as ChatMessage]);
        } else if (parsed.event === "connection_success_chat") {
          console.log("connection_success_chat");
        }
      } catch (err) {
        console.error("Error parsing chat event:", event);
      }
    });

    socket.on("error", (err) => {
      console.error("Chat socket error:", err);
    });

    socket.on("disconnect", () => {
      console.warn("Chat socket closed.");
    });

    return () => {
      socket.disconnect();
    };
  }, [url, token]);

  const sendMessage = (text: string) => {
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit("message", JSON.stringify({
        event: "send_message",
        data: { text },
      }));
    }
  };

  return {
    messages,
    sendMessage,
  };
};
