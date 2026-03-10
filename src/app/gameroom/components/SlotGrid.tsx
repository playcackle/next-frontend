"use client";

import { useAtomValue } from "jotai";
import React, { useState } from "react";
import styles from "../gameroom.module.css";
import { slotsAtom } from "../store/gameAtoms";
import { Slot } from "../types/state";
import AnswerGrid from "./AnswerGrid";
import SlotTile from "./SlotTile";

function SlotGrid() {
  const slots = useAtomValue(slotsAtom);
  const [useGridLayout, setUseGridLayout] = useState(false);

  return (
    <div>
      <div className={styles.layoutToggleRow}>
        <span className={styles.layoutToggleLabel}>LAYOUT</span>
        <button
          type="button"
          className={`${styles.layoutToggleBtn} ${!useGridLayout ? styles.layoutToggleActive : ""}`}
          onClick={() => setUseGridLayout(false)}
          aria-pressed={!useGridLayout}
        >
          TILES
        </button>
        <div
          className={styles.layoutToggleTrack}
          onClick={() => setUseGridLayout((v) => !v)}
          aria-hidden="true"
        >
          <div
            className={`${styles.layoutToggleThumb} ${useGridLayout ? styles.layoutToggleThumbOn : ""}`}
          />
        </div>
        <button
          type="button"
          className={`${styles.layoutToggleBtn} ${useGridLayout ? styles.layoutToggleActive : ""}`}
          onClick={() => setUseGridLayout(true)}
          aria-pressed={useGridLayout}
        >
          GRID
        </button>
      </div>
      {useGridLayout ? (
        <AnswerGrid slots={slots} />
      ) : (
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
      )}
    </div>
  );
}

export default React.memo(SlotGrid);
