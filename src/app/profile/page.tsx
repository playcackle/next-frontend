"use client";

import { useUser } from "@/hooks/useUser";
import { useEffect, useState, useCallback } from "react";
import { playersApi, type PlayerProfileStats } from "@/lib/api/players";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

function StatCard({ value, label, accent = "pink" }: { value: string; label: string; accent?: "pink" | "blue" | "gold" }) {
  return (
    <div className={`${styles.statCard} ${styles[`accent_${accent}`]}`}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

function AnalyticRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.analyticRow}>
      <span className={styles.analyticLabel}>{label}</span>
      <span className={styles.analyticValue}>{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [profile, setProfile] = useState<PlayerProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await playersApi.getProfile(user.id);
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user?.id) loadProfile();
  }, [authLoading, user?.id, router, loadProfile]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.stateContainer}>
          <div className={styles.spinner} />
          <p className={styles.stateText}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.container}>
        <div className={styles.stateContainer}>
          <p className={styles.errorHeading}>Failed to load profile</p>
          <p className={styles.stateText}>{error}</p>
          <button className={styles.retryButton} onClick={loadProfile}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getLastSeenText = (lastSeen: string | null) => {
    if (!lastSeen) return "Never";
    const diffMs = Date.now() - new Date(lastSeen).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const hasAnalytics =
    profile.overall_accuracy !== null || profile.rare_claims !== null;

  return (
    <div className={styles.container}>

      {/* Hero header */}
      <div className={styles.hero}>
        <div className={styles.avatar}>
          {(profile.name || "?")[0].toUpperCase()}
        </div>
        <div className={styles.heroMeta}>
          <h1 className={styles.playerName}>{profile.name}</h1>
          <p className={styles.heroSub}>Joined {formatDate(profile.created_at)}</p>
          <span className={styles.lastSeenBadge}>
            Active {getLastSeenText(profile.last_seen_active_at)}
          </span>
        </div>
      </div>

      {/* Primary stats */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Stats</h2>
        <div className={styles.statsGrid}>
          <StatCard value={profile.total_score.toLocaleString()} label="Total Score" accent="pink" />
          <StatCard value={String(profile.games_played)} label="Games Played" accent="blue" />
          <StatCard value={String(profile.rounds_played)} label="Rounds Played" accent="blue" />
          <StatCard value={String(profile.total_slots_snapped)} label="Slots Snapped" accent="gold" />
        </div>
      </section>

      {/* Averages */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Averages</h2>
        <div className={styles.statsGrid}>
          <StatCard value={profile.average_score_per_game.toFixed(1)} label="Score / Game" accent="blue" />
          <StatCard value={profile.average_score_per_round.toFixed(1)} label="Score / Round" accent="blue" />
          <StatCard value={profile.average_slots_per_game.toFixed(1)} label="Slots / Game" accent="gold" />
          <StatCard value={profile.average_slots_per_round.toFixed(1)} label="Slots / Round" accent="gold" />
        </div>
      </section>

      {/* Analytics */}
      {hasAnalytics && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Performance</h2>
          <div className={styles.analyticsPanel}>
            {profile.overall_accuracy !== null && (
              <AnalyticRow label="Accuracy" value={`${profile.overall_accuracy.toFixed(1)}%`} />
            )}
            {profile.average_claim_rank !== null && (
              <AnalyticRow label="Avg Claim Rank" value={`#${profile.average_claim_rank.toFixed(1)}`} />
            )}
            {profile.rare_claims !== null && profile.rare_claims > 0 && (
              <AnalyticRow label="Rare Claims" value={String(profile.rare_claims)} />
            )}
            {profile.near_miss_rate !== null && (
              <AnalyticRow label="Near-Miss Rate" value={`${profile.near_miss_rate.toFixed(1)}%`} />
            )}
            {profile.avg_near_miss_similarity !== null && (
              <AnalyticRow label="Avg Near-Miss Similarity" value={`${profile.avg_near_miss_similarity.toFixed(1)}%`} />
            )}
          </div>
        </section>
      )}

    </div>
  );
}
