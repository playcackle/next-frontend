"use client";

import {
  Award,
  BadgeCheck,
  Crosshair,
  Flame,
  LucideIcon,
  Repeat2,
  Swords,
  Timer,
  TrendingUp,
  Zap,
} from "lucide-react";

import { useAtomValue } from "jotai";
import React, { useCallback, useMemo, useState } from "react";
import { accoladesAtom, scoresAtom } from "../store/gameAtoms";
import { Accolade, Scores } from "../types/state";
import styles from "./leaderboard.module.css";

// Map accolade types to dedicated vector icons for a sharper look
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

const AccoladeChip = React.memo(
  ({ accolade }: { accolade: Accolade }) => {
    const [showPopover, setShowPopover] = useState(false);
    const IconComponent = useMemo(
      () => ACCOLADE_ICONS[accolade.accolade_type] || Award,
      [accolade.accolade_type]
    );

    const handleMouseEnter = useCallback(() => setShowPopover(true), []);
    const handleMouseLeave = useCallback(() => setShowPopover(false), []);

    return (
      <div
        className={styles.accoladeChip}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <IconComponent aria-hidden="true" className={styles.accoladeIcon} />
        {showPopover && (
          <div className={styles.accoladePopover}>
            <div className={styles.accoladePopoverTitle}>
              <span className={styles.accoladePopoverIcon}></span>
              {accolade.title}
            </div>
            <div className={styles.accoladePopoverDescription}>
              {accolade.description}
            </div>
          </div>
        )}
      </div>
    );
  },
  (prev, next) =>
    prev.accolade.accolade_type === next.accolade.accolade_type &&
    prev.accolade.title === next.accolade.title
);

// Memoized entry component to prevent unnecessary re-renders
const LeaderboardEntry = React.memo(
  ({
    entry,
    index,
    accolades,
  }: {
    entry: Scores;
    index: number;
    accolades: Accolade[];
  }) => {
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
          {accolades.length > 0 && (
            <div className={styles.accoladesRow}>
              {accolades.map((accolade, i) => (
                <AccoladeChip accolade={accolade} key={accolade.title + i} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  },
  (prev, next) =>
    prev.entry.score === next.entry.score &&
    prev.entry.player_id === next.entry.player_id &&
    prev.entry.display_name === next.entry.display_name &&
    prev.index === next.index &&
    prev.accolades.length === next.accolades.length
);

const Leaderboard = React.memo(() => {
  // Use atomic selectors for optimal performance
  const scores = useAtomValue(scoresAtom);
  const accolades = useAtomValue(accoladesAtom);

  // Memoize the accolade map to avoid O(n×m) filtering on every render
  // This creates the map once and only recalculates when accolades change
  const accoladesByPlayer = useMemo(() => {
    const map = new Map<string, Accolade[]>();
    accolades.forEach((acc) => {
      const existing = map.get(acc.player_id) || [];
      map.set(acc.player_id, [...existing, acc]);
    });
    return map;
  }, [accolades]);

  return (
    <div className={styles.leaderboardContainer}>
      <h2 className={styles.title}>Leaderboard</h2>
      <div className={styles.entriesContainer}>
        {scores.map((entry, index) => (
          <LeaderboardEntry
            key={entry.player_id}
            entry={entry}
            index={index}
            accolades={accoladesByPlayer.get(entry.player_id) || []}
          />
        ))}
      </div>
    </div>
  );
});

export default Leaderboard;
