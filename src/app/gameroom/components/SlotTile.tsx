"use client";

import React, { useEffect, useState } from "react";
import styles from "../gameroom.module.css";
import type { Slot } from "../types";

interface SlotTileProps {
  slot: Slot;
  isAnimating: boolean;
  timeExpired: boolean;
  isIntermission: boolean;
  isBonus?: boolean;
}

const SlotTile: React.FC<SlotTileProps> = ({
  slot,
  isAnimating,
  timeExpired,
  isIntermission,
  isBonus = false,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prepare animationDelay only after mount to avoid SSR mismatch
  const animationDelay = mounted
    ? timeExpired && !slot.answered
      ? `${slot.revealDelay}s`
      : `${slot.entranceDelay}s`
    : undefined;

  const tileClassNames = [
    styles.questionTile,
    isBonus ? styles.bonusTile : "",
    slot.answered ? styles.answered : "",
    mounted && isAnimating ? styles.correctPulse : "",
    mounted ? slot.animation : "",
    mounted ? slot.entranceAnimation : "",
    mounted && timeExpired && !slot.answered ? slot.revealAnimation : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      id={`question-${slot.id}`}
      className={tileClassNames}
      style={
        {
          "--room-color": isBonus ? "var(--neon-purple)" : "var(--neon-pink)",
          animationDelay,
        } as React.CSSProperties
      }
    >
      {slot.answered || (timeExpired && !slot.answered) ? (
        <div className={styles.answeredContent}>
          <div className={styles.correctAnswer}>{slot.correctAnswer}</div>
          {slot.answeredBy && (
            <div className={styles.playerBadge}>
              <div
                className={styles.playerBadgeAvatar}
                style={{
                  background: slot.playerColor || "var(--neon-blue)",
                }}
              >
                {slot.playerAvatar || slot.answeredBy.substring(0, 2)}
              </div>
              <div className={styles.playerBadgeName}>{slot.answeredBy}</div>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.questionMark}>?</div>
      )}
    </div>
  );
};

export default React.memo(SlotTile);
