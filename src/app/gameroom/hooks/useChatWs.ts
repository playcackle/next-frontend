"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ChatEventPayloadMap } from "../types";

type ChatMessage = ChatEventPayloadMap["new_message"];

interface ChatState {
  messages: ChatMessage[];
  error: string | null;
  isConnected: boolean;
}

function toHttpUrl(wsUrl: string): string {
  if (wsUrl.startsWith("ws://")) return "http://" + wsUrl.slice(5);
  if (wsUrl.startsWith("wss://")) return "https://" + wsUrl.slice(6);
  return wsUrl;
}

export const useChatSocket = (baseUrl: string, token: string) => {
  const socketRef = useRef<Socket | null>(null);
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    error: null,
    isConnected: false,
  });

  useEffect(() => {
    const url = toHttpUrl(baseUrl) + "/chat";
    const socket = io(url, {
      transports: ["websocket"],
      auth: { token },
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setChatState((prev) => ({
        ...prev,
        isConnected: true,
        error: null,
      }));
    });

    socket.on("new_message", (data: ChatMessage) => {
      setChatState((prev) => ({
        ...prev,
        messages: [...prev.messages, data],
      }));
    });

    socket.on("connection_success_chat", (data) => {
      console.log("Chat connection success:", data.message);
    });

    socket.on("message_error", (data) => {
      setChatState((prev) => ({
        ...prev,
        error: data.error,
      }));
    });

    socket.on("error", (err) => {
      console.error("Chat socket error:", err);
      setChatState((prev) => ({
        ...prev,
        error: "Connection error",
        isConnected: false,
      }));
    });

    socket.on("disconnect", () => {
      setChatState((prev) => ({
        ...prev,
        isConnected: false,
        error: "Disconnected from chat",
      }));
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [baseUrl, token]);

  const sendMessage = useCallback((text: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      setChatState((prev) => ({
        ...prev,
        error: "Not connected to chat",
      }));
      return false;
    }

    try {
      socket.emit("send_message", text);
      return true;
    } catch (error) {
      setChatState((prev) => ({
        ...prev,
        error: "Failed to send message",
      }));
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setChatState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...chatState,
    sendMessage,
    clearError,
  };
};
