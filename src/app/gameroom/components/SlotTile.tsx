"use client";

import { useAtomValue } from "jotai";
import { useSession } from "next-auth/react";
import React, { useEffect, useMemo, useRef } from "react";
import styles from "../gameroom.module.css";
import { animationStateAtom } from "../store/gameAtoms";
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
  const animationState = useAtomValue(animationStateAtom);
  const hasAnimatedIn = useRef(false);

  useEffect(() => {
    const delay = parseFloat(entranceDelay as string) * 1000 + 500; // Add entrance animation duration
    const timer = setTimeout(() => {
      hasAnimatedIn.current = true;
    }, delay);
    return () => clearTimeout(timer);
  }, [entranceDelay]);

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
  }, [slot.is_snapped, slot.snapped_by_player_id, data?.user.id]);

  const tileClassNames = useMemo(
    () =>
      [
        styles.slotTile,
        slot.is_rare ? styles.bonusTile : "",
        slot.is_snapped ? styles.answered : "",
        slot.id === animationState.slotId ? styles.correctPulse : "",
        displayState.shouldShowAttention
          ? animationState.attentionAnimation
          : "",
      ].join(" "),
    [
      slot.is_snapped,
      slot.is_rare,
      slot.id,
      animationState.attentionAnimation,
      animationState.slotId,
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
    slot.canonical_text,
    slot.snapped_by_display_name,
  ]);

  return (
    <div
      id={`slot-${slot.id}`}
      className={`${
        hasAnimatedIn.current
          ? ""
          : `${styles.slotTileAnimation} ${styles.slotTileVisible}`
      } ${tileClassNames} ${className}`}
      style={
        {
          animationDelay: hasAnimatedIn.current ? "0s" : entranceDelay,
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
    prevProps.slot.canonical_text === nextProps.slot.canonical_text &&
    prevProps.slot.snapped_by_display_name ===
      nextProps.slot.snapped_by_display_name &&
    prevProps.revealDelay === nextProps.revealDelay &&
    prevProps.entranceDelay === nextProps.entranceDelay
  );
});
