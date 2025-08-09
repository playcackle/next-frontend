"use client";

import { Flex } from "@radix-ui/themes";
import { useAtomValue } from "jotai";
import { useSession } from "next-auth/react";
import React, { useEffect, useRef } from "react";
import styles from "../gameroom.module.css";
import { useGameState } from "../hooks/useGameState";
import {
  UnifiedMessage,
  unifiedMessagesAtom,
} from "../store/gameAtoms";

export default function UnifiedMessages() {
  const { data: session } = useSession();
  const { isRoundBreak } = useGameState();
  const messages = useAtomValue(unifiedMessagesAtom);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return timestamp;
    }
  };

  const getMessageTypeClass = (messageType: string) => {
    switch (messageType) {
      case 'answer_attempt':
        return styles.answerMessage;
      case 'successful_answer':
        return styles.successfulAnswerMessage;
      case 'failed_answer':
        return styles.failedAnswerMessage;
      default:
        return styles.chatMessage;
    }
  };

  const getMessagePrefix = (message: UnifiedMessage) => {
    switch (message.message_type) {
      case 'answer_attempt':
        return '💡';
      case 'successful_answer':
        return `✅ +${message.points_awarded}`;
      case 'failed_answer':
        return '❌';
      default:
        return '💬';
    }
  };

  return (
    <div className={styles.unifiedMessagesContainer}>
      <div className={styles.unifiedHeader}>
        <h3>{isRoundBreak ? "💬 Chat" : "⚡ Live Feed"}</h3>
      </div>
      
      <div className={styles.messagesScrollArea}>
        {messages.length === 0 ? (
          <div className={styles.messagesEmpty}>
            {isRoundBreak 
              ? "💬 Start chatting!" 
              : "⚡ Answers will appear here..."
            }
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`${styles.unifiedMessage} ${getMessageTypeClass(msg.message_type)} ${
                msg.player_id === session?.user.id ? styles.ownMessage : ""
              }`}
            >
              <Flex direction="row" gap="2" align="center">
                <span className={styles.messagePrefix}>
                  {getMessagePrefix(msg)}
                </span>
                <span className={styles.messageUser}>{msg.display_name}</span>
                <span className={styles.messageTime}>
                  {formatTimestamp(msg.timestamp)}
                </span>
              </Flex>
              <div className={styles.messageContent}>
                {msg.text}
                {msg.canonical_text && msg.canonical_text !== msg.text && (
                  <span className={styles.canonicalAnswer}>
                    {" "}→ "{msg.canonical_text}"
                  </span>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}