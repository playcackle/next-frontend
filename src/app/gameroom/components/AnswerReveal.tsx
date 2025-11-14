"use client";

import { useEffect, useState } from "react";
import { useGameState } from "../hooks/useGameState";
import styles from "./AnswerReveal.module.css";

type QuizAnswer = {
  id: number;
  answer: string;
  isRare?: boolean;
  isAnswered: boolean;
  answeredBy: string | null;
};

export default function AnswerReveal() {
  const [visibleAnswers, setVisibleAnswers] = useState<number[]>([]);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedAnimation, setSelectedAnimation] = useState<string>("");

  const { slots } = useGameState();

  const entranceAnimations = ["animate__slideInLeft"];

  useEffect(() => {
    const answers = slots.map(
      (x) =>
        ({
          id: x.id,
          answer: x.text_preview,
          isRare: x.is_rare,
          isAnswered: x.is_snapped,
          answeredBy: x.snapped_by_display_name,
        } as unknown as QuizAnswer)
    );
    setAnswers(answers);
  }, [slots]);

  useEffect(() => {
    const randomAnimation =
      entranceAnimations[Math.floor(Math.random() * entranceAnimations.length)];
    setSelectedAnimation(randomAnimation);
  }, []);

  useEffect(() => {
    if (!selectedAnimation || answers.length === 0) return;

    const revealAnswers = () => {
      answers.forEach((answer, index) => {
        setTimeout(() => {
          setVisibleAnswers((prev) => [...prev, answer.id]);
        }, index * 400);
      });
    };

    revealAnswers();
  }, [selectedAnimation]);

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
              visibleAnswers.includes(x.id)
                ? `animate__animated ${selectedAnimation}`
                : styles.hidden
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
