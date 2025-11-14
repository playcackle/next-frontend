"use client";

import { useGameState } from "../hooks/useGameState";
import styles from "./leaderboard.module.css";

export default function Leaderboard() {
  const { scores } = useGameState();
  return (
    <div className={styles.leaderboardContainer}>
      <h2 className={styles.title}>Leaderboard</h2>
      <div className={styles.entriesContainer}>
        {scores.map((entry, index) => (
          <div
            key={entry.player_id}
            className={styles.entry}
            data-rank={index + 1}
          >
            <div className={styles.rank}>#{index + 1}</div>
            <div className={styles.info}>
              <div className={styles.usernameRow}>
                <span className={styles.username}>{entry.display_name}</span>
                <span className={styles.score}>
                  {entry.score.toLocaleString()} pts
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
