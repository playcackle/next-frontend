"use client";

// NOTE: This component is currently NOT IMPORTED anywhere in the UI.
// It was intended to display BotBob hints but was superseded by AnswerGrid.tsx hints section.
// Keeping file for future use case or removal after verification.
// If you need to debug hint filtering, use AnswerGrid.tsx instead.

import { useAtomValue } from "jotai";
import PlayerAvatar from "./PlayerAvatar";
import styles from "./HintPanel.module.css";
import { isRoundBreakAtom, roundHintsAtom, slotsAtom } from "../store/gameAtoms";

export default function HintPanel() {
  const hints = useAtomValue(roundHintsAtom);
  const slots = useAtomValue(slotsAtom);
  const isRoundBreak = useAtomValue(isRoundBreakAtom);

  if (isRoundBreak) return null;

  const snappedSlotIds = new Set(
    slots
      .filter((s) => s.is_snapped && s.id)
      .map((s) => String(s.id))
  );

  const visibleHints = hints.filter((h) => {
    return !h.slot_id || !snappedSlotIds.has(String(h.slot_id));
  });

  return (
    <div className={styles.hintPanel}>
      <div className={styles.hintPanelHeader}>
        <PlayerAvatar playerId="botbob" displayName="BotBob" size="small" />
        <span className={styles.hintPanelTitle}>BOT BOB</span>
      </div>
      <div className={styles.hintList}>
        {visibleHints.length === 0 ? (
          <div className={styles.hintEmpty}>Give it a minute. This is painful to watch.</div>
        ) : (
          visibleHints.map((hint, index) => (
            <div key={index} className={styles.hintItem}>
              {hint.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
