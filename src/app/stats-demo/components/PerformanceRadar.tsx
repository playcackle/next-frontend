"use client";

import { BarChart2, Gamepad2, Gem, Target, TrendingUp, Trophy, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import styles from "./PerformanceRadar.module.css";

type Stats = {
  overall_accuracy: number | null;
  average_claim_rank: number | null;
  rare_claims: number | null;
  near_miss_rate: number | null;
  average_score_per_game: number;
  average_slots_per_game: number;
};

type Props = {
  stats: Stats;
};

type Skill = {
  name: string;
  value: number;
  maxValue: number;
  description: string;
  icon: LucideIcon;
};

function buildSkills(stats: Stats): Skill[] {
  return [
    {
      name: "Accuracy",
      value: stats.overall_accuracy ?? 0,
      maxValue: 100,
      description: "How often your answers are correct",
      icon: Target,
    },
    {
      name: "Speed",
      value: stats.average_claim_rank !== null ? Math.max(0, 100 - (stats.average_claim_rank - 1) * 20) : 50,
      maxValue: 100,
      description: "How quickly you snap answers",
      icon: Zap,
    },
    {
      name: "Rare Hunter",
      value: Math.min(100, (stats.rare_claims ?? 0) * 5),
      maxValue: 100,
      description: "Your ability to find rare answers",
      icon: Gem,
    },
    {
      name: "Consistency",
      value: 100 - (stats.near_miss_rate ?? 0) * 2,
      maxValue: 100,
      description: "How consistent your performance is",
      icon: BarChart2,
    },
    {
      name: "Scoring",
      value: Math.min(100, (stats.average_score_per_game / 400) * 100),
      maxValue: 100,
      description: "Your average score per game",
      icon: Trophy,
    },
    {
      name: "Volume",
      value: Math.min(100, (stats.average_slots_per_game / 25) * 100),
      maxValue: 100,
      description: "How many answers you snap per game",
      icon: TrendingUp,
    },
  ];
}

export function PerformanceRadar({ stats }: Props) {
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const skills = buildSkills(stats);

  const getSkillLevel = (value: number) => {
    if (value >= 80) return { level: "Master", color: "green" };
    if (value >= 60) return { level: "Expert", color: "blue" };
    if (value >= 40) return { level: "Skilled", color: "purple" };
    return { level: "Novice", color: "pink" };
  };

  // Calculate radar polygon points
  const centerX = 120;
  const centerY = 120;
  const maxRadius = 90;
  const sides = skills.length;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / sides - Math.PI / 2;
    const radius = (value / 100) * maxRadius;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const polygonPoints = skills
    .map((skill, i) => {
      const point = getPoint(i, skill.value);
      return `${point.x},${point.y}`;
    })
    .join(" ");

  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>
        <span className={styles.titleIcon}><Gamepad2 size={20} /></span>
        Skill Radar
      </h2>

      <div className={styles.radarWrapper}>
        <svg viewBox="0 0 240 240" className={styles.radarSvg}>
          {/* Background rings */}
          {[20, 40, 60, 80, 100].map((level) => {
            const points = Array.from({ length: sides }, (_, i) => {
              const point = getPoint(i, level);
              return `${point.x},${point.y}`;
            }).join(" ");
            return (
              <polygon
                key={level}
                points={points}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="1"
              />
            );
          })}

          {/* Axis lines */}
          {skills.map((_, i) => {
            const point = getPoint(i, 100);
            return (
              <line
                key={i}
                x1={centerX}
                y1={centerY}
                x2={point.x}
                y2={point.y}
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth="1"
              />
            );
          })}

          {/* Data polygon */}
          <polygon
            points={polygonPoints}
            fill="rgba(0, 221, 255, 0.15)"
            stroke="var(--neon-blue)"
            strokeWidth="2"
            className={styles.dataPolygon}
          />

          {/* Data points */}
          {skills.map((skill, i) => {
            const point = getPoint(i, skill.value);
            const isHovered = hoveredSkill === skill.name;
            return (
              <g key={skill.name}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isHovered ? 8 : 5}
                  fill={isHovered ? "var(--neon-pink)" : "var(--neon-blue)"}
                  className={styles.dataPoint}
                  onMouseEnter={() => setHoveredSkill(skill.name)}
                  onMouseLeave={() => setHoveredSkill(null)}
                />
              </g>
            );
          })}

          {/* Labels */}
          {skills.map((skill, i) => {
            const labelPoint = getPoint(i, 120);
            const IconComp = skill.icon;
            return (
              <foreignObject
                key={skill.name}
                x={labelPoint.x - 10}
                y={labelPoint.y - 10}
                width={20}
                height={20}
                onMouseEnter={() => setHoveredSkill(skill.name)}
                onMouseLeave={() => setHoveredSkill(null)}
              >
                <span
                  className={`${styles.skillLabel} ${
                    hoveredSkill === skill.name ? styles.skillLabelActive : ""
                  }`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}
                >
                  <IconComp size={14} />
                </span>
              </foreignObject>
            );
          })}
        </svg>
      </div>

      <div className={styles.skillList}>
        {skills.map((skill) => {
          const level = getSkillLevel(skill.value);
          const isHovered = hoveredSkill === skill.name;

          return (
            <div
              key={skill.name}
              className={`${styles.skillItem} ${isHovered ? styles.skillItemActive : ""}`}
              onMouseEnter={() => setHoveredSkill(skill.name)}
              onMouseLeave={() => setHoveredSkill(null)}
            >
              <div className={styles.skillHeader}>
                <span className={styles.skillIcon}><skill.icon size={16} /></span>
                <span className={styles.skillName}>{skill.name}</span>
                <span className={`${styles.skillLevel} ${styles[`level_${level.color}`]}`}>
                  {level.level}
                </span>
              </div>
              <div className={styles.skillBar}>
                <div
                  className={`${styles.skillFill} ${styles[`fill_${level.color}`]}`}
                  style={{ width: `${skill.value}%` }}
                />
              </div>
              <div className={styles.skillValue}>{skill.value.toFixed(0)}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
