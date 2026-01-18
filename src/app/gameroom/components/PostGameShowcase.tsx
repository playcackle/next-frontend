"use client";

import {
  Award,
  BadgeCheck,
  Crosshair,
  Flame,
  Repeat2,
  Swords,
  Timer,
  TrendingUp,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useGameState } from "../hooks/useGameState";
import type { Accolade } from "../types/state";
import type { PlayerAccolades } from "../types/payloads";
import styles from "./leaderboard.module.css";

const ACCOLADE_ICONS: Record<string, LucideIcon> = {
  speed_demon: Zap,
  first_blood: Swords,
  sharpshooter: Crosshair,
  perfectionist: BadgeCheck,
  machine_gun: Repeat2,
  snapping_spree: Flame,
  hot_streak: TrendingUp,
  clutch_player: Timer,
};

function AccoladeChip({ accolade }: { accolade: Accolade }) {
  const [showPopover, setShowPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const chipRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const IconComponent = ACCOLADE_ICONS[accolade.accolade_type] || Award;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (showPopover && chipRef.current) {
      const rect = chipRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
      });
    }
  }, [showPopover]);

  const popoverContent =
    showPopover && isMounted ? (
      <div
        className={styles.accoladePopover}
        style={{ top: popoverPosition.top, left: popoverPosition.left }}
      >
        <div className={styles.accoladePopoverTitle}>
          <span className={styles.accoladePopoverIcon}></span>
          {accolade.title}
        </div>
        <div className={styles.accoladePopoverDescription}>
          {accolade.description}
        </div>
      </div>
    ) : null;

  return (
    <div
      ref={chipRef}
      className={styles.accoladeChip}
      onMouseEnter={() => setShowPopover(true)}
      onMouseLeave={() => setShowPopover(false)}
    >
      <IconComponent aria-hidden="true" className={styles.accoladeIcon} />
      {popoverContent && createPortal(popoverContent, document.body)}
    </div>
  );
}

function formatAccoladeKey(key: string): string {
  return key.replace(/_/g, " ");
}

function getAccoladeFromKey(type: string): Accolade | null {
  const accoladeMap: Record<string, Accolade> = {
    speed_demon: {
      accolade_type: "speed_demon",
      player_id: "",
      player_display_name: "",
      title: "Speed Demon",
      description: "Fastest snap of the round",
      metric_value: 0,
    },
    first_blood: {
      accolade_type: "first_blood",
      player_id: "",
      player_display_name: "",
      title: "First Blood",
      description: "First to snap in the round",
      metric_value: 0,
    },
    sharpshooter: {
      accolade_type: "sharpshooter",
      player_id: "",
      player_display_name: "",
      title: "Sharpshooter",
      description: "Perfect accuracy this round",
      metric_value: 0,
    },
    perfectionist: {
      accolade_type: "perfectionist",
      player_id: "",
      player_display_name: "",
      title: "Perfectionist",
      description: "All snaps correct, no wrong guesses",
      metric_value: 0,
    },
    machine_gun: {
      accolade_type: "machine_gun",
      player_id: "",
      player_display_name: "",
      title: "Machine Gun",
      description: "Most snaps in a short window",
      metric_value: 0,
    },
    snapping_spree: {
      accolade_type: "snapping_spree",
      player_id: "",
      player_display_name: "",
      title: "Snapping Spree",
      description: "Multiple snaps in quick succession",
      metric_value: 0,
    },
    hot_streak: {
      accolade_type: "hot_streak",
      player_id: "",
      player_display_name: "",
      title: "Hot Streak",
      description: "Consistent snapping over time",
      metric_value: 0,
    },
    clutch_player: {
      accolade_type: "clutch_player",
      player_id: "",
      player_display_name: "",
      title: "Clutch Player",
      description: "Snapped in the final seconds",
      metric_value: 0,
    },
  };
  return accoladeMap[type] || null;
}

export default function PostGameShowcase() {
  const { scores, playerAccolades } = useGameState();

  const playerIdToAccolades = new Map<string, PlayerAccolades>();
  playerAccolades.forEach((pa) => playerIdToAccolades.set(pa.player_id, pa));

  return (
    <div className={styles.leaderboardContainer}>
      <h2 className={styles.title}>Final Standings</h2>
      <div className={styles.entriesContainer}>
        {(scores as Array<{ player_id: string; display_name: string; score: number; rank?: number }>).map(
          (entry, index) => {
            const rank = entry.rank || index + 1;
            const accolades = playerIdToAccolades.get(entry.player_id);
            const accoladeEntries = Object.entries(accolades?.accolades_count || {});

            return (
              <div
                key={entry.player_id}
                className={styles.entry}
                data-rank={rank}
              >
                <div className={styles.rank}>
                  {rank === 1 && <Trophy size={16} className={styles.trophyIcon} />}
                  {rank > 1 && `#${rank}`}
                </div>
                <div className={styles.info}>
                  <div className={styles.usernameRow}>
                    <span className={styles.username}>{entry.display_name}</span>
                    <span className={styles.score}>
                      {entry.score.toLocaleString()} pts
                    </span>
                  </div>
                  {accoladeEntries.length > 0 && (
                    <div className={styles.accoladesRow}>
                      {accoladeEntries.map(([type, count]) => {
                        const accolade = getAccoladeFromKey(type);
                        if (!accolade) return null;
                        return (
                          <AccoladeChip
                            key={type}
                            accolade={{ ...accolade, accolade_type: type }}
                          />
                        );
                      })}
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
