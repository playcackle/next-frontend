"use client";

import { useAtomValue } from "jotai";
import React, { useState } from "react";
import { slotsAtom } from "../store/gameAtoms";
import AnswerGrid from "./AnswerGrid";
import QuestionGrid from "./QuestionGrid";
import styles from "./SlotGrid.module.css";

type GridMode = "answers" | "questions";

function SlotGrid() {
  const slots = useAtomValue(slotsAtom);
  const [gridMode, setGridMode] = useState<GridMode>("answers");

  return (
    <div className={styles.slotGridWrapper}>
      <div className={styles.gridModeToggle}>
        <button
          className={`${styles.gridModeBtn} ${gridMode === "answers" ? styles.gridModeBtnActive : ""}`}
          onClick={() => setGridMode("answers")}
          aria-pressed={gridMode === "answers"}
        >
          Answers
        </button>
        <button
          className={`${styles.gridModeBtn} ${gridMode === "questions" ? styles.gridModeBtnActive : ""}`}
          onClick={() => setGridMode("questions")}
          aria-pressed={gridMode === "questions"}
        >
          Questions
        </button>
      </div>

      {gridMode === "answers" ? (
        <AnswerGrid slots={slots} />
      ) : (
        <QuestionGrid slots={slots} />
      )}
    </div>
  );
}

const MemoSlotGrid = React.memo(SlotGrid);

export default MemoSlotGrid;
