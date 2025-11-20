import React from "react";
import styles from "../gameroom.module.css";
import { useGameState } from "../hooks/useGameState";
import { Slot } from "../types/state";
import SlotTile from "./SlotTile";

function SlotGrid() {
  const { slots } = useGameState();

  return (
    <div className={styles.slotGrid}>
      {slots.map((slot: Slot, i: number) => (
        <SlotTile
          key={slot.id || i}
          slot={slot}
          entranceDelay={`${i * 80}ms`}
          revealDelay={i * 100 - (i > 0 ? 88 : 0)}
          className=""
        />
      ))}
    </div>
  );
}

export default React.memo(SlotGrid);
