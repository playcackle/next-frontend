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

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useGameState } from "../hooks/useGameState";
import type { PlayerAccolades } from "../types/payloads";
import styles from "./postgame.module.css";

// ============ ACCOLADE CONFIGURATION ============

type AccoladeConfig = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const ACCOLADE_CONFIG: Record<string, AccoladeConfig> = {
  speed_demon: {
    icon: Zap,
    title: "Speed Demon",
    description: "Fastest snap of the round",
  },
  first_blood: {
    icon: Swords,
    title: "First Blood",
    description: "First to snap in the round",
  },
  sharpshooter: {
    icon: Crosshair,
    title: "Sharpshooter",
    description: "Perfect accuracy this round",
  },
  perfectionist: {
    icon: BadgeCheck,
    title: "Perfectionist",
    description: "All snaps correct, no wrong guesses",
  },
  machine_gun: {
    icon: Repeat2,
    title: "Machine Gun",
    description: "Most snaps in a short window",
  },
  snapping_spree: {
    icon: Flame,
    title: "Snapping Spree",
    description: "Multiple snaps in quick succession",
  },
  hot_streak: {
    icon: TrendingUp,
    title: "Hot Streak",
    description: "Consistent snapping over time",
  },
  clutch_player: {
    icon: Timer,
    title: "Clutch Player",
    description: "Snapped in the final seconds",
  },
};

// Max accolades to show per player before overflow indicator
const MAX_VISIBLE_ACCOLADES = 5;

// ============ ACCOLADE CHIP COMPONENT ============

type AccoladeChipProps = {
  accoladeType: string;
  count: number;
};

function AccoladeChip({ accoladeType, count }: AccoladeChipProps) {
  const [showPopover, setShowPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const chipRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  const config = ACCOLADE_CONFIG[accoladeType];
  const IconComponent = config?.icon || Award;

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

  if (!config) return null;

  const popoverContent =
    showPopover && isMounted ? (
      <div
        className={styles.accoladePopover}
        style={{ top: popoverPosition.top, left: popoverPosition.left }}
      >
        <div className={styles.accoladePopoverTitle}>{config.title}</div>
        <div className={styles.accoladePopoverDescription}>
          {config.description}
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
      <span className={styles.accoladeCount}>×{count}</span>
      {popoverContent && createPortal(popoverContent, document.body)}
    </div>
  );
}

// ============ MAIN COMPONENT ============

export default function PostGameShowcase() {
  const { scores, playerAccolades } = useGameState();

  // Build lookup map: player_id -> PlayerAccolades
  const playerIdToAccolades = useMemo(() => {
    const map = new Map<string, PlayerAccolades>();
    playerAccolades.forEach((pa) => map.set(pa.player_id, pa));
    return map;
  }, [playerAccolades]);

  // Cast scores to include rank (from FinalScore type)
  const rankedScores = scores as Array<{
    player_id: string;
    display_name: string;
    score: number;
    rank?: number;
  }>;

  return (
    <div className={styles.showcaseContainer}>
      <div className={styles.leaderboardPanel}>
        <h2 className={styles.panelTitle}>Final Standings</h2>
        <div className={styles.entriesContainer}>
          {rankedScores.map((entry, index) => {
            const rank = entry.rank || index + 1;
            const accolades = playerIdToAccolades.get(entry.player_id);
            const accoladeEntries = Object.entries(
              accolades?.accolades_count || {}
            )
              .filter(([, count]) => count > 0)
              .sort(([, a], [, b]) => b - a); // Sort by count descending

            return (
              <div key={entry.player_id} className={styles.entry} data-rank={rank}>
                <div className={styles.rank}>
                  {rank === 1 ? (
                    <Trophy className={styles.trophyIcon} />
                  ) : (
                    `#${rank}`
                  )}
                </div>
                <div className={styles.info}>
                  <span className={styles.username}>{entry.display_name}</span>
                  <div className={styles.accoladesRow}>
                    {accoladeEntries.slice(0, MAX_VISIBLE_ACCOLADES).map(([type, count]) => (
                      <AccoladeChip
                        key={type}
                        accoladeType={type}
                        count={count}
                      />
                    ))}
                    {accoladeEntries.length > MAX_VISIBLE_ACCOLADES && (
                      <span className={styles.accoladeOverflow}>
                        +{accoladeEntries.length - MAX_VISIBLE_ACCOLADES}
                      </span>
                    )}
                  </div>
                  <span className={styles.score}>
                    {entry.score.toLocaleString()} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
