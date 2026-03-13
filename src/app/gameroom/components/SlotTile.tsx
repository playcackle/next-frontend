"use client";

import { useUser } from "@/hooks/useUser";
import { useAtomValue } from "jotai";
import React, { useMemo, useRef } from "react";
import styles from "./SlotTile.module.css";
import { animationStateAtom } from "../store/gameAtoms";
import { Slot } from "../types/state";

interface SlotTileProps {
  slot: Slot;
  isBonus?: boolean;
  revealDelay: number;
  entranceDelay: string;
  className: string;
}

const SlotTile: React.FC<SlotTileProps> = ({ slot, className }) => {
  const { user } = useUser();
  const animationState = useAtomValue(animationStateAtom);

  const hasAnimated = useRef(false);
  const lastAnimatedSlotId = useRef<string | null>(null);

  const shouldPulse = useMemo(() => {
    const isCurrentlyAnimating = slot.id === animationState.slotId;

    // If this is a new animation for this slot
    if (isCurrentlyAnimating && lastAnimatedSlotId.current !== slot.id) {
      lastAnimatedSlotId.current = slot.id;
      hasAnimated.current = true;
      return true;
    }

    // If animation state cleared (slotId becomes null), reset for this slot
    if (animationState.slotId === null && hasAnimated.current) {
      hasAnimated.current = false;
      lastAnimatedSlotId.current = null;
    }

    return false;
  }, [slot.id, animationState.slotId]);

  const displayState = useMemo(() => {
    const shouldShowContent = slot.is_snapped;
    const shouldShowAttention =
      slot.is_snapped && slot.snapped_by_player_id === user?.id;

    return {
      shouldShowContent,
      shouldShowAttention,
      slotColor: slot.is_snapped ? "var(--neon-purple)" : "var(--neon-pink)",
    };
  }, [slot.is_snapped, slot.snapped_by_player_id, user?.id]);

  const tileClassNames = useMemo(
    () =>
      [
        styles.slotTile,
        slot.is_rare ? styles.bonusTile : "",
        slot.is_snapped ? styles.answered : "",
        shouldPulse ? styles.correctPulse : "",
        displayState.shouldShowAttention && shouldPulse
          ? animationState.attentionAnimation
          : "",
      ].join(" "),
    [
      slot.is_snapped,
      slot.is_rare,
      shouldPulse,
      animationState.attentionAnimation,
      displayState.shouldShowAttention,
    ],
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
    return (
      <div className={styles.questionMark}>
        {slot.is_rare ? "2x" : slot.points_awarded || slot.points}
      </div>
    );
  }, [
    displayState.shouldShowContent,
    slot.canonical_text,
    slot.snapped_by_display_name,
  ]);

  return (
    <div
      id={`slot-${slot.id}`}
      className={`${tileClassNames} ${className}`}
      style={
        {
          "--room-color": displayState.slotColor,
        } as React.CSSProperties
      }
    >
      {content}
    </div>
  );
};

export default React.memo(SlotTile, (prevProps, nextProps) => {
  return (
    prevProps.slot.id === nextProps.slot.id &&
    prevProps.slot.is_snapped === nextProps.slot.is_snapped &&
    prevProps.slot.is_rare === nextProps.slot.is_rare &&
    prevProps.slot.canonical_text === nextProps.slot.canonical_text &&
    prevProps.slot.snapped_by_display_name ===
      nextProps.slot.snapped_by_display_name &&
    prevProps.revealDelay === nextProps.revealDelay &&
    prevProps.entranceDelay === nextProps.entranceDelay
  );
});
