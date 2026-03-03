"use client";

import { useUser } from "@/hooks/useUser";
import { Flex } from "@radix-ui/themes";
import { useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import styles from "../gameroom.module.css";
import {
  botBobLastMessageAtom,
  isRoundBreakAtom,
  unifiedMessagesAtom,
  type UnifiedMessage,
} from "../store/gameAtoms";
import BotBobPinnedMessage from "./BotBobPinnedMessage";

export default function UnifiedMessages() {
  const { user } = useUser();
  // Use atomic selector for optimal performance
  const isRoundBreak = useAtomValue(isRoundBreakAtom);
  const messages = useAtomValue(unifiedMessagesAtom);
  const botBobLastMessage = useAtomValue(botBobLastMessageAtom);
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

  const getMessageTypeClass = (msg: UnifiedMessage): string => {
    // Bot Bob detection must precede message_type switch — Bot Bob sends type "chat"
    if (
      msg.player_id === "botbob" ||
      msg.display_name.toLowerCase() === "botbob"
    ) {
      return styles.botBobMessage;
    }
    debugger;
    switch (msg.message_type) {
      case "answer_attempt":
        if (msg.submission_result === "already_snapped")
          return styles.duplicateMessage;
        if (msg.submission_result === "success")
          return styles.successfulAnswerMessage;
        return styles.chatMessage;
      case "successful_answer":
        return styles.successfulAnswerMessage;
      default:
        return styles.chatMessage;
    }
  };

  return (
    <div className={styles.unifiedMessagesContainer}>
      {/* Pinned Bot Bob section replaces the header */}
      <BotBobPinnedMessage message={botBobLastMessage} />

      <div className={styles.messagesScrollArea}>
        {messages.length === 0 ? (
          <div className={styles.messagesEmpty}>
            {isRoundBreak
              ? "💬 Start chatting!"
              : "⚡ Answers will appear here..."}
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`${styles.unifiedMessage} ${getMessageTypeClass(msg)} ${
                msg.player_id === user?.id
                  ? msg.message_type === "successful_answer"
                    ? styles.ownSuccessfulAnswerMessage
                    : msg.message_type === "chat"
                      ? styles.ownMessage
                      : "" // duplicate — orange from .duplicateMessage preserved
                  : ""
              }`}
            >
              <Flex direction="row" gap="2" align="center">
                <div className={styles.messageContentWrapper}>
                  <Flex direction="row" gap="2" align="center">
                    <span className={styles.messageUser}>
                      {msg.display_name}
                    </span>
                    <span className={styles.messageTime}>
                      {formatTimestamp(msg.timestamp)}
                    </span>
                  </Flex>
                  <div className={styles.messageContent}>
                    {msg.text}
                    {msg.canonical_text && msg.canonical_text !== msg.text && (
                      <span className={styles.canonicalAnswer}>
                        {" "}
                        → "{msg.canonical_text}"
                      </span>
                    )}
                  </div>
                </div>
              </Flex>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
