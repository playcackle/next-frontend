"use client";

import { ArrowDown, ArrowUp, TrendingUp } from "lucide-react";
import { useState } from "react";
import styles from "./ScoreTimeline.module.css";

type DataPoint = {
  date: string;
  score: number;
};

type Props = {
  data: DataPoint[];
};

export function ScoreTimeline({ data }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const maxScore = Math.max(...data.map(d => d.score));
  const minScore = Math.min(...data.map(d => d.score));
  const avgScore = Math.round(data.reduce((sum, d) => sum + d.score, 0) / data.length);
  
  const trend = data[data.length - 1].score > data[0].score ? "up" : "down";
  const trendPercent = Math.abs(
    ((data[data.length - 1].score - data[0].score) / data[0].score) * 100
  ).toFixed(1);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.titleIcon}><TrendingUp size={20} /></span>
          Score History
        </h2>

        <div className={styles.trendBadge}>
          <span className={`${styles.trendIcon} ${styles[`trend_${trend}`]}`}>
            {trend === "up" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
          </span>
          <span className={`${styles.trendValue} ${styles[`trend_${trend}`]}`}>
            {trendPercent}%
          </span>
        </div>
      </div>

      <div className={styles.chartArea}>
        <div className={styles.yAxis}>
          <span>{maxScore}</span>
          <span>{Math.round((maxScore + minScore) / 2)}</span>
          <span>{minScore}</span>
        </div>
        
        <div className={styles.chart}>
          {/* Average line */}
          <div 
            className={styles.avgLine} 
            style={{ 
              bottom: `${((avgScore - minScore) / (maxScore - minScore)) * 100}%` 
            }}
          >
            <span className={styles.avgLabel}>AVG: {avgScore}</span>
          </div>
          
          {/* Bars */}
          <div className={styles.bars}>
            {data.map((point, index) => {
              const height = ((point.score - minScore) / (maxScore - minScore)) * 100;
              const isHighest = point.score === maxScore;
              const isHovered = hoveredIndex === index;
              
              return (
                <div
                  key={point.date}
                  className={styles.barWrapper}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div
                    className={`${styles.bar} ${isHighest ? styles.barHighest : ""} ${
                      isHovered ? styles.barHovered : ""
                    }`}
                    style={{ height: `${Math.max(height, 5)}%` }}
                  >
                    {isHovered && (
                      <div className={styles.tooltip}>
                        <span className={styles.tooltipValue}>{point.score}</span>
                        <span className={styles.tooltipDate}>{point.date}</span>
                      </div>
                    )}
                  </div>
                  <span className={styles.barLabel}>{point.date.split(" ")[0]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Best Game</span>
          <span className={`${styles.statValue} ${styles.valueGreen}`}>{maxScore}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Average</span>
          <span className={`${styles.statValue} ${styles.valueBlue}`}>{avgScore}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Lowest</span>
          <span className={`${styles.statValue} ${styles.valuePink}`}>{minScore}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Games</span>
          <span className={`${styles.statValue} ${styles.valuePurple}`}>{data.length}</span>
        </div>
      </div>
    </div>
  );
}
