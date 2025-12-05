import { useAtomValue } from "jotai";
import React from "react";
import styles from "../gameroom.module.css";
import { slotsAtom } from "../store/gameAtoms";
import { Slot } from "../types/state";
import SlotTile from "./SlotTile";

function SlotGrid() {
  // Use atomic selector for optimal performance
  const slots = useAtomValue(slotsAtom);

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
