"use client";

import { Flex } from "@radix-ui/themes";
import { useAtom, useAtomValue } from "jotai";
import React from "react";
import styles from "./UnifiedInputForm.module.css";
import { useAnswer } from "../hooks/useGameState";
import {
  isRoundBreakAtom,
  timeRemainingAtom,
  unifiedInputAtom,
} from "../store/gameAtoms";
import { containsBannedLanguage } from "../utils/profanityFilter";
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
  // Use atomic selectors for optimal performance
  const timeRemaining = useAtomValue(timeRemainingAtom);
  const isRoundBreak = useAtomValue(isRoundBreakAtom);
  const [input, setInput] = useAtom(unifiedInputAtom);
  const { clearAnswer } = useAnswer();
  const [profanityError, setProfanityError] = useState(false);
  const [repeatError, setRepeatError] = useState(false);
  const recentAnswers = React.useRef<string[]>([]);

  const REPEAT_LIMIT = 5;

  const timeExpired = timeRemaining === 0;
  const isAnswerMode = !isRoundBreak && !timeExpired;
  const placeholderText = isAnswerMode ? "Type.." : "Chat...";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    // Clear errors as soon as the user edits the input
    if (profanityError) setProfanityError(false);
    if (repeatError) setRepeatError(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    if (containsBannedLanguage(trimmed)) {
      setProfanityError(true);
      return;
    }

    // Block if the last REPEAT_LIMIT submissions were the same answer
    const normalised = trimmed.toLowerCase();
    const recent = recentAnswers.current;
    if (
      recent.length >= REPEAT_LIMIT &&
      recent.slice(-REPEAT_LIMIT).every((a) => a === normalised)
    ) {
      setRepeatError(true);
      return;
    }

    // Track this submission; keep only the last REPEAT_LIMIT entries
    recentAnswers.current = [...recent, normalised].slice(-REPEAT_LIMIT);

    onSubmit(trimmed, isAnswerMode);
    setInput("");
    clearAnswer();
    setProfanityError(false);
    setRepeatError(false);
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

        <Flex direction="column" gap="1">
          {profanityError && (
            <span className={styles.profanityError}>
              Abusive or racist language is not allowed.
            </span>
          )}
          {repeatError && (
            <span className={styles.profanityError}>
              You cannot send the same answer more than {REPEAT_LIMIT} times in a row.
            </span>
          )}
          <Flex direction="row" gap="2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder={placeholderText}
              className={`${styles.unifiedInput} ${
                isAnswerMode ? styles.answerMode : styles.chatMode
              } ${profanityError || repeatError ? styles.inputError : ""}`}
            />
          </Flex>
        </Flex>
      </Flex>
    </form>
  );
}
