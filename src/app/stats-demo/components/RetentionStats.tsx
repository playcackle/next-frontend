"use client";

import { useState, useEffect } from "react";
import styles from "./RetentionStats.module.css";

// Mock data for retention-focused stats
const mockRetentionData = {
  // Streak data (Duolingo-style)
  currentStreak: 12,
  longestStreak: 34,
  streakFreezes: 2,
  lastPlayedDate: "2024-01-15",
  
  // Personal bests
  personalBests: {
    highestScore: 2450,
    fastestSnap: 0.8,
    perfectGames: 7,
    longestWinStreak: 8,
    mostPointsInRound: 500,
    bestAccuracy: 94,
  },
  
  // Near-miss data (motivational)
  nearMisses: {
    almostPerfectGames: 12,
    oneAwayFromStreak: 5,
    narrowLosses: 8,
    missedByOnePoint: 3,
  },
  
  // Progression data
  progression: {
    currentLevel: 24,
    currentXP: 7850,
    nextLevelXP: 10000,
    totalXP: 47850,
    rank: "Gold II",
    nextRank: "Platinum I",
    rankProgress: 72,
  },
  
  // Daily/Weekly challenges
  challenges: [
    { id: 1, name: "Play 3 games", progress: 2, target: 3, reward: 50, type: "daily" },
    { id: 2, name: "Win a game", progress: 1, target: 1, reward: 100, type: "daily", completed: true },
    { id: 3, name: "Score 1000+ points", progress: 850, target: 1000, reward: 75, type: "daily" },
    { id: 4, name: "Play 15 games", progress: 11, target: 15, reward: 300, type: "weekly" },
    { id: 5, name: "Win 5 games", progress: 3, target: 5, reward: 500, type: "weekly" },
    { id: 6, name: "Get 3 rare claims", progress: 1, target: 3, reward: 250, type: "weekly" },
  ],
  
  // Comeback stats
  comebackStats: {
    biggestComeback: 320,
    comebackWins: 14,
    gamesPlayedAfterLoss: 156,
    winRateAfterLoss: 58,
  },
  
  // Social comparison
  friendComparison: [
    { name: "Alex", score: 45200, gamesPlayed: 89, winRate: 62, you: false },
    { name: "You", score: 42150, gamesPlayed: 78, winRate: 58, you: true },
    { name: "Jordan", score: 41800, gamesPlayed: 92, winRate: 55, you: false },
    { name: "Sam", score: 38500, gamesPlayed: 65, winRate: 52, you: false },
  ],
  
  // Milestones (unlockable)
  milestones: [
    { id: 1, name: "First Win", icon: "trophy", unlocked: true, date: "2023-08-15" },
    { id: 2, name: "10 Games Played", icon: "games", unlocked: true, date: "2023-08-20" },
    { id: 3, name: "7-Day Streak", icon: "fire", unlocked: true, date: "2023-09-01" },
    { id: 4, name: "100 Games", icon: "star", unlocked: true, date: "2023-11-15" },
    { id: 5, name: "Perfect Game", icon: "crown", unlocked: true, date: "2023-12-01" },
    { id: 6, name: "30-Day Streak", icon: "flame", unlocked: true, date: "2024-01-05" },
    { id: 7, name: "500 Games", icon: "diamond", unlocked: false, progress: 78 },
    { id: 8, name: "100-Day Streak", icon: "legend", unlocked: false, progress: 12 },
  ],
  
  // Year-over-year comparison
  yearOverYear: {
    thisYear: { gamesPlayed: 78, totalScore: 42150, winRate: 58, avgScore: 540 },
    lastYear: { gamesPlayed: 45, totalScore: 22300, winRate: 51, avgScore: 495 },
  },
};

