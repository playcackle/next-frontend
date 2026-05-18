"use client";

import {
  AlertCircle,
  Award,
  BadgeCheck,
  Crosshair,
  Flame,
  Sword,
  Target,
  Timer,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { accoladesAtom, scoresAtom } from "../store/gameAtoms";
import type { Accolade } from "../types/state";
import styles from "./leaderboard.module.css";

// Map accolade types to dedicated vector icons for a sharper look
const ACCOLADE_ICONS: Record<string, LucideIcon> = {
  // Speed-based
  speed_demon: Zap,
  first_blood: Sword, // Crosshair for being first on target

  // Accuracy-based
  precision: Target, // Bullseye for precision
  perfectionist: BadgeCheck,

  // Volume-based
  machine_gun: Zap, // Fast = Zap
  snapping_spree: Flame,

  // Streak-based
  hot_streak: TrendingUp,

  // Special achievements
  clutch_player: Timer,
  sniper: Crosshair, // Hunter/target shooter
  close_call: AlertCircle, // Near-miss warning
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

export default function Leaderboard() {
  const scores = useAtomValue(scoresAtom);
  const accolades = useAtomValue(accoladesAtom);

  // Helper to get accolades for a specific player
  const getPlayerAccolades = (playerId: string): Accolade[] => {
    return accolades.filter((acc) => acc.player_id === playerId);
  };

  return (
    <div className={styles.leaderboardContainer}>
      <h2 className={styles.title}>Leaderboard</h2>
      <div className={styles.entriesContainer}>
        {scores.map((entry, index) => {
          const playerAccolades = getPlayerAccolades(entry.player_id);

          return (
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
                {playerAccolades.length > 0 && (
                  <div className={styles.accoladesRow}>
                    {playerAccolades.map((accolade, i) => (
                      <AccoladeChip
                        accolade={accolade}
                        key={accolade.title + i}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
