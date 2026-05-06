"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { StatsOverview } from "./components/StatsOverview";
import { CategoryBreakdown } from "./components/CategoryBreakdown";
import { AchievementShowcase } from "./components/AchievementShowcase";
import { PerformanceRadar } from "./components/PerformanceRadar";
import { ScoreTimeline } from "./components/ScoreTimeline";
import { PlayStyleAnalysis } from "./components/PlayStyleAnalysis";
import { WrappedStory } from "./components/WrappedStory";
import { StreakDisplay } from "./components/StreakDisplay";
import { ShareableStatCard } from "./components/ShareableStatCard";
import { LiveLeaderboard } from "./components/LiveLeaderboard";
import { InteractiveCharts } from "./components/InteractiveCharts";

// Mock data for demonstration
const mockPlayerStats = {
  id: "demo-player",
  name: "NeonMaster",
  total_score: 12450,
  games_played: 47,
  rounds_played: 235,
  total_slots_snapped: 892,
  overall_accuracy: 78.5,
  average_claim_rank: 2.3,
  rare_claims: 23,
  near_miss_count: 45,
  near_miss_rate: 12.4,
  avg_near_miss_similarity: 0.89,
  average_score_per_game: 264.9,
  average_score_per_round: 52.98,
  average_slots_per_game: 18.98,
  average_slots_per_round: 3.8,
};

const mockCategoryStats = [
  { name: "Movies & TV", score: 3420, gamesPlayed: 12, accuracy: 82.3, color: "pink" },
  { name: "Music", score: 2890, gamesPlayed: 10, accuracy: 75.1, color: "blue" },
  { name: "Science", score: 2150, gamesPlayed: 8, accuracy: 71.2, color: "purple" },
  { name: "History", score: 1980, gamesPlayed: 7, accuracy: 68.9, color: "green" },
  { name: "Sports", score: 1210, gamesPlayed: 6, accuracy: 65.4, color: "pink" },
  { name: "Geography", score: 800, gamesPlayed: 4, accuracy: 62.1, color: "blue" },
];

const mockAchievements = [
  { id: 1, title: "Speed Demon", description: "Snapped 5 slots in under 10 seconds", earned: true, rarity: "rare" },
  { id: 2, title: "Perfect Round", description: "Got 100% accuracy in a round", earned: true, rarity: "epic" },
  { id: 3, title: "Rare Hunter", description: "Claimed 10 rare slots", earned: true, rarity: "legendary" },
  { id: 4, title: "Streak Master", description: "Won 5 games in a row", earned: false, rarity: "epic" },
  { id: 5, title: "First Blood", description: "Be the first to snap in a round", earned: true, rarity: "common" },
  { id: 6, title: "Knowledge King", description: "Score 500+ in a single game", earned: true, rarity: "rare" },
];

const mockTimeline = [
  { date: "Apr 1", score: 180 },
  { date: "Apr 5", score: 245 },
  { date: "Apr 8", score: 210 },
  { date: "Apr 12", score: 320 },
  { date: "Apr 15", score: 290 },
  { date: "Apr 20", score: 380 },
  { date: "Apr 25", score: 415 },
  { date: "Apr 30", score: 360 },
  { date: "May 3", score: 450 },
];

type TabType = "overview" | "categories" | "achievements" | "analysis" | "charts" | "social";

export default function StatsDemoPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [showWrappedStory, setShowWrappedStory] = useState(false);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: "overview",
      label: "Overview",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      id: "categories",
      label: "Categories",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      ),
    },
    {
      id: "achievements",
      label: "Achievements",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="7" />
          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
        </svg>
      ),
    },
    {
      id: "analysis",
      label: "Analysis",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
          <path d="M22 12A10 10 0 0 0 12 2v10z" />
        </svg>
      ),
    },
    {
      id: "charts",
      label: "Charts",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
          <line x1="2" y1="20" x2="22" y2="20" />
        </svg>
      ),
    },
    {
      id: "social",
      label: "Social",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
  ];

  return (
    <main className={styles.container}>
      {/* Wrapped Story Modal */}
      {showWrappedStory && (
        <WrappedStory
          playerName={mockPlayerStats.name}
          stats={{
            total_score: mockPlayerStats.total_score,
            games_played: mockPlayerStats.games_played,
            total_slots_snapped: mockPlayerStats.total_slots_snapped,
            overall_accuracy: mockPlayerStats.overall_accuracy,
            rare_claims: mockPlayerStats.rare_claims,
            average_score_per_game: mockPlayerStats.average_score_per_game,
          }}
          topCategory={mockCategoryStats[0]}
          playStyle="The Strategist"
          onClose={() => setShowWrappedStory(false)}
        />
      )}

      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>
              <span className={styles.neonText}>PLAYER</span>
              <span className={styles.neonTextPink}>STATS</span>
            </h1>
            <p className={styles.subtitle}>Interactive Stats Explorer Demo</p>
          </div>
          
          <button className={styles.wrappedBtn} onClick={() => setShowWrappedStory(true)}>
            <span className={styles.wrappedIcon}>&#10024;</span>
            View Your Wrapped
          </button>
        </div>
      </header>

      <nav className={styles.tabNav}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className={styles.content}>
        {activeTab === "overview" && (
          <div className={styles.overviewLayout}>
            <div className={styles.mainColumn}>
              <StatsOverview stats={mockPlayerStats} />
              <ScoreTimeline data={mockTimeline} />
            </div>
            <div className={styles.sideColumn}>
              <StreakDisplay
                currentStreak={12}
                longestStreak={21}
                lastPlayedDate="Today"
                weeklyActivity={[true, true, true, false, true, true, true]}
              />
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <CategoryBreakdown categories={mockCategoryStats} />
        )}

        {activeTab === "achievements" && (
          <AchievementShowcase achievements={mockAchievements} />
        )}

        {activeTab === "analysis" && (
          <div className={styles.analysisLayout}>
            <PerformanceRadar stats={mockPlayerStats} />
            <PlayStyleAnalysis stats={mockPlayerStats} categories={mockCategoryStats} />
          </div>
        )}

        {activeTab === "charts" && (
          <InteractiveCharts />
        )}

        {activeTab === "social" && (
          <div className={styles.socialLayout}>
            <div className={styles.leaderboardSection}>
              <LiveLeaderboard currentPlayerId="1" />
            </div>
            <div className={styles.shareSection}>
              <h3 className={styles.sectionTitle}>Share Your Stats</h3>
              <ShareableStatCard
                playerName={mockPlayerStats.name}
                totalScore={mockPlayerStats.total_score}
                gamesPlayed={mockPlayerStats.games_played}
                accuracy={mockPlayerStats.overall_accuracy}
                topCategory={mockCategoryStats[0].name}
                playStyle="The Strategist"
                streak={12}
              />
            </div>
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <p className={styles.footerNote}>
          This is a demo page exploring fun ways to visualize player statistics
        </p>
        <div className={styles.footerLinks}>
          <span className={styles.footerTag}>Inspired by Spotify Wrapped</span>
          <span className={styles.footerDivider}>|</span>
          <span className={styles.footerTag}>Duolingo Streaks</span>
          <span className={styles.footerDivider}>|</span>
          <span className={styles.footerTag}>Gaming Dashboards</span>
        </div>
      </footer>
    </main>
  );
}
