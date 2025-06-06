import styles from "../gameroom.module.css";
import { useGameState } from "../hooks/useGameState";
import { formatTime } from "../utils";

interface StatsRowProps {
  nameFlash?: boolean;
}

export default function StatsRow({ nameFlash }: StatsRowProps) {
  const { playerCount, isRoundBreak, timeRemaining, scores } = useGameState();

  return (
    <div className={styles.statsRow}>
      <div className={styles.statsTile}>
        <h3 className={styles.statsTitle}>
          {isRoundBreak ? "Intermission" : "Time Remaining"}
        </h3>
        <div
          className={`${styles.statsValue} ${
            !isRoundBreak && timeRemaining <= 30 ? styles.timerWarning : ""
          }`}
        >
          {formatTime(timeRemaining)}
        </div>
        <div className={styles.playersCount}>{playerCount} Players</div>
      </div>
      {!isRoundBreak && (
        <div className={styles.leaderboardTile}>
          <h3 className={styles.statsTitle}>Leaderboard</h3>
          <div className={styles.horizontalLeaderboard}>
            {scores.slice(0, 10).map((player, index) => (
              <div
                key={player.player_id}
                className={`${styles.leaderboardPlayer} ${
                  player.display_name === "You" && nameFlash
                    ? styles.nameFlash
                    : ""
                }`}
              >
                <div className={styles.playerRank}>{index + 1}</div>
                <div className={styles.playerInfo}>
                  <div className={styles.playerName}>{player.display_name}</div>
                  <div className={styles.playerScore}>{player.score}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
