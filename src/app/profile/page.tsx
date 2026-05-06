"use client";

import { useUser } from "@/hooks/useUser";
import { useEffect, useState, useCallback } from "react";
import {
  playersApi,
  type PlayerAccoladeStats,
  type PlayerCategoryStatsResponse,
  type PlayerPlaystyleProfile,
  type PlayerProfileStats,
  type PlayerComparisonsResponse,
} from "@/lib/api/players";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./page.module.css";
import { EMPTY_PLAYSTYLE_PROFILE } from "./playstyle";

function StatCard({ value, label, comparison, accent = "pink" }: { value: string; label: string; comparison?: string | null; accent?: "pink" | "blue" | "gold" }) {
  return (
    <div className={`${styles.statCard} ${styles[`accent_${accent}`]}`}>
      <div className={styles.statValue}>{value}</div>
      {comparison ? <div className={styles.statComparison}>{comparison}</div> : null}
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

function SpotlightCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={styles.spotlightCard}>
      <div className={styles.spotlightLabel}>{label}</div>
      <div className={styles.spotlightValue}>{value}</div>
      {hint ? <div className={styles.spotlightHint}>{hint}</div> : null}
    </div>
  );
}

function AccoladeChip({ label, count }: { label: string; count: number }) {
  return (
    <div className={styles.accoladeStatChip}>
      <span className={styles.accoladeStatLabel}>{label}</span>
      <span className={styles.accoladeStatCount}>×{count}</span>
    </div>
  );
}

function CategoryBar({
  name,
  accuracy,
  rounds,
  averageScore,
}: {
  name: string;
  accuracy: number | null;
  rounds: number;
  averageScore: number | null;
}) {
  const maxBarWidth = 100;
  const barFill = accuracy !== null ? Math.min(accuracy, maxBarWidth) : 0;

  return (
    <div className={styles.categoryBar}>
      <div className={styles.categoryBarHeader}>
        <span className={styles.categoryBarName}>{name}</span>
        <span className={styles.categoryBarStats}>
          {rounds} rounds · avg {typeof averageScore === "number" ? averageScore.toFixed(0) : "—"} pts
        </span>
      </div>
      <div className={styles.categoryBarTrack}>
        <div
          className={styles.categoryBarFill}
          style={{ width: `${barFill}%` }}
        />
        <span className={styles.categoryBarLabel}>
          {accuracy !== null ? `${accuracy.toFixed(0)}%` : "—"}
        </span>
      </div>
    </div>
  );
}

