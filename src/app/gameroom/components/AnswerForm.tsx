"use client";

import { Button } from "@radix-ui/themes";
import React from "react";
import styles from "../gameroom.module.css";
import { formatTime } from "../utils";

interface AnswerFormProps {
  answer: string;
  setAnswer: (value: string) => void;
  timeExpired: boolean;
  isIntermission: boolean;
  intermissionTimeRemaining: number;
  onSubmit: (e: React.FormEvent) => void;
}

const AnswerForm: React.FC<AnswerFormProps> = ({
  answer,
  setAnswer,
  timeExpired,
  isIntermission,
  intermissionTimeRemaining,
  onSubmit,
}) => {
  return (
    <form className={styles.answerForm} onSubmit={onSubmit}>
      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder={
          isIntermission
            ? `Intermission: Next round in ${formatTime(
                intermissionTimeRemaining
              )}`
            : timeExpired
            ? "Time's up! Answers revealed."
            : "Type your answer here..."
        }
        className={styles.answerInput}
        disabled={timeExpired || isIntermission}
      />
      <Button
        type="submit"
        className={styles.answerButton}
        disabled={timeExpired || isIntermission}
      >
        Submit
      </Button>
    </form>
  );
};

export default React.memo(AnswerForm);
