"use client";

import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { slotsAtom } from "../store/gameAtoms";
import styles from "./AnswerReveal.module.css";

type QuizAnswer = {
  id: string;
  answer: string;
  isRare?: boolean;
  isAnswered: boolean;
  answeredBy: string | null;
};

export default function AnswerReveal() {
  const [visibleAnswers, setVisibleAnswers] = useState<string[]>([]);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);

  const slots = useAtomValue(slotsAtom);

  useEffect(() => {
    const answers = slots.map(
      (x) =>
        ({
          id: x.id,
          answer: x.canonical_text,
          isRare: x.is_rare,
          isAnswered: x.is_snapped,
          answeredBy: x.snapped_by_display_name,
        } as QuizAnswer)
    );
    setAnswers(answers);
  }, [slots]);

  useEffect(() => {
    if (answers.length === 0) return;

    // Reset visible answers when answers change
    setVisibleAnswers([]);

    const revealAnswers = () => {
      answers.forEach((answer, index) => {
        setTimeout(() => {
          setVisibleAnswers((prev) => [...prev, answer.id]);
        }, index * 400);
      });
    };

    revealAnswers();
  }, [answers]);

  return (
    <div className={styles.answersContainer}>
      <h2 className={styles.title}>Quiz Answers</h2>
      <div className={styles.answersListContainer}>
        {answers.map((x, i) => (
          <div
            key={x.id}
            className={`${styles.answerItem} ${
              x.isRare ? styles.rareAnswer : ""
            } ${x.isAnswered ? styles.answeredAnswer : ""} ${
              visibleAnswers.includes(x.id) ? styles.visible : styles.hidden
            }`}
          >
            <div className={styles.questionNumber}>#{i + 1}</div>
            <div className={styles.answerText}>{x.answer}</div>
            {x.isAnswered && x.answeredBy && (
              <div className={styles.playerName}>{x.answeredBy}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
