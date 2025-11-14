import { useEffect, useState } from "react";
import styles from "../gameroom.module.css";
import { useGameState } from "../hooks/useGameState";
import { formatTime } from "../utils";

interface StatsRowProps {
  nameFlash?: boolean;
}

export default function StatsRow({ nameFlash }: StatsRowProps) {
  const {
    playerCount,
    roundName,
    roundNumber,
    totalRounds,
    isRoundBreak,
    timeRemaining,
  } = useGameState();

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
            <p className={styles.statsTitle}>Example: (example value)</p>
          </div>
          <div className={styles.statsTile}>
            <h3 className={styles.statsTitle}>Explaination text:</h3>
            <p className={styles.statsValue} style={{ fontSize: "14px" }}>
              We are looking for the stuff that is correct
            </p>
          </div>
        </>
      )}
      <div className={styles.statsTile}>
        <h3 className={styles.statsTitle}>
          {isRoundBreak ? "Intermission" : timeText}
        </h3>
        <div
          className={`${styles.statsValue} ${
            !isRoundBreak && timeRemaining <= 30 ? styles.timerWarning : ""
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
}