export function RetentionStats() {
  const [activeSection, setActiveSection] = useState<"streaks" | "progress" | "challenges" | "social" | "records">("streaks");
  const [animatedXP, setAnimatedXP] = useState(0);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);

  useEffect(() => {
    // Animate XP bar
    const target = mockRetentionData.progression.currentXP;
    const duration = 1500;
    const start = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setAnimatedXP(Math.floor(target * easeOutCubic(progress)));
      if (progress < 1) requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }, []);

  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  const sections = [
    { id: "streaks", label: "Streaks", icon: "🔥" },
    { id: "progress", label: "Progress", icon: "📈" },
    { id: "challenges", label: "Challenges", icon: "🎯" },
    { id: "social", label: "Friends", icon: "👥" },
    { id: "records", label: "Records", icon: "🏆" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Retention & Engagement Stats</h2>
        <p className={styles.subtitle}>Stats designed to keep you coming back</p>
      </div>

      <nav className={styles.sectionNav}>
        {sections.map((section) => (
          <button
            key={section.id}
            className={`${styles.sectionButton} ${activeSection === section.id ? styles.active : ""}`}
            onClick={() => setActiveSection(section.id as typeof activeSection)}
          >
            <span className={styles.sectionIcon}>{section.icon}</span>
            <span>{section.label}</span>
          </button>
        ))}
      </nav>

      <div className={styles.content}>
        {activeSection === "streaks" && (
          <div className={styles.streaksSection}>
            {/* Current Streak - Hero */}
            <div className={styles.streakHero}>
              <div className={styles.streakFireContainer}>
                <div className={styles.fireIcon}>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className={styles.flame} style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
                <span className={styles.streakNumber}>{mockRetentionData.currentStreak}</span>
              </div>
              <div className={styles.streakLabel}>Day Streak</div>
              <div className={styles.streakMessage}>
                {mockRetentionData.currentStreak >= 7 
                  ? "You're on fire! Don't break the chain!" 
                  : "Keep playing daily to build your streak!"}
              </div>
              {mockRetentionData.streakFreezes > 0 && (
                <div className={styles.freezeIndicator}>
                  <span className={styles.freezeIcon}>❄️</span>
                  <span>{mockRetentionData.streakFreezes} streak freezes available</span>
                </div>
              )}
            </div>

            {/* Streak Stats */}
            <div className={styles.streakStatsGrid}>
              <div className={styles.streakStatCard}>
                <div className={styles.streakStatValue}>{mockRetentionData.longestStreak}</div>
                <div className={styles.streakStatLabel}>Longest Streak</div>
                <div className={styles.streakProgress}>
                  <div 
                    className={styles.streakProgressBar}
                    style={{ width: `${(mockRetentionData.currentStreak / mockRetentionData.longestStreak) * 100}%` }}
                  />
                </div>
                <div className={styles.streakProgressLabel}>
                  {mockRetentionData.longestStreak - mockRetentionData.currentStreak} days to beat!
                </div>
              </div>

              <div className={styles.streakStatCard}>
                <div className={styles.streakStatValue}>7</div>
                <div className={styles.streakStatLabel}>Next Milestone</div>
                <div className={styles.milestoneReward}>
                  <span className={styles.rewardIcon}>🎁</span>
                  <span>+100 XP Bonus</span>
                </div>
              </div>
            </div>

            {/* Weekly Calendar */}
            <div className={styles.weeklyCalendar}>
              <h4 className={styles.calendarTitle}>This Week</h4>
              <div className={styles.calendarGrid}>
                {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                  <div 
                    key={i} 
                    className={`${styles.calendarDay} ${i < 5 ? styles.completed : i === 5 ? styles.today : styles.upcoming}`}
                  >
                    <span className={styles.dayLabel}>{day}</span>
                    <span className={styles.dayIcon}>
                      {i < 5 ? "✓" : i === 5 ? "🔥" : "○"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Loss Aversion Message */}
            <div className={styles.lossAversionCard}>
              <div className={styles.warningIcon}>⚠️</div>
              <div className={styles.warningText}>
                <strong>Don&apos;t lose your streak!</strong>
                <p>Missing tomorrow will reset your {mockRetentionData.currentStreak}-day streak. Play now to keep it alive!</p>
              </div>
              <button className={styles.playNowButton}>Play Now</button>
            </div>
          </div>
        )}

        {activeSection === "progress" && (
          <div className={styles.progressSection}>
            {/* Level & XP */}
            <div className={styles.levelCard}>
              <div className={styles.levelBadge}>
                <span className={styles.levelNumber}>{mockRetentionData.progression.currentLevel}</span>
                <span className={styles.levelLabel}>LEVEL</span>
              </div>
              <div className={styles.xpContainer}>
                <div className={styles.xpHeader}>
                  <span>{animatedXP.toLocaleString()} XP</span>
                  <span className={styles.xpTarget}>{mockRetentionData.progression.nextLevelXP.toLocaleString()} XP</span>
                </div>
                <div className={styles.xpBar}>
                  <div 
                    className={styles.xpFill}
                    style={{ width: `${(animatedXP / mockRetentionData.progression.nextLevelXP) * 100}%` }}
                  >
                    <div className={styles.xpShimmer} />
                  </div>
                </div>
                <div className={styles.xpRemaining}>
                  {(mockRetentionData.progression.nextLevelXP - mockRetentionData.progression.currentXP).toLocaleString()} XP to Level {mockRetentionData.progression.currentLevel + 1}
                </div>
              </div>
            </div>

            {/* Rank Progress */}
            <div className={styles.rankCard}>
              <div className={styles.currentRank}>
                <div className={styles.rankIcon}>🥇</div>
                <div className={styles.rankName}>{mockRetentionData.progression.rank}</div>
              </div>
              <div className={styles.rankProgressContainer}>
                <div className={styles.rankProgressBar}>
                  <div 
                    className={styles.rankProgressFill}
                    style={{ width: `${mockRetentionData.progression.rankProgress}%` }}
                  />
                </div>
                <div className={styles.rankProgressLabel}>{mockRetentionData.progression.rankProgress}%</div>
              </div>
              <div className={styles.nextRank}>
                <div className={styles.rankIcon}>🏆</div>
                <div className={styles.rankName}>{mockRetentionData.progression.nextRank}</div>
              </div>
            </div>

            {/* Milestones */}
            <div className={styles.milestonesCard}>
              <h4 className={styles.milestonesTitle}>Milestones</h4>
              <div className={styles.milestonesGrid}>
                {mockRetentionData.milestones.map((milestone) => (
                  <div 
                    key={milestone.id}
                    className={`${styles.milestone} ${milestone.unlocked ? styles.unlocked : styles.locked}`}
                  >
                    <div className={styles.milestoneIcon}>
                      {milestone.unlocked ? (
                        milestone.icon === "trophy" ? "🏆" :
                        milestone.icon === "games" ? "🎮" :
                        milestone.icon === "fire" ? "🔥" :
                        milestone.icon === "star" ? "⭐" :
                        milestone.icon === "crown" ? "👑" :
                        milestone.icon === "flame" ? "🔥" :
                        milestone.icon === "diamond" ? "💎" : "🏅"
                      ) : "🔒"}
                    </div>
                    <div className={styles.milestoneName}>{milestone.name}</div>
                    {!milestone.unlocked && milestone.progress && (
                      <div className={styles.milestoneProgress}>{milestone.progress}%</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Year Over Year */}
            <div className={styles.yoyCard}>
              <h4 className={styles.yoyTitle}>Year Over Year Growth</h4>
              <div className={styles.yoyGrid}>
                {[
                  { label: "Games Played", current: mockRetentionData.yearOverYear.thisYear.gamesPlayed, prev: mockRetentionData.yearOverYear.lastYear.gamesPlayed },
                  { label: "Win Rate", current: mockRetentionData.yearOverYear.thisYear.winRate, prev: mockRetentionData.yearOverYear.lastYear.winRate, suffix: "%" },
                  { label: "Avg Score", current: mockRetentionData.yearOverYear.thisYear.avgScore, prev: mockRetentionData.yearOverYear.lastYear.avgScore },
                  { label: "Total Score", current: mockRetentionData.yearOverYear.thisYear.totalScore, prev: mockRetentionData.yearOverYear.lastYear.totalScore },
                ].map((stat, i) => {
                  const change = ((stat.current - stat.prev) / stat.prev * 100).toFixed(0);
                  const isPositive = stat.current > stat.prev;
                  return (
                    <div key={i} className={styles.yoyStat}>
                      <div className={styles.yoyStatLabel}>{stat.label}</div>
                      <div className={styles.yoyStatValue}>
                        {stat.current.toLocaleString()}{stat.suffix || ""}
                      </div>
                      <div className={`${styles.yoyChange} ${isPositive ? styles.positive : styles.negative}`}>
                        {isPositive ? "↑" : "↓"} {Math.abs(Number(change))}% vs last year
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeSection === "challenges" && (
          <div className={styles.challengesSection}>
            {/* Daily Challenges */}
            <div className={styles.challengeGroup}>
              <div className={styles.challengeGroupHeader}>
                <h4>Daily Challenges</h4>
                <span className={styles.resetTimer}>Resets in 8h 42m</span>
              </div>
              <div className={styles.challengeList}>
                {mockRetentionData.challenges
                  .filter(c => c.type === "daily")
                  .map((challenge) => (
                    <div 
                      key={challenge.id}
                      className={`${styles.challengeItem} ${challenge.completed ? styles.completed : ""}`}
                    >
                      <div className={styles.challengeInfo}>
                        <div className={styles.challengeName}>{challenge.name}</div>
                        <div className={styles.challengeProgressBar}>
                          <div 
                            className={styles.challengeProgressFill}
                            style={{ width: `${Math.min((challenge.progress / challenge.target) * 100, 100)}%` }}
                          />
                        </div>
                        <div className={styles.challengeProgressText}>
                          {challenge.progress}/{challenge.target}
                        </div>
                      </div>
                      <div className={styles.challengeReward}>
                        <span className={styles.rewardAmount}>+{challenge.reward}</span>
                        <span className={styles.rewardType}>XP</span>
                        {challenge.completed && <span className={styles.claimedBadge}>✓</span>}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Weekly Challenges */}
            <div className={styles.challengeGroup}>
              <div className={styles.challengeGroupHeader}>
                <h4>Weekly Challenges</h4>
                <span className={styles.resetTimer}>Resets in 4d 8h</span>
              </div>
              <div className={styles.challengeList}>
                {mockRetentionData.challenges
                  .filter(c => c.type === "weekly")
                  .map((challenge) => (
                    <div 
                      key={challenge.id}
                      className={`${styles.challengeItem} ${challenge.completed ? styles.completed : ""}`}
                    >
                      <div className={styles.challengeInfo}>
                        <div className={styles.challengeName}>{challenge.name}</div>
                        <div className={styles.challengeProgressBar}>
                          <div 
                            className={styles.challengeProgressFill}
                            style={{ width: `${Math.min((challenge.progress / challenge.target) * 100, 100)}%` }}
                          />
                        </div>
                        <div className={styles.challengeProgressText}>
                          {challenge.progress}/{challenge.target}
                        </div>
                      </div>
                      <div className={styles.challengeReward}>
                        <span className={styles.rewardAmount}>+{challenge.reward}</span>
                        <span className={styles.rewardType}>XP</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Bonus Challenge */}
            <div className={styles.bonusChallenge}>
              <div className={styles.bonusHeader}>
                <span className={styles.bonusIcon}>⚡</span>
                <span className={styles.bonusTitle}>BONUS CHALLENGE</span>
              </div>
              <div className={styles.bonusContent}>
                <div className={styles.bonusName}>Win 3 games in a row</div>
                <div className={styles.bonusReward}>+500 XP + Mystery Badge</div>
              </div>
              <div className={styles.bonusProgress}>
                <div className={styles.bonusProgressDots}>
                  <span className={`${styles.dot} ${styles.filled}`} />
                  <span className={`${styles.dot} ${styles.filled}`} />
                  <span className={styles.dot} />
                </div>
                <span>2/3 wins</span>
              </div>
            </div>
          </div>
        )}

        {activeSection === "social" && (
          <div className={styles.socialSection}>
            {/* Friend Leaderboard */}
            <div className={styles.friendLeaderboard}>
              <h4 className={styles.leaderboardTitle}>Friend Rankings</h4>
              <div className={styles.leaderboardList}>
                {mockRetentionData.friendComparison.map((friend, index) => (
                  <div 
                    key={friend.name}
                    className={`${styles.leaderboardItem} ${friend.you ? styles.youItem : ""}`}
                  >
                    <div className={styles.leaderboardRank}>#{index + 1}</div>
                    <div className={styles.leaderboardAvatar}>
                      {friend.name.charAt(0)}
                    </div>
                    <div className={styles.leaderboardInfo}>
                      <div className={styles.leaderboardName}>
                        {friend.name} {friend.you && <span className={styles.youBadge}>You</span>}
                      </div>
                      <div className={styles.leaderboardStats}>
                        {friend.gamesPlayed} games · {friend.winRate}% win rate
                      </div>
                    </div>
                    <div className={styles.leaderboardScore}>
                      {friend.score.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.catchUpMessage}>
                <span className={styles.catchUpIcon}>💪</span>
                <span>Win 2 more games to pass Alex!</span>
              </div>
            </div>

            {/* Social Stats */}
            <div className={styles.socialStats}>
              <div className={styles.socialStatCard}>
                <div className={styles.socialStatIcon}>👥</div>
                <div className={styles.socialStatValue}>12</div>
                <div className={styles.socialStatLabel}>Friends Playing</div>
              </div>
              <div className={styles.socialStatCard}>
                <div className={styles.socialStatIcon}>🎯</div>
                <div className={styles.socialStatValue}>5</div>
                <div className={styles.socialStatLabel}>Friends Beaten Today</div>
              </div>
              <div className={styles.socialStatCard}>
                <div className={styles.socialStatIcon}>📊</div>
                <div className={styles.socialStatValue}>Top 15%</div>
                <div className={styles.socialStatLabel}>Global Ranking</div>
              </div>
            </div>

            {/* Invite Friends */}
            <div className={styles.inviteCard}>
              <div className={styles.inviteIcon}>🎁</div>
              <div className={styles.inviteText}>
                <strong>Invite friends, earn rewards!</strong>
                <p>Get 200 XP for each friend who joins</p>
              </div>
              <button className={styles.inviteButton}>Invite</button>
            </div>
          </div>
        )}

        {activeSection === "records" && (
          <div className={styles.recordsSection}>
            {/* Personal Bests */}
            <div className={styles.personalBests}>
              <h4 className={styles.bestsTitle}>Personal Bests</h4>
              <div className={styles.bestsGrid}>
                {[
                  { label: "Highest Score", value: mockRetentionData.personalBests.highestScore, icon: "🏆" },
                  { label: "Fastest Snap", value: `${mockRetentionData.personalBests.fastestSnap}s`, icon: "⚡" },
                  { label: "Perfect Games", value: mockRetentionData.personalBests.perfectGames, icon: "💯" },
                  { label: "Win Streak", value: mockRetentionData.personalBests.longestWinStreak, icon: "🔥" },
                  { label: "Best Round", value: mockRetentionData.personalBests.mostPointsInRound, icon: "⭐" },
                  { label: "Best Accuracy", value: `${mockRetentionData.personalBests.bestAccuracy}%`, icon: "🎯" },
                ].map((record, i) => (
                  <div key={i} className={styles.bestCard}>
                    <div className={styles.bestIcon}>{record.icon}</div>
                    <div className={styles.bestValue}>{record.value}</div>
                    <div className={styles.bestLabel}>{record.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Near Misses - Motivational */}
            <div className={styles.nearMisses}>
              <h4 className={styles.nearMissTitle}>So Close! 💪</h4>
              <p className={styles.nearMissSubtitle}>These near-misses show you&apos;re on the edge of greatness</p>
              <div className={styles.nearMissList}>
                <div className={styles.nearMissItem}>
                  <div className={styles.nearMissIcon}>🎯</div>
                  <div className={styles.nearMissInfo}>
                    <strong>{mockRetentionData.nearMisses.almostPerfectGames} almost-perfect games</strong>
                    <span>Just one wrong answer away from perfection!</span>
                  </div>
                </div>
                <div className={styles.nearMissItem}>
                  <div className={styles.nearMissIcon}>🔥</div>
                  <div className={styles.nearMissInfo}>
                    <strong>{mockRetentionData.nearMisses.oneAwayFromStreak} times one away from a longer streak</strong>
                    <span>You&apos;re building consistency!</span>
                  </div>
                </div>
                <div className={styles.nearMissItem}>
                  <div className={styles.nearMissIcon}>⚔️</div>
                  <div className={styles.nearMissInfo}>
                    <strong>{mockRetentionData.nearMisses.narrowLosses} narrow losses</strong>
                    <span>Close games mean you&apos;re competitive!</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comeback Stats */}
            <div className={styles.comebackStats}>
              <h4 className={styles.comebackTitle}>Comeback King 👑</h4>
              <div className={styles.comebackGrid}>
                <div className={styles.comebackStat}>
                  <div className={styles.comebackValue}>{mockRetentionData.comebackStats.biggestComeback}</div>
                  <div className={styles.comebackLabel}>Biggest Point Comeback</div>
                </div>
                <div className={styles.comebackStat}>
                  <div className={styles.comebackValue}>{mockRetentionData.comebackStats.comebackWins}</div>
                  <div className={styles.comebackLabel}>Comeback Wins</div>
                </div>
                <div className={styles.comebackStat}>
                  <div className={styles.comebackValue}>{mockRetentionData.comebackStats.winRateAfterLoss}%</div>
                  <div className={styles.comebackLabel}>Win Rate After a Loss</div>
                </div>
              </div>
              <div className={styles.comebackMessage}>
                You bounce back strong! Your resilience is above average.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
