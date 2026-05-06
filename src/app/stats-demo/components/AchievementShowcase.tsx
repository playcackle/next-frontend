"use client";

import { Check, Flame, Gem, Heart, Lock, LockKeyhole, Medal, Star, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import styles from "./AchievementShowcase.module.css";

type Achievement = {
  id: number;
  title: string;
  description: string;
  earned: boolean;
  rarity: "common" | "rare" | "epic" | "legendary";
};

type Props = {
  achievements: Achievement[];
};

const rarityConfig: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  common: { label: "Common", color: "blue", icon: Star },
  rare: { label: "Rare", color: "purple", icon: Heart },
  epic: { label: "Epic", color: "pink", icon: Flame },
  legendary: { label: "Legendary", color: "green", icon: Gem },
};

export function AchievementShowcase({ achievements }: Props) {
  const [filter, setFilter] = useState<"all" | "earned" | "locked">("all");
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const earnedCount = achievements.filter(a => a.earned).length;
  const totalCount = achievements.length;
  const completionPercent = (earnedCount / totalCount) * 100;

  const filteredAchievements = achievements.filter((a) => {
    if (filter === "earned") return a.earned;
    if (filter === "locked") return !a.earned;
    return true;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.titleIcon}><Medal size={20} /></span>
          Achievements
        </h2>
        
        <div className={styles.completionBadge}>
          <span className={styles.completionValue}>{earnedCount}/{totalCount}</span>
          <span className={styles.completionLabel}>Unlocked</span>
        </div>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressTrack}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        <span className={styles.progressText}>{completionPercent.toFixed(0)}% Complete</span>
      </div>

      <div className={styles.filters}>
        <button
          className={`${styles.filterBtn} ${filter === "all" ? styles.filterActive : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({totalCount})
        </button>
        <button
          className={`${styles.filterBtn} ${filter === "earned" ? styles.filterActive : ""}`}
          onClick={() => setFilter("earned")}
        >
          Earned ({earnedCount})
        </button>
        <button
          className={`${styles.filterBtn} ${filter === "locked" ? styles.filterActive : ""}`}
          onClick={() => setFilter("locked")}
        >
          Locked ({totalCount - earnedCount})
        </button>
      </div>

      <div className={styles.achievementGrid}>
        {filteredAchievements.map((achievement) => {
          const rarity = rarityConfig[achievement.rarity];
          
          return (
            <div
              key={achievement.id}
              className={`${styles.achievementCard} ${styles[`card_${rarity.color}`]} ${
                !achievement.earned ? styles.cardLocked : ""
              } ${selectedAchievement?.id === achievement.id ? styles.cardSelected : ""}`}
              onClick={() => setSelectedAchievement(
                selectedAchievement?.id === achievement.id ? null : achievement
              )}
            >
              <div className={styles.achievementIcon}>
                {achievement.earned ? <rarity.icon size={20} /> : <Lock size={20} />}
              </div>
              
              <div className={styles.achievementContent}>
                <div className={styles.achievementHeader}>
                  <h3 className={styles.achievementTitle}>{achievement.title}</h3>
                  <span className={`${styles.rarityBadge} ${styles[`badge_${rarity.color}`]}`}>
                    {rarity.label}
                  </span>
                </div>
                <p className={styles.achievementDesc}>{achievement.description}</p>
              </div>

              {achievement.earned && (
                <div className={styles.earnedGlow} />
              )}
            </div>
          );
        })}
      </div>

      {selectedAchievement && (
        <div className={styles.detailPanel}>
          <div className={styles.detailHeader}>
            <span className={styles.detailIcon}>
              {selectedAchievement.earned
                ? (() => { const Icon = rarityConfig[selectedAchievement.rarity].icon; return <Icon size={20} />; })()
                : <Lock size={20} />
              }
            </span>
            <div>
              <h3 className={styles.detailTitle}>{selectedAchievement.title}</h3>
              <span className={`${styles.detailRarity} ${styles[`text_${rarityConfig[selectedAchievement.rarity].color}`]}`}>
                {rarityConfig[selectedAchievement.rarity].label} Achievement
              </span>
            </div>
          </div>
          
          <p className={styles.detailDescription}>{selectedAchievement.description}</p>
          
          <div className={styles.detailStatus}>
            {selectedAchievement.earned ? (
              <div className={styles.earnedStatus}>
                <span className={styles.statusIcon}><Check size={16} /></span>
                <span>Achievement Unlocked!</span>
              </div>
            ) : (
              <div className={styles.lockedStatus}>
                <span className={styles.statusIcon}><LockKeyhole size={16} /></span>
                <span>Keep playing to unlock</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={styles.rarityLegend}>
        <h4 className={styles.legendTitle}>Rarity Guide</h4>
        <div className={styles.legendItems}>
          {Object.entries(rarityConfig).map(([key, value]) => (
            <div key={key} className={styles.legendItem}>
              <span className={styles.legendIcon}><value.icon size={16} /></span>
              <span className={`${styles.legendLabel} ${styles[`text_${value.color}`]}`}>
                {value.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
