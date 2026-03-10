"use client";

import { useState, useEffect } from "react";
import styles from "@/app/page.module.css";

type LeaderboardEntry = {
  rank: number;
  name: string;
  score: number;
};

type Period = "week" | "month" | "year";

const MOCK: Record<Period, LeaderboardEntry[]> = {
  week: [
    { rank: 1, name: "SynthWave84", score: 4200 },
    { rank: 2, name: "RetroGamer", score: 3850 },
    { rank: 3, name: "NeonRider", score: 3600 },
    { rank: 4, name: "Arcade_Master", score: 3400 },
    { rank: 5, name: "VHS_Collector", score: 3100 },
  ],
  month: [
    { rank: 1, name: "PixelPusher", score: 18500 },
    { rank: 2, name: "SynthWave84", score: 17200 },
    { rank: 3, name: "BoomBox_Hero", score: 15900 },
    { rank: 4, name: "CassetteKid", score: 14700 },
    { rank: 5, name: "RetroGamer", score: 13200 },
  ],
  year: [
    { rank: 1, name: "MallRat1985", score: 142000 },
    { rank: 2, name: "PixelPusher", score: 138000 },
    { rank: 3, name: "SynthWave84", score: 121000 },
    { rank: 4, name: "WalkmanFan", score: 109000 },
    { rank: 5, name: "NeonRider", score: 98500 },
  ],
};

export default function HomeLeaderboard() {
  const [period, setPeriod] = useState<Period>("week");
  const [data, setData] = useState<LeaderboardEntry[]>(MOCK.week);

  useEffect(() => {
    setData(MOCK[period]);
  }, [period]);

  const PERIODS: { key: Period; label: string }[] = [
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "year", label: "This Year" },
  ];

  return (
    <div className={styles.leaderboardCard}>
      <div className={styles.periodToggle}>
        {PERIODS.map(({ key, label }) => (
          <button
            key={key}
            className={`${styles.periodBtn} ${period === key ? styles.periodBtnActive : ""}`}
            onClick={() => setPeriod(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <ol className={styles.leaderList}>
        {data.map((entry) => (
          <li key={entry.rank} className={`${styles.leaderRow} ${entry.rank === 1 ? styles.leaderRowFirst : ""}`}>
            <span className={`${styles.leaderRank} ${entry.rank <= 3 ? styles[`rank${entry.rank}`] : ""}`}>
              {entry.rank}
            </span>
            <span className={styles.leaderName}>{entry.name}</span>
            <span className={styles.leaderScore}>{entry.score.toLocaleString()}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
