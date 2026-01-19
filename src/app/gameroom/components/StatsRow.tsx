import { useAtomValue } from "jotai";
import React, { useEffect, useState } from "react";
import styles from "../gameroom.module.css";
import {
  isPostGameShowcaseAtom,
  isRoundBreakAtom,
  playerCountAtom,
  roundExampleAtom,
  roundNameAtom,
  roundNumberAtom,
  roundPromptAtom,
  timeRemainingAtom,
  totalRoundsAtom,
} from "../store/gameAtoms";
import { formatTime } from "../utils";

const StatsRow = React.memo(() => {
  // Use atomic selectors for optimal performance
  // Component only re-renders when these specific values change
  const playerCount = useAtomValue(playerCountAtom);
  const roundName = useAtomValue(roundNameAtom);
  const roundPrompt = useAtomValue(roundPromptAtom);
  const roundExample = useAtomValue(roundExampleAtom);
  const roundNumber = useAtomValue(roundNumberAtom);
  const totalRounds = useAtomValue(totalRoundsAtom);
  const isRoundBreak = useAtomValue(isRoundBreakAtom);
  const isPostGameShowcase = useAtomValue(isPostGameShowcaseAtom);
  const timeRemaining = useAtomValue(timeRemainingAtom);

  const [roundText, setRoundText] = useState("Round number");
  const [timeText, setTimeText] = useState("Time remaining");

  const timeRemainingMessages: string[] = [
    "Hurry up.",
    "Don’t freeze.",
    "Move it.",
    "Stop thinking.",
    "Try faster.",
    "Panic.",
    "Don’t blow it.",
    "Tick-tock! F*uck face.",
    "Figure it out.",
  ];

  const roundMessages: string[] = [
    "Try harder.",
    "Don’t mess up.",
    "Prove something.",
    "Impress me… somehow.",
    "Shock me. Please.",
    "Don’t flop again.",
    "Keep up.",
    "Don’t embarrass yourself.",
    "Let’s see you struggle.",
  ];

  useEffect(() => {
    const roundMessage =
      roundMessages[Math.floor(Math.random() * roundMessages.length)];

    setRoundText(roundMessage.replace("X", String(roundNumber)));
    const timeRemaining =
      timeRemainingMessages[
        Math.floor(Math.random() * timeRemainingMessages.length)
      ];
    setTimeText(timeRemaining);
  }, [roundName]);

  return (
    <div className={styles.statsRow}>
      {!isRoundBreak && (
        <>
          <div className={styles.statsTile}>
            <h3 className={styles.statsTitle}>Looking for:</h3>
            <div className={styles.statsValue} style={{ fontSize: "14px" }}>
              {roundName}
            </div>
          </div>
          <div className={styles.statsTile}>
            <h3 className={styles.statsTitle}>Example text:</h3>
            <p className={styles.statsValue} style={{ fontSize: "14px" }}>
              {roundExample || "Answer with items from this category"}
            </p>
          </div>
        </>
      )}
      <div className={styles.statsTile}>
        <h3 className={styles.statsTitle}>
          {isPostGameShowcase
            ? "New game in:"
            : isRoundBreak
            ? "Intermission"
            : timeText}
        </h3>
        <div
          className={`${styles.statsValue} ${
            !isRoundBreak && !isPostGameShowcase && timeRemaining <= 30
              ? styles.timerWarning
              : ""
          }`}
        >
          {formatTime(timeRemaining)}
        </div>
      </div>
      <div className={styles.statsTile}>
        <h3 className={styles.statsTitle}>{roundText}</h3>
        <div className={styles.statsValue}>
          {roundNumber} / {totalRounds}
        </div>
      </div>
      <div className={styles.statsTile}>
        <h3 className={styles.statsTitle}>Dorks in arena:</h3>
        <div className={styles.statsValue}>{playerCount}</div>
      </div>
    </div>
  );
});

export default StatsRow;
