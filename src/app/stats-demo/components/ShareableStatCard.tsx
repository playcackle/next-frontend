"use client";

import { useRef, useState } from "react";
import styles from "./ShareableStatCard.module.css";

interface ShareableStatCardProps {
  playerName: string;
  totalScore: number;
  gamesPlayed: number;
  accuracy: number;
  topCategory: string;
  playStyle: string;
  streak: number;
}

export function ShareableStatCard({
  playerName,
  totalScore,
  gamesPlayed,
  accuracy,
  topCategory,
  playStyle,
  streak,
}: ShareableStatCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // In a real app, this would use html2canvas or similar to capture the card
    // For demo, we'll copy stats to clipboard
    const statsText = `
Cackle Stats - ${playerName}
Score: ${totalScore.toLocaleString()}
Games: ${gamesPlayed}
Accuracy: ${accuracy}%
Top Category: ${topCategory}
Play Style: ${playStyle}
Streak: ${streak} days

Play at Cackle.app
    `.trim();

    try {
      await navigator.clipboard.writeText(statsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div ref={cardRef} className={styles.card}>
        {/* Background decorations */}
        <div className={styles.bgPattern} />
        <div className={styles.glowOrb1} />
        <div className={styles.glowOrb2} />

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoS}>S</span>
            <span className={styles.logoText}>napScore</span>
          </div>
          <div className={styles.badge}>{playStyle}</div>
        </div>

        {/* Player name */}
        <div className={styles.playerSection}>
          <div className={styles.avatar}>
            {playerName.charAt(0).toUpperCase()}
          </div>
          <h2 className={styles.playerName}>{playerName}</h2>
        </div>

        {/* Main score */}
        <div className={styles.mainScore}>
          <span className={styles.scoreLabel}>Total Score</span>
          <div className={styles.scoreValue}>{totalScore.toLocaleString()}</div>
        </div>

        {/* Stats grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <span className={styles.statNumber}>{gamesPlayed}</span>
            <span className={styles.statLabel}>Games</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statNumber}>{accuracy}%</span>
            <span className={styles.statLabel}>Accuracy</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statNumber}>{streak}</span>
            <span className={styles.statLabel}>Day Streak</span>
          </div>
        </div>

        {/* Top category */}
        <div className={styles.categorySection}>
          <span className={styles.categoryLabel}>Expert in</span>
          <span className={styles.categoryValue}>{topCategory}</span>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.url}>cackle.gg</span>
          <span className={styles.date}>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Share button */}
      <button
        className={`${styles.shareButton} ${copied ? styles.copied : ""}`}
        onClick={handleShare}
      >
        {copied ? (
          <>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            Share Stats
          </>
        )}
      </button>

      <p className={styles.hint}>Optimized for Instagram Stories</p>
    </div>
  );
}
