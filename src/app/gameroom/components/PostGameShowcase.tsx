"use client";

import { Trophy } from "lucide-react";
import { useGameState } from "../hooks/useGameState";
import type { PlayerAccolades } from "../types/payloads";
import styles from "./leaderboard.module.css";

const ACCOLADE_ICONS: Record<string, string> = {
  speed_demon: "⚡",
  first_blood: "🗡️",
  sharpshooter: "🎯",
  perfectionist: "✨",
  machine_gun: "🔄",
  snapping_spree: "🔥",
  hot_streak: "📈",
  clutch_player: "⏰",
};

function AccoladeBadge({ type, count }: { type: string; count: number }) {
  const icon = ACCOLADE_ICONS[type] || "🏆";
  const label = type.replace(/_/g, " ");

  return (
    <span className={styles.accoladeChip} title={label}>
      <span className={styles.accoladeIcon}>{icon}</span>
      <span className={styles.accoladeCount}>{count}</span>
    </span>
  );
}

export default function PostGameShowcase() {
  const { scores, playerAccolades } = useGameState();

  const playerIdToAccolades = new Map<string, PlayerAccolades>();
  playerAccolades.forEach((pa) => playerIdToAccolades.set(pa.player_id, pa));

  return (
    <div className={styles.leaderboardContainer}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Game Complete!</h2>
      </div>
      <div className={styles.entriesContainer}>
        {(scores as Array<{ player_id: string; display_name: string; score: number; rank?: number }>).map(
          (entry, index) => {
            const rank = entry.rank || index + 1;
            const accolades = playerIdToAccolades.get(entry.player_id);

            return (
              <div
                key={entry.player_id}
                className={styles.entry}
                data-rank={rank}
              >
                <div className={styles.rank}>
                  {rank === 1 && <Trophy size={16} className={styles.trophyIcon} />}
                  {rank > 1 && ` #${rank}`}
                </div>
                <div className={styles.info}>
                  <div className={styles.usernameRow}>
                    <span className={styles.username}>{entry.display_name}</span>
                    <span className={styles.score}>
                      {entry.score.toLocaleString()} pts
                    </span>
                  </div>
                  {accolades && Object.keys(accolades.accolades_count || {}).length > 0 && (
                    <div className={styles.accoladesRow}>
                      {Object.entries(accolades.accolades_count).map(([type, count]) => (
                        <AccoladeBadge key={type} type={type} count={count as number} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}
