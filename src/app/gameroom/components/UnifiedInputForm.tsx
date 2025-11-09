"use client";

import { Flex } from "@radix-ui/themes";
import { useAtom } from "jotai";
import React from "react";
import styles from "../gameroom.module.css";
import { useAnswer, useGameState } from "../hooks/useGameState";
import { unifiedInputAtom } from "../store/gameAtoms";
import AnswerBubbles, { BubbleAnswer } from "./answerChips/AnswerBubbles";

interface UnifiedInputFormProps {
  onSubmit: (message: string, isAnswer: boolean) => void;
  bubbles: BubbleAnswer[];
  onBubbleComplete: (id: string) => void;
}

export default function UnifiedInputForm({
  onSubmit,
  bubbles,
  onBubbleComplete,
}: UnifiedInputFormProps) {
  const { timeRemaining, isRoundBreak } = useGameState();
  const [input, setInput] = useAtom(unifiedInputAtom);
  const { clearAnswer } = useAnswer();

  const timeExpired = timeRemaining === 0;
  const isAnswerMode = !isRoundBreak && !timeExpired;
  const placeholderText = isAnswerMode ? "Type.." : "Chat...";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input.trim(), isAnswerMode);
      setInput("");
      clearAnswer();
    }
  };

  return (
    <form className={styles.unifiedInputFormOnly} onSubmit={handleSubmit}>
      <Flex direction="column" style={{ width: "100%" }}>
        {/* Always show answer bubbles and recent answers to prevent layout shift */}
        <div
          className={`${styles.answerAreaContainer} ${
            isAnswerMode ? styles.visible : styles.hidden
          }`}
        >
          <AnswerBubbles
            bubbles={bubbles}
            onBubbleComplete={onBubbleComplete}
          />
        </div>

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
        </Flex>
      </Flex>
    </form>
  );
}
