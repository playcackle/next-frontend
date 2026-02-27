"use client";

import { Flex } from "@radix-ui/themes";
import { useAtomValue } from "jotai";
import { useUser } from "@/hooks/useUser";
import { useEffect, useRef } from "react";
import React from "react";
import styles from "../gameroom.module.css";
import {
  botBobLastMessageAtom,
  isRoundBreakAtom,
  unifiedMessagesAtom,
  type UnifiedMessage,
} from "../store/gameAtoms";
import BotBobPinnedMessage from "./BotBobPinnedMessage";
import PlayerAvatar from "./PlayerAvatar";

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
    if (msg.player_id === "botbob" || msg.display_name.toLowerCase() === "botbob") {
      return styles.botBobMessage;
    }
    switch (msg.message_type) {
      case "answer_attempt":
        // already_snapped is distinct from wrong/too_slow — muted amber, not red
        if (msg.submission_result === "already_snapped") {
          return styles.duplicateMessage;
        }
        return styles.answerMessage;
      case "successful_answer":
        return styles.successfulAnswerMessage;
      case "failed_answer":
        return styles.failedAnswerMessage;
      default:
        return styles.chatMessage;
    }
  };

  /** Returns a badge element for non-chat message types, or null for plain chat. */
  const getMessageBadge = (msg: UnifiedMessage): React.ReactNode | null => {
    if (msg.player_id === "botbob" || msg.display_name.toLowerCase() === "botbob") {
      return (
        <span className={`${styles.messageBadge} ${styles.messageBadgeBot}`}>
          BOT
        </span>
      );
    }
    if (msg.message_type === "successful_answer") {
      return (
        <span className={`${styles.messageBadge} ${styles.messageBadgeCorrect}`}>
          CORRECT
        </span>
      );
    }
    if (msg.message_type === "answer_attempt" && msg.submission_result === "already_snapped") {
      return (
        <span className={`${styles.messageBadge} ${styles.messageBadgeDuplicate}`}>
          TAKEN
        </span>
      );
    }
    if (msg.message_type === "failed_answer" || msg.message_type === "answer_attempt") {
      return (
        <span className={`${styles.messageBadge} ${styles.messageBadgeFailed}`}>
          MISS
        </span>
      );
    }
    return null;
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
                    : msg.message_type === "failed_answer" ||
                      (msg.message_type === "answer_attempt" &&
                        msg.submission_result !== "already_snapped")
                    ? styles.ownFailedAnswerMessage
                    : msg.message_type === "chat"
                    ? styles.ownMessage
                    : "" // answer_attempt already_snapped — orange from .duplicateMessage preserved
                  : ""
              }`}
            >
              <Flex direction="row" gap="2" align="center">
                <PlayerAvatar
                  playerId={msg.player_id}
                  displayName={msg.display_name}
                  size="small"
                />
                <div className={styles.messageContentWrapper}>
                  {getMessageBadge(msg)}
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
