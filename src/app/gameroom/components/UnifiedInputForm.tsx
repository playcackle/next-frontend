"use client";

import { Button, Flex } from "@radix-ui/themes";
import { useAtom, useAtomValue } from "jotai";
import React from "react";
import styles from "../gameroom.module.css";
import { useGameState } from "../hooks/useGameState";
import {
  inputModeAtom,
  unifiedInputAtom,
} from "../store/gameAtoms";
import AnswerBubbles, { BubbleAnswer } from "./answerChips/AnswerBubbles";
import AnswerChips, { AnswerChip } from "./answerChips/AnswerChips";

interface UnifiedInputFormProps {
  onSubmit: (message: string, isAnswer: boolean) => void;
  bubbles: BubbleAnswer[];
  onBubbleComplete: (id: string) => void;
  recentAnswers: AnswerChip[];
}

export default function UnifiedInputForm({
  onSubmit,
  bubbles,
  onBubbleComplete,
  recentAnswers,
}: UnifiedInputFormProps) {
  const { timeRemaining, isRoundBreak } = useGameState();
  const [input, setInput] = useAtom(unifiedInputAtom);
  const inputMode = useAtomValue(inputModeAtom);

  const timeExpired = timeRemaining === 0;
  const isAnswerMode = !isRoundBreak && !timeExpired;
  const buttonText = isAnswerMode ? "Submit Answer" : "Send Message";
  const placeholderText = isAnswerMode 
    ? "Enter your answer (visible to all players)..." 
    : "Type a chat message...";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input.trim(), isAnswerMode);
      setInput("");
    }
  };

  return (
    <form className={styles.unifiedInputFormOnly} onSubmit={handleSubmit}>
      <Flex direction="column" style={{ width: "100%" }}>
        {/* Show answer bubbles and recent answers only in answer mode */}
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
  );
}