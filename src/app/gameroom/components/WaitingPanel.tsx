"use client";

import { PlayerCategoryStatsResponse, playersApi } from "@/lib/api/players";
import { useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";
import {
  minPlayersNeededAtom,
  playerCountAtom,
  scoresAtom,
} from "../store/gameAtoms";
import { Score } from "../types/state";
import styles from "./WaitingPanel.module.css";

// ─── Tips ────────────────────────────────────────────────────────────────────

const TIPS = [
  {
    tag: "RARE SLOT",
    color: "purple",
    text: "Purple slots are rare answers worth extra points. Hunt them down or let someone else get humiliated trying.",
  },
  {
    tag: "SPEED",
    color: "pink",
    text: "First correct answer claims the slot. Two people can type the same thing — only the faster idiot wins.",
  },
  {
    tag: "NEAR MISS",
    color: "blue",
    text: "BotBob tracks how close your wrong answers were. Some of them are almost impressively bad.",
  },
  {
    tag: "SNIPING",
    color: "green",
    text: "If a slot gets snatched right as you type — that's a snipe. It happens. It hurts. Get over it.",
  },
  {
    tag: "ROUND BREAK",
    color: "purple",
    text: "Between rounds you'll see what was missed. Use that time to feel bad about yourself and prepare better.",
  },
  {
    tag: "ACCURACY",
    color: "pink",
    text: "Spam guessing lowers your accuracy rating. Quality over quantity. Unless you're panicking. Then panic.",
  },
  {
    tag: "TOPIC HINT",
    color: "blue",
    text: "Read the example answer carefully. The category is broader than you think — or way more specific. Good luck.",
  },
  {
    tag: "LEADERBOARD",
    color: "green",
    text: "Points compound across rounds. A slow start can be recovered. A catastrophic start probably cannot.",
  },
];

// ─── Trash talk generator ─────────────────────────────────────────────────────

function generateTrashTalk(
  player: Score,
  categoryStats: PlayerCategoryStatsResponse | null,
  isCurrentUser: boolean,
): string {
  debugger;
  const name = isCurrentUser ? "You" : player.display_name;
  const pronoun = isCurrentUser ? "your" : "their";
  const pronoun2 = isCurrentUser ? "you" : "they";

  if (!categoryStats || categoryStats.categories.length === 0) {
    const fallbacks = [
      `${name} have no category stats. A true blank slate. Or just bad at everything equally.`,
      `No historical data for ${name === "You" ? "you" : player.display_name}. Fresh meat. Let's see how long that lasts.`,
      `${name === "You" ? "You're" : `${player.display_name} is`} an unknown quantity. Statistically speaking, probably not great.`,
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  const weakest = categoryStats.weakest_accuracy_category;
  const bestCat = categoryStats.best_accuracy_category;
  const mostPlayed = categoryStats.most_played_category;

  const weakestStat = categoryStats.categories.find(
    (c) => c.category_name === weakest,
  );
  const bestStat = categoryStats.categories.find(
    (c) => c.category_name === bestCat,
  );

  const taunts: string[] = [];

  if (weakest && weakestStat) {
    const acc =
      weakestStat.accuracy != null ? `${weakestStat.accuracy}%` : "unknown";
    taunts.push(
      `${name} historically choke on "${weakest}" with a ${acc} accuracy. Prepare to watch ${pronoun2} suffer.`,
      `${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} worst category is "${weakest}". ${acc} accuracy. Just... embarrassing.`,
    );
  }

  if (bestCat && bestStat && bestStat !== weakestStat) {
    const acc = bestStat.accuracy != null ? `${bestStat.accuracy}%` : "decent";
    taunts.push(
      `${name === "You" ? "Your" : `${player.display_name}'s`} only decent category is "${bestCat}" at ${acc}. One trick pony.`,
    );
  }

  if (mostPlayed && mostPlayed === weakest) {
    taunts.push(
      `${name} play "${mostPlayed}" the most — and ${pronoun2}'re still terrible at it. Respect for the commitment, I guess.`,
    );
  }

  const totalGames = categoryStats.categories.reduce(
    (sum, c) => sum + c.rounds_played,
    0,
  );
  if (totalGames > 0 && totalGames < 5) {
    taunts.push(
      `${name} have only played ${totalGames} round${totalGames === 1 ? "" : "s"}. A genuine newcomer. Bless.`,
    );
  } else if (totalGames >= 20 && weakest) {
    taunts.push(
      `${totalGames} rounds played and "${weakest}" is still ${pronoun} Achilles heel. At what point do ${pronoun2} just… not pick that category?`,
    );
  }

  if (taunts.length === 0) {
    return `${name} look suspiciously average. Do not trust ${pronoun2}.`;
  }

  return taunts[Math.floor(Math.random() * taunts.length)];
}

// ─── Avatar initials color ────────────────────────────────────────────────────

const AVATAR_COLORS = ["#ff00aa", "#b700ff", "#00ddff", "#00ff66", "#ff6600"];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Player Card ──────────────────────────────────────────────────────────────

interface PlayerCardProps {
  player: Score;
  isCurrentUser: boolean;
  entryDelay: number;
}

function PlayerCard({ player, isCurrentUser, entryDelay }: PlayerCardProps) {
  const [categoryStats, setCategoryStats] =
    useState<PlayerCategoryStatsResponse | null>(null);
  const [taunt, setTaunt] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const stats = await playersApi.getCategoryStats(player.player_id);
        if (!cancelled) {
          setCategoryStats(stats);
          setTaunt(generateTrashTalk(player, stats, isCurrentUser));
          setLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setTaunt(generateTrashTalk(player, null, isCurrentUser));
          setLoaded(true);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [player.player_id, isCurrentUser]);

  const initials = player.display_name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const color = avatarColor(player.display_name);

  return (
    <div
      className={`${styles.playerCard} ${isCurrentUser ? styles.selfCard : ""}`}
      style={{ animationDelay: `${entryDelay}ms` }}
    >
      <div className={styles.cardHeader}>
        <div
          className={styles.avatar}
          style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}88` }}
        >
          {initials}
        </div>
        <div className={styles.playerMeta}>
          <span className={styles.playerName}>
            {player.display_name}
            {isCurrentUser && <span className={styles.youBadge}>YOU</span>}
          </span>
          {categoryStats && (
            <span className={styles.playerStats}>
              {categoryStats.most_played_category
                ? `fav: ${categoryStats.most_played_category}`
                : "no data"}
            </span>
          )}
        </div>
        {categoryStats?.weakest_accuracy_category && (
          <div className={styles.weakBadge}>
            weak at {categoryStats.weakest_accuracy_category}
          </div>
        )}
      </div>
      <p className={`${styles.taunt} ${loaded ? styles.tauntVisible : ""}`}>
        {loaded ? taunt : "analyzing stats..."}
      </p>
    </div>
  );
}

// ─── Tip Carousel ─────────────────────────────────────────────────────────────

function TipCarousel() {
  const [index, setIndex] = useState(0);
  const [exiting, setExiting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const advance = (dir: 1 | -1 = 1) => {
    setExiting(true);
    setTimeout(() => {
      setIndex((i) => (i + dir + TIPS.length) % TIPS.length);
      setExiting(false);
    }, 300);
  };

  useEffect(() => {
    intervalRef.current = setInterval(() => advance(1), 6000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const tip = TIPS[index];

  return (
    <div className={styles.carousel}>
      <div className={styles.carouselHeader}>
        <span className={styles.carouselLabel}>// PRE-GAME INTEL</span>
        <div className={styles.carouselControls}>
          <button
            className={styles.carouselBtn}
            onClick={() => {
              if (intervalRef.current) clearInterval(intervalRef.current);
              advance(-1);
              intervalRef.current = setInterval(() => advance(1), 6000);
            }}
            aria-label="Previous tip"
          >
            {"<"}
          </button>
          <span className={styles.carouselDots}>
            {TIPS.map((_, i) => (
              <span
                key={i}
                className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
              />
            ))}
          </span>
          <button
            className={styles.carouselBtn}
            onClick={() => {
              if (intervalRef.current) clearInterval(intervalRef.current);
              advance(1);
              intervalRef.current = setInterval(() => advance(1), 6000);
            }}
            aria-label="Next tip"
          >
            {">"}
          </button>
        </div>
      </div>
      <div
        className={`${styles.tipSlide} ${exiting ? styles.tipExit : styles.tipEnter}`}
      >
        <span className={styles.tipTag} data-color={tip.color}>
          {tip.tag}
        </span>
        <p className={styles.tipText}>{tip.text}</p>
      </div>
    </div>
  );
}

// ─── Main WaitingPanel ────────────────────────────────────────────────────────

interface WaitingPanelProps {
  currentUserId: string | null;
}

export default function WaitingPanel({ currentUserId }: WaitingPanelProps) {
  const scores = useAtomValue(scoresAtom);
  const playerCount = useAtomValue(playerCountAtom);
  const minPlayersNeeded = useAtomValue(minPlayersNeededAtom);
  const missingPlayers = Math.max(0, minPlayersNeeded - playerCount);

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.panelHeader}>
        <p className={styles.waitingTitle}>
          {missingPlayers === 0 ? "LFG!!!1!!!!" : "Waiting for more idiots"}
        </p>
        {missingPlayers > 0 && (
          <p className={styles.waitingCount}>
            <span className={styles.missingNum}>{missingPlayers}</span> still
            missing
          </p>
        )}
      </div>

      {/* Player roster */}
      {scores.length > 0 && (
        <div className={styles.rosterSection}>
          <span className={styles.sectionLabel}>// CURRENT SUSPECTS</span>
          <div className={styles.roster}>
            {scores.map((player, i) => (
              <PlayerCard
                key={player.player_id}
                player={player}
                isCurrentUser={player.player_id === currentUserId}
                entryDelay={i * 80}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tips carousel */}
      <TipCarousel />
    </div>
  );
}
