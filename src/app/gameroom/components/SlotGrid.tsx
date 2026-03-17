"use client";

import { useAtomValue } from "jotai";
import React from "react";
import { slotsAtom } from "../store/gameAtoms";
import AnswerGrid from "./AnswerGrid";

function SlotGrid() {
  const slots = useAtomValue(slotsAtom);

  return (
    <div>
      <AnswerGrid slots={slots} />
    </div>
  );
}

export default React.memo(SlotGrid);
