"use client";

import type React from "react";

import { Button } from "@radix-ui/themes";
import { useEffect, useRef } from "react";
import styles from "./gameroom.module.css";

type Message = {
  user: string;
  text: string;
  time: string;
};

type ChatContainerProps = {
  chatInput: string;
  setChatInput: (value: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
};

export default function ChatContainer({
  chatInput,
  setChatInput,
  handleSendMessage,
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
              msg.user === "You" ? styles.ownMessage : ""
            }`}
          >
            <span className={styles.messageTime}>{msg.time}</span>
            <span className={styles.messageUser}>{msg.user}:</span>
            <span className={styles.messageText}>{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className={styles.chatInput}>
        <form onSubmit={handleSendMessage} className={styles.chatInputForm}>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
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
