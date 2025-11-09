import { useEffect, useState } from "react";
import styles from "../gameroom.module.css";
import { useGameState } from "../hooks/useGameState";
import { Slot } from "../types/state";
import SlotTile from "./SlotTile";

export default function SlotGrid() {
  const { slots } = useGameState();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={styles.slotGrid}>
      {slots.map((slot: Slot, i: number) => (
        <SlotTile
          key={slot.id || i}
          slot={slot}
          entranceDelay={`${i * 80}ms`}
          revealDelay={i * 100 - (i > 0 ? 88 : 0)}
          className={`${styles.slotTileVisible} ${
            mounted ? styles.slotTileAnimation : ""
          }`}
        />
      ))}
    </div>
  );
}
