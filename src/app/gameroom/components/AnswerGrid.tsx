"use client";

import React, { useEffect, useRef, useState } from "react";
import { Slot } from "../types/state";
import styles from "./AnswerGrid.module.css";

interface AnswerGridProps {
  slots: Slot[];
}

export const AnswerGrid: React.FC<AnswerGridProps> = ({ slots }) => {
  const totalAnswers = slots.length;
  const snappedSlots = slots.filter((s) => s.is_snapped);
  const foundCount = snappedSlots.length;
  const remaining = totalAnswers - foundCount;

  const prevFoundCount = useRef(foundCount);
  const [newlyFound, setNewlyFound] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (foundCount > prevFoundCount.current) {
      const latest = new Set(
        slots
          .filter((s) => s.is_snapped)
          .slice(prevFoundCount.current)
          .map((s) => s.id),
      );
      setNewlyFound(latest);
      const t = setTimeout(() => setNewlyFound(new Set()), 800);
      prevFoundCount.current = foundCount;
      return () => clearTimeout(t);
    }
    prevFoundCount.current = foundCount;
  }, [foundCount, slots]);

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const fillPct = totalAnswers > 0 ? foundCount / totalAnswers : 0;
  const strokeDash = circumference * fillPct;

  return (
    <div className={styles.answerGridContainer}>
      {/* Hero: progress ring + status text */}
      <div className={styles.answerGridHero}>
        <div className={styles.progressRingWrapper}>
          <svg className={styles.progressRingSvg} viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="7"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="var(--neon-pink)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - strokeDash}
              className={styles.progressRingFill}
            />
          </svg>
          <div className={styles.progressRingLabel}>
            <span className={styles.progressRingCount}>{foundCount}</span>
            <span className={styles.progressRingTotal}>/ {totalAnswers}</span>
          </div>
        </div>

        <div className={styles.answerGridStatus}>
          <p className={styles.answerGridStatusTitle}>
            {foundCount === 0
              ? "No answers found yet"
              : foundCount === totalAnswers
                ? "All answers found!"
                : `${foundCount} answer${foundCount !== 1 ? "s" : ""} found`}
          </p>
          <p className={styles.answerGridStatusSub}>
            {remaining > 0
              ? `${remaining} still to find — keep typing!`
              : "Amazing round, you got them all!"}
          </p>

          {/* Mini dot indicators per slot */}
          <div className={styles.answerDotRow}>
            {slots.map((slot) => {
              const attempts = slot.failed_attempts ?? 0;
              const heatLevel = slot.is_snapped
                ? "found"
                : attempts >= 10
                  ? "inferno"
                  : attempts >= 6
                    ? "hot"
                    : attempts >= 3
                      ? "warm"
                      : attempts >= 1
                        ? "cool"
                        : "empty";
              const showFlame = !slot.is_snapped && attempts >= 6;

              return (
                <div
                  key={slot.id}
                  className={`${styles.answerDot} ${styles[`answerDot_${heatLevel}`]} ${slot.is_rare && slot.is_snapped ? styles.answerDotBonus : ""}`}
                  title={
                    attempts > 0
                      ? `${attempts} failed attempt${attempts !== 1 ? "s" : ""}`
                      : undefined
                  }
                >
                  {showFlame && (
                    <span
                      className={`${styles.dotFlame} ${heatLevel === "inferno" ? styles.dotFlameInferno : ""}`}
                    >
                      🔥
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Found answer chips */}
      {snappedSlots.length > 0 && (
        <div className={styles.answerChipGrid}>
          {snappedSlots.map((slot) => {
            const isNew = newlyFound.has(slot.id);
            return (
              <div
                key={slot.id}
                className={`${styles.answerChip} ${slot.is_rare ? styles.answerChipBonus : ""} ${isNew ? styles.answerChipNew : ""}`}
              >
                <span className={styles.answerChipText}>
                  {slot.canonical_text}
                </span>
                {slot.snapped_by_display_name && (
                  <span className={styles.answerChipPlayer}>
                    {slot.snapped_by_display_name}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Placeholder when nothing found */}
      {foundCount === 0 && (
        <div className={styles.answerGridPlaceholder}>
          <p>
            Type answers in the chat to fill this up. There are{" "}
            <strong>{totalAnswers}</strong> answers to find.
          </p>
        </div>
      )}
    </div>
  );
};

export default React.memo(AnswerGrid);
