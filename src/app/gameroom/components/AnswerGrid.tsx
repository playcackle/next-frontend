"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { isRoundBreakAtom, roundHintsAtom } from "../store/gameAtoms";
import { Slot } from "../types/state";
import { slotHeatAtom } from "../store/gameAtoms";
import styles from "./AnswerGrid.module.css";

interface AnswerGridProps {
  slots: Slot[];
}

const heatLevelFromSimilarity = (score: number): number => {
  if (score >= 90) return 4;
  if (score >= 80) return 3;
  if (score >= 65) return 2;
  if (score >= 40) return 1;
  return 0;
};

const heatLevelFromAttempts = (attempts: number): number => {
  if (attempts >= 10) return 4;
  if (attempts >= 6) return 3;
  if (attempts >= 3) return 2;
  if (attempts >= 1) return 1;
  return 0;
};

const HEAT_NAMES = ["empty", "cool", "warm", "hot", "inferno"] as const;

const BOT_BOB_HINT_LABELS = [
  "Fine. Here's your help, loser",
  "Clues. Don't say we never gave you anything",
  "Ok ok, here's a lifeline. Nerd",
  "Clues incoming. Pretend you figured it out yourself",
  "Hints dropped. You're welcome, nerd",
  "BotBob says: use these, dork",
] as const;

export const AnswerGrid: React.FC<AnswerGridProps> = ({ slots }) => {
  const hints = useAtomValue(roundHintsAtom);
  const hintLabel = React.useMemo(
    () => BOT_BOB_HINT_LABELS[Math.floor(Math.random() * BOT_BOB_HINT_LABELS.length)],
    [],
  );
  const isRoundBreak = useAtomValue(isRoundBreakAtom);
  const slotHeat = useAtomValue(slotHeatAtom);
  const totalAnswers = slots.length;
  const snappedMap = new Map(slots.filter((s) => s.is_snapped).map((s) => [s.id, s]));
  const foundCount = snappedMap.size;
  const remaining = totalAnswers - foundCount;

  const snappedOrderRef = useRef<string[]>(
    slots.filter((s) => s.is_snapped).map((s) => s.id),
  );
  const [newlyFound, setNewlyFound] = useState<Set<string>>(new Set());
  const [snappedOrder, setSnappedOrder] = useState<string[]>(
    () => snappedOrderRef.current,
  );

  useEffect(() => {
    const existing = new Set(snappedOrderRef.current);
    const newIds = slots
      .filter((s) => s.is_snapped && !existing.has(s.id))
      .map((s) => s.id);

    if (newIds.length === 0) return;

    const updated = [...snappedOrderRef.current, ...newIds];
    snappedOrderRef.current = updated;
    setSnappedOrder(updated);
    setNewlyFound(new Set(newIds));
    const t = setTimeout(() => setNewlyFound(new Set()), 800);
    return () => clearTimeout(t);
  }, [slots]);

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
              const similarityScore = slotHeat[slot.id] ?? 0;
              const heatLevel = slot.is_snapped
                ? "found"
                : HEAT_NAMES[
                    Math.max(
                      heatLevelFromSimilarity(similarityScore),
                      heatLevelFromAttempts(attempts)
                    )
                  ];
              const showFlame = !slot.is_snapped && (attempts >= 6 || similarityScore >= 80);

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
      {foundCount > 0 && (
        <div className={styles.answerChipGrid}>
          {snappedOrder.flatMap((id) => {
            const slot = snappedMap.get(id);
            if (!slot) return [];
            const isNew = newlyFound.has(slot.id);
            return [
              <div
                key={slot.id}
                className={`${styles.answerChip} ${slot.is_rare ? styles.answerChipBonus : ""} ${isNew ? styles.answerChipNew : ""}`}
              >
                <div className={styles.answerChipContent}>
                  <span className={styles.answerChipText}>
                    {slot.canonical_text}
                  </span>
                  {slot.snapped_by_display_name && (
                    <span className={styles.answerChipPlayer}>
                      {slot.snapped_by_display_name}
                    </span>
                  )}
                </div>
                {slot.is_rare && (
                  <span className={styles.answerChipMultiplier}>2x</span>
                )}
              </div>,
            ];
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

      {/* Hints section — only shows unsnapped slots that have a text_preview */}
      {(() => {
        const hintSlots = slots.filter(
          (s) => !s.is_snapped && s.text_preview && s.text_preview.trim() !== "",
        );
        if (hintSlots.length === 0) return null;
        return (
          <div className={styles.hintsSection}>
            <p className={styles.hintsSectionLabel}>{hintLabel}</p>
            <div className={styles.hintsGrid}>
              {hintSlots.map((slot) => (
                <div key={slot.id} className={styles.hintChip}>
                  <span className={styles.hintChipText}>{slot.text_preview}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Round hints — hidden during round breaks */}
      {!isRoundBreak && hints.length > 0 && (
        <div className={styles.hintsSection}>
          <p className={styles.hintsSectionLabel}>{hintLabel}</p>
          <div className={styles.hintsGrid}>
            {hints.map((hint, index) => (
              <div key={index} className={styles.hintChip}>
                <span className={styles.hintChipText}>{hint.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(AnswerGrid);
