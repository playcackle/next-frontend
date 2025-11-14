"use client";

import { useEffect, useState } from "react";
import { useGameState } from "../hooks/useGameState";
import styles from "./AnswerReveal.module.css";

type QuizAnswer = {
  id: number;
  answer: string;
  isRare?: boolean;
};

export default function AnswerReveal() {
  const [visibleAnswers, setVisibleAnswers] = useState<number[]>([]);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedAnimation, setSelectedAnimation] = useState<string>("");

  const { slots } = useGameState();

  const entranceAnimations = [
    "animate__fadeInDown",
    "animate__fadeInUp",
    "animate__fadeInLeft",
    "animate__fadeInRight",
    "animate__bounceIn",
    "animate__bounceInDown",
    "animate__bounceInUp",
    "animate__zoomIn",
    "animate__zoomInDown",
    "animate__zoomInUp",
    "animate__slideInLeft",
    "animate__slideInRight",
    "animate__flipInX",
    "animate__flipInY",
    "animate__rotateIn",
    "animate__lightSpeedInRight",
    "animate__lightSpeedInLeft",
    "animate__rollIn",
  ];

  useEffect(() => {
    const answers = slots.map(
      (x) =>
        ({
          id: x.id,
          answer: x.canonical_text,
          isRare: x.is_rare,
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
            } ${
              visibleAnswers.includes(x.id)
                ? `animate__animated ${selectedAnimation}`
                : styles.hidden
            }`}
          >
            <div className={styles.questionNumber}>#{i + 1}</div>
            <div className={styles.answerText}>{x.answer}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
