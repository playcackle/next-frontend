import { useAtomValue } from "jotai";
import React, { useEffect, useState } from "react";
import styles from "./StatsRow.module.css";
import {
  isPostGameShowcaseAtom,
  isRoundBreakAtom,
  playerCountAtom,
  roundExampleAtom,
  roundNameAtom,
  roundNumberAtom,
  timeRemainingAtom,
  totalRoundsAtom,
} from "../store/gameAtoms";
import { formatTime } from "../utils";

interface StatsTileProps {
  tooltip: string;
  children: React.ReactNode;
}

const StatsTileWithTooltip = ({ tooltip, children }: StatsTileProps) => (
  <div className={styles.statsTileWrapper}>
    <div className={styles.statsTile}>{children}</div>
    <div className={styles.statsTileTooltip}>{tooltip}</div>
  </div>
);

const StatsRow = React.memo(() => {
  const playerCount = useAtomValue(playerCountAtom);
  const roundName = useAtomValue(roundNameAtom);
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
    "Don't freeze.",
    "Move it.",
    "Stop thinking.",
    "Try faster.",
    "Panic.",
    "Don't blow it.",
    "Tick-tock! F*uck face.",
    "Figure it out.",
  ];

  const roundMessages: string[] = [
    "Try harder.",
    "Don't mess up.",
    "Prove something.",
    "Impress me… somehow.",
    "Shock me. Please.",
    "Don't flop again.",
    "Keep up.",
    "Don't embarrass yourself.",
    "Let's see you struggle.",
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
          <StatsTileWithTooltip tooltip="The category you need to match this round. Type answers that belong to this group.">
            <h3 className={styles.statsTitle}>Looking for:</h3>
            <div className={styles.statsValue} style={{ fontSize: "14px" }}>
              {roundName}
            </div>
          </StatsTileWithTooltip>
          <StatsTileWithTooltip tooltip="A sample answer that fits the category — use it as a hint for what counts.">
            <h3 className={styles.statsTitle}>Example text:</h3>
            <p className={styles.statsValue} style={{ fontSize: "14px" }}>
              {roundExample || "Answer with items from this category"}
            </p>
          </StatsTileWithTooltip>
        </>
      )}
      <StatsTileWithTooltip
        tooltip={
          isPostGameShowcase
            ? "Time until the next game begins. Stick around."
            : isRoundBreak
              ? "Take a breather. The next round starts shortly."
              : "Time left in this round. Type faster."
        }
      >
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
      </StatsTileWithTooltip>
      <StatsTileWithTooltip tooltip="Which round you're on out of the total rounds in this game.">
        <h3 className={styles.statsTitle}>{roundText}</h3>
        <div className={styles.statsValue}>
          {roundNumber} / {totalRounds}
        </div>
      </StatsTileWithTooltip>
      <StatsTileWithTooltip tooltip="Total number of players currently in the game room.">
        <h3 className={styles.statsTitle}>Dorks in arena:</h3>
        <div className={styles.statsValue}>{playerCount}</div>
      </StatsTileWithTooltip>
    </div>
  );
});

export default StatsRow;
