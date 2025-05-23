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

  const { messages, sendMessage } = useChatSocket(gameroom!.chat_ws_url, gameroom!.token);

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

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <h3>Chat Room</h3>
      </div>
      <div className={styles.chatMessages}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`${styles.chatMessage} ${
              msg.player_id === data?.user.id ? styles.ownMessage : ""
            }`}
          >
            <span className={styles.messageTime}>{msg.timestamp}</span>
            <span className={styles.messageUser}>{msg.display_name}:</span>
            <span className={styles.messageText}>{msg.text}</span>
          </div>
        ))}
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
          />
          <Button type="submit" className={styles.chatSendButton}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