function PlaystyleRadar({
  dimensions,
}: {
  dimensions: Array<{ key: string; label: string; normalized: number; raw: number }>;
}) {
  const width = 340;
  const height = 300;
  const centerX = width / 2;
  const centerY = 136;
  const radius = 116;
  const labelRadius = 132;
  const levels = 4;

  const getPoint = (index: number, value: number, customRadius?: number) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / dimensions.length;
    const distance = customRadius ?? (value / 100) * radius;
    return {
      x: centerX + Math.cos(angle) * distance,
      y: centerY + Math.sin(angle) * distance,
    };
  };

  const polygonPoints = dimensions
    .map((dimension, index) => {
      const point = getPoint(index, dimension.normalized);
      return `${point.x},${point.y}`;
    })
    .join(" ");

  return (
    <div className={styles.radarWrap}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={styles.radarChart}
        role="img"
        aria-label="Playstyle radar chart"
      >
        {Array.from({ length: levels }).map((_, levelIndex) => {
          const levelValue = ((levelIndex + 1) / levels) * 100;
          const ringPoints = dimensions
            .map((_, index) => {
              const point = getPoint(index, levelValue);
              return `${point.x},${point.y}`;
            })
            .join(" ");

          return (
            <polygon
              key={levelValue}
              points={ringPoints}
              className={styles.radarRing}
            />
          );
        })}

        {dimensions.map((dimension, index) => {
          const outer = getPoint(index, 100);
          return (
            <line
              key={dimension.key}
              x1={centerX}
              y1={centerY}
              x2={outer.x}
              y2={outer.y}
              className={styles.radarAxis}
            />
          );
        })}

        <polygon points={polygonPoints} className={styles.radarArea} />

        {dimensions.map((dimension, index) => {
          const point = getPoint(index, dimension.normalized);
          return (
            <circle
              key={dimension.key}
              cx={point.x}
              cy={point.y}
              r="4"
              className={styles.radarDot}
            />
          );
        })}

        {dimensions.map((dimension, index) => {
          const labelPoint = getPoint(index, 100, labelRadius);
          const isLeft = labelPoint.x < centerX - 12;
          const isRight = labelPoint.x > centerX + 12;
          const anchor = isLeft ? "end" : isRight ? "start" : "middle";

          return (
            <text
              key={`${dimension.key}-label`}
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor={anchor}
              dominantBaseline="middle"
              className={styles.radarLabel}
            >
              {dimension.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [profile, setProfile] = useState<PlayerProfileStats | null>(null);
  const [playstyle, setPlaystyle] = useState<PlayerPlaystyleProfile | null>(null);
  const [accoladeStats, setAccoladeStats] = useState<PlayerAccoladeStats | null>(null);
  const [categoryStats, setCategoryStats] = useState<PlayerCategoryStatsResponse | null>(null);
  const [comparisons, setComparisons] = useState<PlayerComparisonsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError(null);
      const profileData = await playersApi.getProfile(user.id);
      setProfile(profileData);

      const [playstyleResult, accoladeStatsResult, categoryStatsResult, comparisonsResult] = await Promise.allSettled([
        playersApi.getPlaystyle(user.id),
        playersApi.getAccoladeStats(user.id),
        playersApi.getCategoryStats(user.id),
        playersApi.getComparisons(user.id),
      ]);

      setPlaystyle(playstyleResult.status === "fulfilled" ? playstyleResult.value : null);
      setAccoladeStats(accoladeStatsResult.status === "fulfilled" ? accoladeStatsResult.value : null);
      setCategoryStats(categoryStatsResult.status === "fulfilled" ? categoryStatsResult.value : null);
      setComparisons(comparisonsResult.status === "fulfilled" ? comparisonsResult.value : null);
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

  const resolvedPlaystyle: PlayerPlaystyleProfile =
    playstyle ?? EMPTY_PLAYSTYLE_PROFILE;

  const topAccolades = (accoladeStats?.accolades_by_type ?? []).slice(0, 3);
  const topCategories = (categoryStats?.categories ?? []).slice(0, 5);

  return (
    <div className={styles.container}>

      {/* Player profile card */}
      <section className={styles.profileCard}>
        <div className={styles.profileCardHeader}>
          <h1 className={styles.playerName}>{profile.name}</h1>
          <p className={styles.heroSub}>Joined {formatDate(profile.created_at)}</p>
        </div>

        <div className={styles.profileCardBody}>
          <div className={styles.profileInfoColumn}>
            <div className={styles.profileIdentity}>
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={`${profile.name}'s avatar`}
                  width={72}
                  height={72}
                  className={styles.avatar}
                />
              ) : (
                <div className={styles.avatar}>
                  {(profile.name || "?")[0].toUpperCase()}
                </div>
              )}
              <div className={styles.heroMeta}>
                <div className={styles.playstyleIdentityBlock}>
                  <h2 className={styles.playstyleTitle}>{resolvedPlaystyle.archetype}</h2>
                  <p className={styles.playstyleSummary}>{resolvedPlaystyle.summary}</p>
                </div>
                <div className={styles.heroCategoryMiniGrid}>
                  <div className={styles.heroCategoryMiniCard}>
                    <div className={styles.heroCategoryMiniLabel}>Most Played</div>
                    <div className={styles.heroCategoryMiniValue}>{categoryStats?.most_played_category ?? "—"}</div>
                  </div>
                  <div className={styles.heroCategoryMiniCard}>
                    <div className={styles.heroCategoryMiniLabel}>Top Expertise</div>
                    <div className={styles.heroCategoryMiniValue}>{categoryStats?.highest_scoring_category ?? "—"}</div>
                  </div>
                  <div className={styles.heroCategoryMiniCard}>
                    <div className={styles.heroCategoryMiniLabel}>Needs Work</div>
                    <div className={styles.heroCategoryMiniValue}>{categoryStats?.weakest_accuracy_category ?? "—"}</div>
                  </div>
                </div>
                <div className={styles.profileBadges}>
                  <span className={styles.playstyleBadge}>{resolvedPlaystyle.total_accolades} total accolades</span>
                  {resolvedPlaystyle.top_traits.length > 0 && (
                    <span className={styles.playstyleBadge}>
                      {resolvedPlaystyle.top_traits.join(" + ")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <PlaystyleRadar dimensions={resolvedPlaystyle.dimensions} />
        </div>
      </section>

      {/* Core stats */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Core Stats</h2>
        <div className={styles.statsGridCompact}>
          <StatCard value={profile.total_score.toLocaleString()} label="Total Score" comparison={comparisons?.total_score.label ?? null} accent="pink" />
          <StatCard value={String(profile.games_played)} label="Games Played" comparison={comparisons?.games_played.label ?? null} accent="blue" />
          <StatCard value={profile.overall_accuracy !== null ? `${profile.overall_accuracy.toFixed(1)}%` : "—"} label="Accuracy" comparison={comparisons?.overall_accuracy.label ?? null} accent="blue" />
          <StatCard value={String(resolvedPlaystyle.total_accolades)} label="Total Accolades" comparison={comparisons?.total_accolades.label ?? null} accent="gold" />
        </div>
      </section>

      {/* Category breakdown */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Category Breakdown</h2>
        <div className={styles.categorySpotlights}>
          <div className={styles.categorySpotlightItem}>
            <div className={styles.categorySpotlightLabel}>Strongest</div>
            <div className={styles.categorySpotlightValue}>{categoryStats?.best_accuracy_category ?? "Still emerging"}</div>
          </div>
          <div className={styles.categorySpotlightItem}>
            <div className={styles.categorySpotlightLabel}>Needs Work</div>
            <div className={styles.categorySpotlightValue}>{categoryStats?.weakest_accuracy_category ?? "Not enough data yet"}</div>
          </div>
        </div>

        {topCategories.length > 0 ? (
          <div className={styles.categoryPanel}>
            {topCategories.map((category) => (
              <CategoryBar
                key={category.category_name}
                name={category.category_name}
                accuracy={category.accuracy}
                rounds={category.rounds_played}
                averageScore={category.average_score}
              />
            ))}
          </div>
        ) : (
          <div className={styles.emptyPanel}>
            Play across a few categories to start building your strengths and weak spots.
          </div>
        )}
      </section>

      {/* Signature accolades */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Signature Accolades</h2>
        {topAccolades.length > 0 ? (
          <div className={styles.accoladeStatsRow}>
            {topAccolades.map((accolade) => (
              <AccoladeChip
                key={accolade.accolade_type}
                label={accolade.accolade_type.replaceAll("_", " ")}
                count={accolade.count}
              />
            ))}
          </div>
        ) : (
          <div className={styles.emptyPanel}>
            Play a few rounds to start building a signature accolade collection.
          </div>
        )}
      </section>


    </div>
  );
}
