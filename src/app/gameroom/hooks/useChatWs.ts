"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { ChatEvent, ChatEventPayloadMap } from "../types";

type ChatMessage = ChatEventPayloadMap["new_message"];

// This should not be needed anymore
function toHttpUrl(wsUrl: string) {
  if (wsUrl.startsWith("ws://")) return "http://" + wsUrl.slice(5);
  if (wsUrl.startsWith("wss://")) return "https://" + wsUrl.slice(6);
  return wsUrl;
}

export const useChatSocket = (baseUrl: string, token: string) => {
  const socketRef = useRef<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = toHttpUrl(baseUrl) + "/chat";
    const socket = io(url, {
      transports: ["websocket"],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Chat socket connected.");
      setError(null);
    });

    socket.on("new_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("connection_success_chat", (data) => {
      console.log("Chat connection success:", data.message);
    });

    socket.on("message_error", (data) => {
      setError(data.error);
    });

    socket.on("error", (err) => {
      console.error("Chat socket error:", err);
      setError("Connection error");
    });

    socket.on("disconnect", () => {
      console.warn("Chat socket closed.");
      setError("Disconnected from chat");
    });

    return () => {
      socket.disconnect();
    };
  }, [baseUrl, token]);

  const sendMessage = (text: string) => {
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit("send_message", text);
    } else {
      setError("Not connected to chat");
    }
  };

  return {
    messages,
    error,
    sendMessage,
  };
};
