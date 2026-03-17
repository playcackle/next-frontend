"use client";

import SynthwaveBackground from "@/components/synthwave-background";
import { Button } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import styles from "./leaderboard.module.css";

type LeaderboardEntry = {
  id: number;
  rank?: number;
  username: string;
  score: number;
  roundName: string;
};

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
    []
  );
  const [sortBy, setSortBy] = useState<"score" | "date">("score");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    // Mock leaderboard data
    const mockData: LeaderboardEntry[] = [
      {
        id: 1,
        username: "SynthWave84",
        score: 9850,
        roundName: "80s Music",
      },
      {
        id: 2,
        username: "RetroGamer",
        score: 9200,
        roundName: "Retro Movies",
      },
      {
        id: 3,
        username: "NeonRider",
        score: 8750,
        roundName: "80s Music",
      },
      {
        id: 4,
        username: "Arcade_Master",
        score: 8500,
        roundName: "Vintage Tech",
      },
      {
        id: 5,
        username: "VHS_Collector",
        score: 8200,
        roundName: "Retro Movies",
      },
      {
        id: 6,
        username: "WalkmanFan",
        score: 7900,
        roundName: "Vintage Tech",
      },
      {
        id: 7,
        username: "CassetteKid",
        score: 7800,
        roundName: "80s Music",
      },
      {
        id: 8,
        username: "PixelPusher",
        score: 7600,
        roundName: "Pop Culture",
      },
      {
        id: 9,
        username: "BoomBox_Hero",
        score: 7400,
        roundName: "Pop Culture",
      },
      {
        id: 10,
        username: "MallRat1985",
        score: 7200,
        roundName: "Pop Culture",
      },
    ];

    setLeaderboardData(mockData);
  }, []);

  // Filter and sort the leaderboard data
  const filteredData = leaderboardData
    .filter(
      (entry) => activeCategory === "all" || entry.roundName === activeCategory
    )
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  const categories = [
    "all",
    "80s Music",
    "Retro Movies",
    "Vintage Tech",
    "Pop Culture",
  ];

  return (
    <div className={styles.container}>
      <SynthwaveBackground />

      <main className={styles.main}>
        <h1 className={styles.leaderboardTitle}>Leaderboard</h1>

        <div className={styles.leaderboardControls}>
          <div className={styles.categoryFilters}>
            {categories.map((category) => (
              <Button
                key={category}
                className={`${styles.categoryButton} ${
                  activeCategory === category ? styles.active : ""
                }`}
                onClick={() => setActiveCategory(category)}
              >
                {category === "all" ? "All Categories" : category}
              </Button>
            ))}
          </div>

          <div className={styles.sortOptions}>
            <Button
              className={`${styles.sortButton} ${
                sortBy === "score" ? styles.active : ""
              }`}
              onClick={() => setSortBy("score")}
            >
              Sort by Score
            </Button>
          </div>
        </div>

        <div className={styles.leaderboardTableContainer}>
          <table className={styles.leaderboardTable}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Quiz Type</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((entry) => (
                <tr
                  key={entry.id}
                  className={entry.rank === 1 ? styles.topRank : ""}
                >
                  <td>
                    <span className={styles.rankBadge}>{entry.rank}</span>
                  </td>
                  <td>{entry.username}</td>
                  <td>{entry.roundName}</td>
                  <td className={styles.scoreCell}>
                    {entry.score.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Retro Quiz | All Rights Reserved</p>
      </footer>
    </div>
  );
}
