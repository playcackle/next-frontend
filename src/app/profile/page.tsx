"use client";

import { useUser } from "@/hooks/useUser";
import { useEffect, useState, useCallback } from "react";
import { playersApi, type PlayerProfileStats } from "@/lib/api/players";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function ProfilePage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [profile, setProfile] = useState<PlayerProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user?.id) {
      console.log("loadProfile: No user ID");
      return;
    }

    console.log("loadProfile: Starting for user", user.id);

    try {
      setLoading(true);
      setError(null);
      const data = await playersApi.getProfile(user.id);
      console.log("loadProfile: Received data", data);
      setProfile(data);
    } catch (err) {
      console.error("Failed to load profile:", err);
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

    if (user?.id) {
      loadProfile();
    }
  }, [authLoading, user?.id, router, loadProfile]);

  console.log("Profile page render:", { loading, error, hasProfile: !!profile });

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h3>Failed to load profile</h3>
          <p>{error}</p>
          <button className={styles.retryButton} onClick={loadProfile}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getLastSeenText = (lastSeen: string | null) => {
    if (!lastSeen) return "Never";
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.neonText}>{profile.name}</span>
        </h1>
        <p className={styles.subtitle}>
          Joined {formatDate(profile.created_at)}
        </p>
        <p className={styles.lastSeen}>
          Last active: {getLastSeenText(profile.last_seen_active_at)}
        </p>
      </div>

      <div className={styles.statsGrid}>
        {/* Total Score Card */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🏆</div>
          <div className={styles.statValue}>{profile.total_score.toLocaleString()}</div>
          <div className={styles.statLabel}>Total Score</div>
        </div>

        {/* Games Played Card */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🎮</div>
          <div className={styles.statValue}>{profile.games_played}</div>
          <div className={styles.statLabel}>Games Played</div>
        </div>

        {/* Rounds Played Card */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🔄</div>
          <div className={styles.statValue}>{profile.rounds_played}</div>
          <div className={styles.statLabel}>Rounds Played</div>
        </div>

        {/* Total Slots Snapped Card */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>⚡</div>
          <div className={styles.statValue}>{profile.total_slots_snapped}</div>
          <div className={styles.statLabel}>Slots Snapped</div>
        </div>
      </div>

      <div className={styles.averagesSection}>
        <h2 className={styles.sectionTitle}>Averages</h2>
        <div className={styles.averagesGrid}>
          <div className={styles.averageCard}>
            <div className={styles.averageValue}>
              {profile.average_score_per_game.toFixed(1)}
            </div>
            <div className={styles.averageLabel}>Score per Game</div>
          </div>

          <div className={styles.averageCard}>
            <div className={styles.averageValue}>
              {profile.average_score_per_round.toFixed(1)}
            </div>
            <div className={styles.averageLabel}>Score per Round</div>
          </div>

          <div className={styles.averageCard}>
            <div className={styles.averageValue}>
              {profile.average_slots_per_game.toFixed(1)}
            </div>
            <div className={styles.averageLabel}>Slots per Game</div>
          </div>

          <div className={styles.averageCard}>
            <div className={styles.averageValue}>
              {profile.average_slots_per_round.toFixed(1)}
            </div>
            <div className={styles.averageLabel}>Slots per Round</div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      {(profile.overall_accuracy !== null || profile.rare_claims !== null) && (
        <div className={styles.analyticsSection}>
          <h2 className={styles.sectionTitle}>Performance Analytics</h2>
          <div className={styles.analyticsGrid}>
            {profile.overall_accuracy !== null && (
              <div className={styles.analyticsCard}>
                <div className={styles.analyticsIcon}>🎯</div>
                <div className={styles.analyticsValue}>
                  {profile.overall_accuracy.toFixed(1)}%
                </div>
                <div className={styles.analyticsLabel}>Accuracy</div>
              </div>
            )}

            {profile.average_claim_rank !== null && (
              <div className={styles.analyticsCard}>
                <div className={styles.analyticsIcon}>🏅</div>
                <div className={styles.analyticsValue}>
                  #{profile.average_claim_rank.toFixed(1)}
                </div>
                <div className={styles.analyticsLabel}>Avg Claim Rank</div>
              </div>
            )}

            {profile.rare_claims !== null && profile.rare_claims > 0 && (
              <div className={styles.analyticsCard}>
                <div className={styles.analyticsIcon}>💎</div>
                <div className={styles.analyticsValue}>{profile.rare_claims}</div>
                <div className={styles.analyticsLabel}>Rare Claims</div>
              </div>
            )}

            {profile.near_miss_rate !== null && (
              <div className={styles.analyticsCard}>
                <div className={styles.analyticsIcon}>📊</div>
                <div className={styles.analyticsValue}>
                  {profile.near_miss_rate.toFixed(1)}%
                </div>
                <div className={styles.analyticsLabel}>Near-Miss Rate</div>
              </div>
            )}

            {profile.avg_near_miss_similarity !== null && (
              <div className={styles.analyticsCard}>
                <div className={styles.analyticsIcon}>🔍</div>
                <div className={styles.analyticsValue}>
                  {profile.avg_near_miss_similarity.toFixed(1)}%
                </div>
                <div className={styles.analyticsLabel}>Avg Near-Miss Similarity</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
