import React from "react";
import styles from "../gameroom.module.css";
import type { Player } from "../types";
import { formatTime } from "../utils";

interface StatsRowProps {
  activePlayers: number;
  isIntermission: boolean;
  timeRemaining: number;
  intermissionTimeRemaining: number;
  players: Player[];
  nameFlash: boolean;
}

const StatsRow: React.FC<StatsRowProps> = ({
  activePlayers,
  isIntermission,
  timeRemaining,
  intermissionTimeRemaining,
  players,
  nameFlash,
}) => {
  return (
    <div className={styles.statsRow}>
      <div className={styles.statsTile}>
        <h3 className={styles.statsTitle}>Active Players</h3>
        <div className={styles.statsValue}>{activePlayers}</div>
      </div>

      <div className={styles.statsTile}>
        <h3 className={styles.statsTitle}>
          {isIntermission ? "Intermission" : "Time Remaining"}
        </h3>
        <div
          className={`${styles.statsValue} ${
            !isIntermission && timeRemaining <= 30 ? styles.timerWarning : ""
          }`}
        >
          {isIntermission
            ? formatTime(intermissionTimeRemaining)
            : formatTime(timeRemaining)}
        </div>
      </div>

      <div className={styles.statsTile}>
        <h3 className={styles.statsTitle}>Leaderboard</h3>
        <div className={styles.miniLeaderboard}>
          {players.slice(0, 5).map((player, index) => (
            <div
              key={player.id}
              className={`${styles.leaderboardItem} ${
                player.name === "You" && nameFlash ? styles.nameFlash : ""
              }`}
            >
              <div className={styles.playerRank}>{index + 1}</div>
              <div
                className={styles.playerAvatar}
                style={{ background: player.color }}
              >
                {player.avatar}
              </div>
              <div className={styles.playerName}>{player.name}</div>
              <div className={styles.playerScore}>{player.score}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(StatsRow);
