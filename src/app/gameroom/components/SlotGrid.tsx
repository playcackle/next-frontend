"use client";

import React from "react";
import styles from "../gameroom.module.css";
import type { Slot } from "../types";
import { default as SlotTile } from "./SlotTile";

interface SlotGridProps {
  slots: Slot[];
  bonusSlots: Slot[];
  animatingTile: number | null;
  timeExpired: boolean;
  isIntermission: boolean;
}

const SlotGrid: React.FC<SlotGridProps> = ({
  slots,
  bonusSlots,
  animatingTile,
  timeExpired,
  isIntermission,
}) => {
  return (
    <div
      className={styles.slotContainer}
      style={{ "--room-color": "var(--neon-pink)" } as React.CSSProperties}
    >
      <div className={styles.slotGrid}>
        {slots.map((slot) => (
          <SlotTile
            key={slot.id}
            slot={slot}
            isAnimating={animatingTile === slot.id}
            timeExpired={timeExpired}
            isIntermission={isIntermission}
          />
        ))}
        {bonusSlots.map((bonus) => (
          <SlotTile
            key={bonus.id}
            slot={bonus}
            isAnimating={animatingTile === bonus.id}
            timeExpired={timeExpired}
            isIntermission={isIntermission}
            isBonus={true}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(SlotGrid);
