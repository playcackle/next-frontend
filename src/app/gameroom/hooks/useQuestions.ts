"use client";

import { useCallback, useState } from "react";
import type { Player, Slot } from "../types";
import {
  getRandomAttentionAnimation,
  getRandomPlayer,
  initializeBonusQuestions,
  initializeQuestions,
} from "../utils";

export const useSlots = (roundNumber: number) => {
  // Initialize slots with random entrance animations and staggered delays
  const [slots, setQuestions] = useState<Slot[]>(() =>
    initializeQuestions(8, [], roundNumber)
  );

  // Initialize bonus slots with random entrance animations and staggered delays
  const [bonusQuestions, setBonusQuestions] = useState<Slot[]>(() =>
    initializeBonusQuestions(9, 2, [], roundNumber)
  );

  // Mark slot as answered
  const markQuestionAsAnswered = useCallback(
    (
      questionId: number,
      playerName: string,
      playerAvatar: string,
      playerColor: string,
      animation?: string
    ) => {
      const finalAnimation =
        animation || `animate__animated ${getRandomAttentionAnimation()}`;

      if (questionId <= 8) {
        setQuestions((prev) => {
          const updatedQuestions = [...prev];
          const index = updatedQuestions.findIndex((q) => q.id === questionId);
          if (index !== -1) {
            updatedQuestions[index] = {
              ...updatedQuestions[index],
              answered: true,
              answeredBy: playerName,
              playerAvatar: playerAvatar,
              playerColor: playerColor,
              animation: finalAnimation,
            };
          }
          return updatedQuestions;
        });
      } else {
        setBonusQuestions((prev) => {
          const updatedBonusQuestions = [...prev];
          const index = updatedBonusQuestions.findIndex(
            (q) => q.id === questionId
          );
          if (index !== -1) {
            updatedBonusQuestions[index] = {
              ...updatedBonusQuestions[index],
              answered: true,
              answeredBy: playerName,
              playerAvatar: playerAvatar,
              playerColor: playerColor,
              animation: finalAnimation,
            };
          }
          return updatedBonusQuestions;
        });
      }
    },
    []
  );

  // Reveal all unanswered slots (for time expiration)
  const revealAllUnansweredQuestions = useCallback((players: Player[]) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (!q.answered) {
          const randomPlayer = getRandomPlayer(players);
          return {
            ...q,
            answered: true,
            answeredBy: randomPlayer.name,
            playerAvatar: randomPlayer.avatar,
            playerColor: randomPlayer.color,
          };
        }
        return q;
      })
    );

    setBonusQuestions((prev) =>
      prev.map((q) => {
        if (!q.answered) {
          const randomPlayer = getRandomPlayer(players);
          return {
            ...q,
            answered: true,
            answeredBy: randomPlayer.name,
            playerAvatar: randomPlayer.avatar,
            playerColor: randomPlayer.color,
          };
        }
        return q;
      })
    );
  }, []);

  // Check if all slots are answered
  const areAllQuestionsAnswered = useCallback(() => {
    return [...slots, ...bonusQuestions].every((q) => q.answered);
  }, [slots, bonusQuestions]);

  // Get unanswered slots
  const getUnansweredQuestions = useCallback(() => {
    return [...slots, ...bonusQuestions].filter((q) => !q.answered);
  }, [slots, bonusQuestions]);

  // Get slot by ID
  const getQuestionById = useCallback(
    (id: number) => {
      if (id <= 8) {
        return slots.find((q) => q.id === id);
      } else {
        return bonusQuestions.find((q) => q.id === id);
      }
    },
    [slots, bonusQuestions]
  );

  return {
    slots,
    bonusQuestions,
    markQuestionAsAnswered,
    revealAllUnansweredQuestions,
    areAllQuestionsAnswered,
    getUnansweredQuestions,
    getQuestionById,
  };
};
