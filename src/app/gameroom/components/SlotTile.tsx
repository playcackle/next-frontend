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
  revealDelay: number;
  entranceDelay: number;
  animation: string | null;
  entranceAnimation: string | null;
  revealAnimation: string | null;
  className: string;
}

const SlotTile: React.FC<SlotTileProps> = ({
  slot,
  isAnimating,
  timeExpired,
  isBonus = false,
  revealDelay = 0,
  entranceDelay = 0,
  animation,
  entranceAnimation,
  revealAnimation,
  className,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prepare animationDelay only after mount to avoid SSR mismatch
  const animationDelay = mounted
    ? timeExpired && !slot.is_snapped
      ? `${revealDelay}s`
      : `${entranceDelay}s`
    : undefined;

  const tileClassNames = [
    styles.questionTile,
    isBonus ? styles.bonusTile : "",
    slot.is_snapped ? styles.answered : "",
    mounted && isAnimating ? styles.correctPulse : "",
    mounted ? animation : "",
    mounted ? entranceAnimation : "",
    mounted && timeExpired && !slot.is_snapped ? revealAnimation : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      id={`slot-${slot.slot_id}`}
      className={`animated ${tileClassNames} {className}`}
      style={
        {
          "--room-color": isBonus ? "var(--neon-purple)" : "var(--neon-pink)",
          animationDelay,
        } as React.CSSProperties
      }
    >
      {slot.is_snapped || (timeExpired && !slot.is_snapped) ? (
        <div className={styles.answeredContent}>
          <div className={styles.correctAnswer}>{slot.text_preview}</div>
          {slot.snapped_by_display_name && (
            <div className={styles.playerBadge}>
              <div
                className={styles.playerBadgeAvatar}
                style={{
                  background: "var(--neon-blue)",
                }}
              >
                {slot.snapped_by_display_name}
              </div>
              <div className={styles.playerBadgeName}>
                {slot.snapped_by_display_name}
              </div>
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
