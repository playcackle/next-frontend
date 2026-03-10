"use client";

import { useState, useEffect, useCallback } from "react";
import { playersApi, type PlayerProfileStats } from "@/lib/api/players";
import styles from "@/app/page.module.css";

type Props = { userId: string };

type StatItem = {
  label: string;
  value: string;
  accent: "blue" | "pink" | "purple" | "green";
};

function buildStats(p: PlayerProfileStats): StatItem[] {
  return [
    { label: "Total Score", value: p.total_score.toLocaleString(), accent: "pink" },
    { label: "Games Played", value: String(p.games_played), accent: "blue" },
    { label: "Slots Snapped", value: String(p.total_slots_snapped), accent: "purple" },
    {
      label: "Accuracy",
      value: p.overall_accuracy !== null ? `${p.overall_accuracy.toFixed(1)}%` : "—",
      accent: "green",
    },
    {
      label: "Score / Game",
      value: p.average_score_per_game.toFixed(1),
      accent: "blue",
    },
    {
      label: "Slots / Game",
      value: p.average_slots_per_game.toFixed(1),
      accent: "pink",
    },
  ];
}

export default function HomeUserStats({ userId }: Props) {
  const [profile, setProfile] = useState<PlayerProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await playersApi.getProfile(userId);
      setProfile(data);
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
        {Array.from({ length: 6 }).map((_, i) => (
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

  const stats = buildStats(profile);

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
