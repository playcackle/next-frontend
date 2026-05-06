"use client";

import { Dices, Flame, Gem, Lightbulb, Scale, Sparkles, Target, Zap, Brain } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import styles from "./PlayStyleAnalysis.module.css";

type Stats = {
  overall_accuracy: number | null;
  average_claim_rank: number | null;
  rare_claims: number | null;
  average_score_per_game: number;
  average_slots_per_game: number;
};

type Category = {
  name: string;
  score: number;
  gamesPlayed: number;
  accuracy: number;
};

type Props = {
  stats: Stats;
  categories: Category[];
};

type PlayStyle = {
  name: string;
  icon: LucideIcon;
  description: string;
  traits: string[];
  color: "blue" | "pink" | "purple" | "green";
};

function determinePlayStyle(stats: Stats): PlayStyle {
  const accuracy = stats.overall_accuracy ?? 0;
  const speed = stats.average_claim_rank !== null ? 100 - (stats.average_claim_rank - 1) * 20 : 50;
  const rareHunting = Math.min(100, (stats.rare_claims ?? 0) * 5);
  const volume = Math.min(100, (stats.average_slots_per_game / 25) * 100);

  // Determine primary play style based on dominant stat
  if (accuracy > 80 && speed > 70) {
    return {
      name: "Precision Striker",
      icon: Target,
      description: "You combine deadly accuracy with lightning-fast reflexes. A true elite player.",
      traits: ["High Accuracy", "Quick Reactions", "Calculated Risk"],
      color: "green",
    };
  }

  if (speed > 80) {
    return {
      name: "Speed Demon",
      icon: Zap,
      description: "You live for the rush! First to answer, you thrive on quick-fire rounds.",
      traits: ["Fast Reflexes", "Aggressive", "Risk Taker"],
      color: "pink",
    };
  }

  if (rareHunting > 60) {
    return {
      name: "Treasure Hunter",
      icon: Gem,
      description: "You have a nose for the hidden gems. Rare answers are your specialty.",
      traits: ["Knowledge Deep-Diver", "Patient", "High Value Target"],
      color: "purple",
    };
  }

  if (accuracy > 75) {
    return {
      name: "Methodical Master",
      icon: Brain,
      description: "Quality over quantity. You take your time and rarely miss.",
      traits: ["High Precision", "Strategic", "Reliable"],
      color: "blue",
    };
  }

  if (volume > 70) {
    return {
      name: "Volume Virtuoso",
      icon: Flame,
      description: "You play the numbers game! More attempts means more points.",
      traits: ["High Activity", "Persistent", "Fearless"],
      color: "pink",
    };
  }

  return {
    name: "Balanced Player",
    icon: Scale,
    description: "You have a well-rounded approach with no major weaknesses.",
    traits: ["Versatile", "Adaptable", "Consistent"],
    color: "blue",
  };
}

function generateInsights(stats: Stats, categories: Category[]): string[] {
  const insights: string[] = [];

  if ((stats.overall_accuracy ?? 0) > 75) {
    insights.push("Your accuracy is above average - you rarely miss!");
  }

  if ((stats.average_claim_rank ?? 5) < 2.5) {
    insights.push("You're often first to snap - great reflexes!");
  }

  if ((stats.rare_claims ?? 0) > 15) {
    insights.push("You've found more rare answers than most players.");
  }

  if (categories.length > 0) {
    const bestCategory = categories[0];
    insights.push(`${bestCategory.name} is your strongest category.`);
  }

  if (stats.average_score_per_game > 250) {
    insights.push("Your scoring average is impressive - keep it up!");
  }

  return insights.slice(0, 4);
}

function generateTips(stats: Stats): string[] {
  const tips: string[] = [];

  if ((stats.overall_accuracy ?? 0) < 70) {
    tips.push("Take a moment to read answers carefully before snapping.");
  }

  if ((stats.average_claim_rank ?? 5) > 3) {
    tips.push("Try to anticipate common answers to snap faster.");
  }

  if ((stats.rare_claims ?? 0) < 10) {
    tips.push("Look for uncommon answers - they're worth bonus points!");
  }

  tips.push("Play categories you're less familiar with to improve.");

  return tips.slice(0, 3);
}

export function PlayStyleAnalysis({ stats, categories }: Props) {
  const [showTips, setShowTips] = useState(false);
  const playStyle = determinePlayStyle(stats);
  const insights = generateInsights(stats, categories);
  const tips = generateTips(stats);

  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>
        <span className={styles.titleIcon}><Sparkles size={20} /></span>
        Play Style Analysis
      </h2>

      <div className={`${styles.styleCard} ${styles[`card_${playStyle.color}`]}`}>
        <div className={styles.styleIcon}><playStyle.icon size={24} /></div>
        <div className={styles.styleContent}>
          <h3 className={styles.styleName}>{playStyle.name}</h3>
          <p className={styles.styleDescription}>{playStyle.description}</p>
          <div className={styles.traits}>
            {playStyle.traits.map((trait) => (
              <span key={trait} className={styles.trait}>
                {trait}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.toggleRow}>
        <button
          className={`${styles.toggleBtn} ${!showTips ? styles.toggleActive : ""}`}
          onClick={() => setShowTips(false)}
        >
          Insights
        </button>
        <button
          className={`${styles.toggleBtn} ${showTips ? styles.toggleActive : ""}`}
          onClick={() => setShowTips(true)}
        >
          Tips
        </button>
      </div>

      <div className={styles.listSection}>
        {!showTips ? (
          <ul className={styles.insightList}>
            {insights.map((insight, index) => (
              <li key={index} className={styles.insightItem}>
                <span className={styles.insightIcon}><Sparkles size={14} /></span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        ) : (
          <ul className={styles.tipList}>
            {tips.map((tip, index) => (
              <li key={index} className={styles.tipItem}>
                <span className={styles.tipIcon}><Lightbulb size={14} /></span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.funFact}>
        <div className={styles.funFactIcon}><Dices size={20} /></div>
        <div className={styles.funFactContent}>
          <div className={styles.funFactLabel}>Random Fun Fact</div>
          <div className={styles.funFactText}>
            If you kept your current pace, you&apos;d reach 50,000 points in about{" "}
            {Math.ceil((50000 - 12450) / stats.average_score_per_game)} more games!
          </div>
        </div>
      </div>
    </div>
  );
}
