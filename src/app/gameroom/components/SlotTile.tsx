"use client";

import { useSession } from "next-auth/react";
import React, { useMemo } from "react";
import styles from "../gameroom.module.css";
import { useAnimationState } from "../hooks/useGameState";
import { Slot } from "../types/state";

interface SlotTileProps {
  slot: Slot;
  isBonus?: boolean;
  revealDelay: number;
  entranceDelay: string;
  className: string;
}

const SlotTile: React.FC<SlotTileProps> = ({
  slot,
  entranceDelay = 0,
  className,
}) => {
  const { data } = useSession();
  // Only get animation state, not time-dependent state
  const { attentionAnimation, slotId } = useAnimationState();

  // Memoize all calculations based on props
  const displayState = useMemo(() => {
    const shouldShowContent = slot.is_snapped;
    const shouldShowAttention =
      slot.is_snapped && slot.snapped_by_player_id === data?.user.id;

    return {
      shouldShowContent,
      shouldShowAttention,
      roomColor: slot.is_snapped ? "var(--neon-purple)" : "var(--neon-pink)",
    };
  }, [slot.is_snapped]);

  const tileClassNames = useMemo(
    () =>
      [
        styles.slotTile,
        slot.is_rare ? styles.bonusTile : "",
        slot.is_snapped ? styles.answered : "",
        slot.id === slotId ? styles.correctPulse : "",
        displayState.shouldShowAttention ? attentionAnimation : "",
      ].join(" "),
    [
      slot.is_snapped,
      slot.is_rare,
      slot.id,
      attentionAnimation,
      displayState.shouldShowAttention,
    ]
  );

  const content = useMemo(() => {
    if (displayState.shouldShowContent) {
      return (
        <div className={styles.answeredContent}>
          <div className={styles.correctAnswer}>{slot.canonical_text}</div>
          {slot.snapped_by_display_name && (
            <div className={styles.playerBadge}>
              <div className={styles.playerBadgeName}>
                {slot.snapped_by_display_name}
              </div>
            </div>
          )}
        </div>
      );
    }
    return <div className={styles.questionMark}>?</div>;
  }, [
    displayState.shouldShowContent,
    slot.text_preview,
    slot.snapped_by_display_name,
  ]);

  return (
    <div
      id={`slot-${slot.id}`}
      className={`${tileClassNames} ${className}`}
      style={
        {
          animationDelay: entranceDelay,
          "--room-color": displayState.roomColor,
        } as React.CSSProperties
      }
    >
      {content}
    </div>
  );
};

// Optimized memo comparison - only re-render when these specific props change
export default React.memo(SlotTile, (prevProps, nextProps) => {
  return (
    prevProps.slot.id === nextProps.slot.id &&
    prevProps.slot.is_snapped === nextProps.slot.is_snapped &&
    prevProps.slot.text_preview === nextProps.slot.text_preview &&
    prevProps.slot.snapped_by_display_name ===
      nextProps.slot.snapped_by_display_name &&
    prevProps.revealDelay === nextProps.revealDelay &&
    prevProps.entranceDelay === nextProps.entranceDelay
  );
});
