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
    scores,
  } = useGameState();

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
          {isRoundBreak ? "Intermission" : "Time Remaining:"}
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
        <h3 className={styles.statsTitle}>Round number:</h3>
        <div className={styles.statsValue}>
          {roundNumber} / {totalRounds}
        </div>
      </div>
      <div className={styles.statsTile}>
        <h3 className={styles.statsTitle}>Active players:</h3>
        <div className={styles.statsValue}>{playerCount}</div>
      </div>
    </div>
  );
}
