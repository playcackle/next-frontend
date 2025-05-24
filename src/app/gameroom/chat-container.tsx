"use client";

import { Button } from "@radix-ui/themes";
import { useAtomValue } from "jotai";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { gameRoomAtom } from "../store/lobby";
import styles from "./gameroom.module.css";
import { useChatSocket } from "./hooks/useChatWs";

export default function ChatContainer() {
  const { data } = useSession();
  const [input, setInput] = useState("");
  const gameroom = useAtomValue(gameRoomAtom);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper to get base URL (strip /game or /chat if present)
  function getBaseWsUrl(url: string) {
    return url.replace(/\/(game|chat)$/, "");
  }
  const baseWsUrl = getBaseWsUrl(gameroom!.game_ws_url);
  const { messages, error, sendMessage } = useChatSocket(baseWsUrl, gameroom!.token);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input.trim());
      setInput("");
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <h3>Chat Room</h3>
        {error && <div className={styles.chatError}>{error}</div>}
      </div>
      <div className={styles.chatMessages}>
        {messages.length === 0 ? (
          <div className={styles.chatEmpty}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`${styles.chatMessage} ${
                msg.player_id === data?.user.id ? styles.ownMessage : ""
              }`}
            >
              <div className={styles.messageHeader}>
                <span className={styles.messageUser}>{msg.display_name}</span>
                <span className={styles.messageTime}>
                  {formatTimestamp(msg.timestamp)}
                </span>
              </div>
              <div className={styles.messageContent}>{msg.text}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className={styles.chatInput}>
        <form onSubmit={handleSubmit} className={styles.chatInputForm}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className={styles.chatInputField}
            disabled={!!error}
          />
          <Button 
            type="submit" 
            className={styles.chatSendButton}
            disabled={!!error || !input.trim()}
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
