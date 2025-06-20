"use client";

import { useGameState } from "../hooks/useGameState";
import styles from "./leaderboard.module.css";

export default function Leaderboard() {
  const { scores } = useGameState();
  return (
    <div className={styles.leaderboardTableContainer}>
      <table className={styles.leaderboardTable}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((x, i) => (
            <tr key={x.player_id} className={i === 0 ? styles.topRank : ""}>
              <td>
                <span className={styles.rankBadge}>{i + 1}</span>
              </td>
              <td>{x.display_name}</td>
              <td className={styles.scoreCell}>{x.score.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
