"use client";

import { useState } from "react";
import { Target, Star, TrendingUp, Gamepad2 } from "lucide-react";
import styles from "./CategoryBreakdown.module.css";

type Category = {
  name: string;
  score: number;
  gamesPlayed: number;
  accuracy: number;
  color: "blue" | "pink" | "purple" | "green";
};

type Props = {
  categories: Category[];
};

export function CategoryBreakdown({ categories }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"bar" | "pie">("bar");
  
  const maxScore = Math.max(...categories.map(c => c.score));
  const totalScore = categories.reduce((sum, c) => sum + c.score, 0);

  const getAccuracyLevel = (accuracy: number) => {
    if (accuracy >= 80) return { label: "Expert", color: "green" };
    if (accuracy >= 70) return { label: "Skilled", color: "blue" };
    if (accuracy >= 60) return { label: "Learning", color: "purple" };
    return { label: "Novice", color: "pink" };
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.titleIcon}><Target size={20} /></span>
          Category Performance
        </h2>
        
        <div className={styles.viewToggle}>
          <button
            className={`${styles.toggleBtn} ${viewMode === "bar" ? styles.toggleActive : ""}`}
            onClick={() => setViewMode("bar")}
          >
            Bars
          </button>
          <button
            className={`${styles.toggleBtn} ${viewMode === "pie" ? styles.toggleActive : ""}`}
            onClick={() => setViewMode("pie")}
          >
            Rings
          </button>
        </div>
      </div>

      {viewMode === "bar" ? (
        <div className={styles.barChart}>
          {categories.map((category) => {
            const percentage = (category.score / maxScore) * 100;
            const isSelected = selectedCategory === category.name;
            const accuracyLevel = getAccuracyLevel(category.accuracy);
            
            return (
              <div
                key={category.name}
                className={`${styles.barRow} ${isSelected ? styles.barRowSelected : ""}`}
                onClick={() => setSelectedCategory(isSelected ? null : category.name)}
              >
                <div className={styles.barLabel}>
                  <span className={styles.categoryName}>{category.name}</span>
                  <span className={`${styles.accuracyBadge} ${styles[`badge_${accuracyLevel.color}`]}`}>
                    {accuracyLevel.label}
                  </span>
                </div>
                
                <div className={styles.barTrack}>
                  <div
                    className={`${styles.barFill} ${styles[`bar_${category.color}`]}`}
                    style={{ width: `${percentage}%` }}
                  >
                    <span className={styles.barValue}>{category.score.toLocaleString()}</span>
                  </div>
                </div>

                {isSelected && (
                  <div className={styles.expandedDetails}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Games Played</span>
                      <span className={styles.detailValue}>{category.gamesPlayed}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Accuracy</span>
                      <span className={styles.detailValue}>{category.accuracy}%</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Avg Score/Game</span>
                      <span className={styles.detailValue}>
                        {Math.round(category.score / category.gamesPlayed)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.ringView}>
          <div className={styles.ringChart}>
            <svg viewBox="0 0 200 200" className={styles.ringSvg}>
              {categories.map((category, index) => {
                const percentage = (category.score / totalScore) * 100;
                const radius = 85 - index * 14;
                const circumference = 2 * Math.PI * radius;
                const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                
                return (
                  <circle
                    key={category.name}
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke={`var(--neon-${category.color})`}
                    strokeWidth="10"
                    strokeDasharray={strokeDasharray}
                    strokeLinecap="round"
                    className={styles.ringCircle}
                    style={{
                      transform: "rotate(-90deg)",
                      transformOrigin: "center",
                      opacity: selectedCategory === category.name || !selectedCategory ? 1 : 0.3,
                      filter: selectedCategory === category.name ? `drop-shadow(0 0 8px var(--neon-${category.color}))` : "none",
                    }}
                    onClick={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}
                  />
                );
              })}
              <text x="100" y="95" textAnchor="middle" className={styles.ringCenterValue}>
                {totalScore.toLocaleString()}
              </text>
              <text x="100" y="115" textAnchor="middle" className={styles.ringCenterLabel}>
                TOTAL
              </text>
            </svg>
          </div>
          
          <div className={styles.ringLegend}>
            {categories.map((category) => (
              <div
                key={category.name}
                className={`${styles.legendItem} ${selectedCategory === category.name ? styles.legendSelected : ""}`}
                onClick={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}
              >
                <span className={`${styles.legendDot} ${styles[`dot_${category.color}`]}`} />
                <span className={styles.legendName}>{category.name}</span>
                <span className={styles.legendValue}>{((category.score / totalScore) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.insights}>
        <h3 className={styles.insightsTitle}>Quick Insights</h3>
        <div className={styles.insightCards}>
          <div className={styles.insightCard}>
            <span className={styles.insightIcon}><Star size={18} /></span>
            <div>
              <div className={styles.insightLabel}>Strongest Category</div>
              <div className={styles.insightValue}>{categories[0].name}</div>
            </div>
          </div>
          <div className={styles.insightCard}>
            <span className={styles.insightIcon}><TrendingUp size={18} /></span>
            <div>
              <div className={styles.insightLabel}>Best Accuracy</div>
              <div className={styles.insightValue}>
                {categories.reduce((best, c) => c.accuracy > best.accuracy ? c : best).name}
              </div>
            </div>
          </div>
          <div className={styles.insightCard}>
            <span className={styles.insightIcon}><Gamepad2 size={18} /></span>
            <div>
              <div className={styles.insightLabel}>Most Played</div>
              <div className={styles.insightValue}>
                {categories.reduce((best, c) => c.gamesPlayed > best.gamesPlayed ? c : best).name}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
