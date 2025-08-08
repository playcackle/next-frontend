"use client";

import { Button, Flex } from "@radix-ui/themes";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSession } from "next-auth/react";
import React, { useEffect, useRef } from "react";
import styles from "../gameroom.module.css";
import { useGameState } from "../hooks/useGameState";
import {
  UnifiedMessage,
  addUnifiedMessageAtom,
  inputModeAtom,
  unifiedInputAtom,
  unifiedMessagesAtom,
} from "../store/gameAtoms";
import AnswerBubbles, { BubbleAnswer } from "./answerChips/AnswerBubbles";
import AnswerChips, { AnswerChip } from "./answerChips/AnswerChips";

interface UnifiedInputProps {
  onSubmit: (message: string, isAnswer: boolean) => void;
  bubbles: BubbleAnswer[];
  onBubbleComplete: (id: string) => void;
  recentAnswers: AnswerChip[];
}

export default function UnifiedInput({
  onSubmit,
  bubbles,
  onBubbleComplete,
  recentAnswers,
}: UnifiedInputProps) {
  const { data: session } = useSession();
  const { timeRemaining, isRoundBreak } = useGameState();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Unified state atoms
  const [input, setInput] = useAtom(unifiedInputAtom);
  const inputMode = useAtomValue(inputModeAtom);
  const messages = useAtomValue(unifiedMessagesAtom);
  const addMessage = useSetAtom(addUnifiedMessageAtom);

  const timeExpired = timeRemaining === 0;
  const isAnswerMode = !isRoundBreak && !timeExpired;
  const buttonText = isAnswerMode ? "Submit Answer" : "Send Message";
  const placeholderText = isAnswerMode 
    ? "Enter your answer (visible to all players)..." 
    : "Type a chat message...";

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input.trim(), isAnswerMode);
      setInput("");
    }
  };

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
        return '[ANSWER]';
      case 'successful_answer':
        return `[✓ +${message.points_awarded}]`;
      case 'failed_answer':
        return '[✗]';
      default:
        return '';
    }
  };

  return (
    <div className={styles.unifiedContainer}>
      {/* Messages Display - Always visible */}
      <div className={styles.unifiedMessages}>
        <div className={styles.unifiedHeader}>
          <h3>{isAnswerMode ? "Live Answers & Chat" : "Chat Room"}</h3>
        </div>
        
        <div className={styles.messagesScrollArea}>
          {messages.length === 0 ? (
            <div className={styles.messagesEmpty}>
              {isAnswerMode 
                ? "Answer submissions will appear here for all players to see..." 
                : "No messages yet. Start the conversation!"
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

      {/* Input Form */}
      <form className={styles.unifiedInputForm} onSubmit={handleSubmit}>
        <Flex direction="column" style={{ width: "100%" }}>
          {/* Show answer bubbles only in answer mode */}
          {isAnswerMode && (
            <>
              <AnswerBubbles bubbles={bubbles} onBubbleComplete={onBubbleComplete} />
              <AnswerChips answers={recentAnswers} />
            </>
          )}
          
          <Flex direction="row" gap="2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholderText}
              className={`${styles.unifiedInput} ${
                isAnswerMode ? styles.answerMode : styles.chatMode
              }`}
              disabled={timeExpired && !isRoundBreak}
            />
            <Button 
              type="submit" 
              className={`${styles.unifiedButton} ${
                isAnswerMode ? styles.answerButton : styles.chatButton
              }`}
              disabled={timeExpired && !isRoundBreak}
            >
              {buttonText}
            </Button>
          </Flex>
        </Flex>
      </form>
    </div>
  );
}