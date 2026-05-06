"use client";

import { useState, useEffect, useCallback } from "react";
import {
  playersApi,
  type PlayerPlaystyleProfile,
  type PlayerProfileStats,
} from "@/lib/api/players";
import styles from "./home-user-stats.module.css";

type Props = { userId: string };

type StatItem = {
  label: string;
  value: string;
  accent: "blue" | "pink" | "purple" | "green";
};

const EMPTY_PLAYSTYLE: PlayerPlaystyleProfile = {
  archetype: "All-Round Operator",
  summary: "Play more games to shape your playstyle.",
  dimensions: [],
  top_traits: [],
  total_accolades: 0,
};

function buildStats(
  p: PlayerProfileStats,
  playstyle: PlayerPlaystyleProfile,
): StatItem[] {
  return [
    { label: "Total Score", value: p.total_score.toLocaleString(), accent: "pink" },
    { label: "Games Played", value: String(p.games_played), accent: "blue" },
    {
      label: "Accuracy",
      value: p.overall_accuracy !== null ? `${p.overall_accuracy.toFixed(1)}%` : "—",
      accent: "green",
    },
    {
      label: "Total Accolades",
      value: String(playstyle.total_accolades),
      accent: "purple",
    },
  ];
}

export default function HomeUserStats({ userId }: Props) {
  const [profile, setProfile] = useState<PlayerProfileStats | null>(null);
  const [playstyle, setPlaystyle] = useState<PlayerPlaystyleProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileData, playstyleData] = await Promise.all([
        playersApi.getProfile(userId),
        playersApi.getPlaystyle(userId),
      ]);
      setProfile(profileData);
      setPlaystyle(playstyleData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className={styles.statsLoadingRow}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.statsSkeletonCard} />
        ))}
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.statsError}>
        <p>Could not load your stats.</p>
        <button className={styles.retryBtn} onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  const resolvedPlaystyle = playstyle ?? EMPTY_PLAYSTYLE;
  const stats = buildStats(profile, resolvedPlaystyle);

  return (
    <div className={styles.statsGrid}>
      {stats.map((s) => (
        <div key={s.label} className={`${styles.statCard} ${styles[`statCard_${s.accent}`]}`}>
          <div className={`${styles.statValue} ${styles[`statValue_${s.accent}`]}`}>
            {s.value}
          </div>
          <div className={styles.statLabel}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}
