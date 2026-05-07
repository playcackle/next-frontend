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

// ─── Primary taunt — weakest category, uses snaps + near_miss_rate ────────────

function generateTrashTalk(
  player: Score,
  categoryStats: PlayerCategoryStatsResponse | null,
  isCurrentUser: boolean,
): string {
  debugger;
  const name = isCurrentUser ? "You" : player.display_name;
  const pronoun2 = isCurrentUser ? "you" : "they";

  if (!categoryStats || categoryStats.categories.length === 0) {
    const fallbacks = [
      `${name} have no recorded history. Either brand new or too embarrassing to log.`,
      `No stats found for ${name === "You" ? "you" : player.display_name}. The database has nothing. That tracks.`,
      `${name === "You" ? "You're" : `${player.display_name} is`} statistically invisible. Not a flex.`,
      `${name} have managed to play this game without leaving a trace. Impressive in the worst way.`,
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  const weakest = categoryStats.weakest_accuracy_category;
  const mostPlayed = categoryStats.most_played_category;
  const weakestStat = categoryStats.categories.find(
    (c) => c.category_name === weakest,
  );

  const totalRounds = categoryStats.categories.reduce(
    (sum, c) => sum + c.rounds_played,
    0,
  );

  if (!weakest || !weakestStat) {
    if (totalRounds < 5) {
      return `${name} have played ${totalRounds} round${totalRounds === 1 ? "" : "s"}. Not enough data to roast properly. Give it time.`;
    }
    return `${name} somehow have no clear weak spot. Suspiciously mediocre across the board.`;
  }

  const snaps = weakestStat.successful_snaps;
  const nearMiss = weakestStat.near_miss_rate;
  const n = name;
  const dn = player.display_name;
  const snap =
    snaps === 0
      ? "zero successful snaps"
      : `only ${snaps} snap${snaps === 1 ? "" : "s"}`;
  const nm =
    nearMiss != null && nearMiss > 0 ? `, near-miss rate of ${nearMiss}` : "";
  const pos = isCurrentUser ? "your" : `${dn}'s`;

  const taunts: string[] = [
    `${n} are genuinely terrible at "${weakest}" — ${snap}${nm}. Statistically, ${pronoun2} should just skip it.`,
    `"${weakest}" is ${pos} graveyard. ${snap}${nm}. Keep showing up though.`,
    `${n} see "${weakest}" on the board and something dies inside — ${snap}${nm}.`,
    `${snap} in "${weakest}"${nm}. The data does not lie. ${n} might.`,
    `In "${weakest}", ${n} have contributed ${snap}${nm}. Remarkable in how little that is.`,
    `${snap}${nm} in "${weakest}". ${n} have had many chances. ${n} have wasted all of them.`,
    `"${weakest}" has seen ${n} fail ${snap}${nm}. The category remembers. ${n} apparently do not.`,
    `${n} enter "${weakest}" every time with the same energy and leave with ${snap}${nm}. The definition of insanity.`,
    `${snap}${nm} — that is ${pos} entire "${weakest}" resume. It is a short resume.`,
    `If "${weakest}" is on the board, look away from ${n}. ${snap}${nm}. It is not getting better.`,
  ];

  if (mostPlayed === weakest) {
    taunts.push(
      `"${weakest}" is ${pos} most played category. Also the worst one. ${snap}${nm}. Commitment to failure.`,
      `${n} keep coming back to "${weakest}" despite ${snap}${nm}. That is not confidence, that is delusion.`,
      `${n} have spent more time in "${weakest}" than anywhere else and have ${snap}${nm} to show for it. Inspiring.`,
    );
  }

  if (totalRounds >= 20) {
    taunts.push(
      `${totalRounds} rounds deep and "${weakest}" is still a disaster — ${snap}${nm}. Nothing is improving.`,
      `After ${totalRounds} rounds, "${weakest}" still has ${n} beat with ${snap}${nm}. Some people just never learn.`,
    );
  }

  return taunts[Math.floor(Math.random() * taunts.length)];
}

// ─── Secondary taunt — average score in weakest category ─────────────────────

function buildScoreTaunt(
  player: Score,
  categoryStats: PlayerCategoryStatsResponse | null,
  isCurrentUser: boolean,
): string | null {
  if (!categoryStats || categoryStats.categories.length === 0) return null;

  const weakest = categoryStats.weakest_accuracy_category;
  const weakestStat = categoryStats.categories.find(
    (c) => c.category_name === weakest,
  );
  if (!weakestStat || !weakest || weakestStat.average_score == null)
    return null;

  const avg = weakestStat.average_score;
  const n = isCurrentUser ? "You" : player.display_name;
  const pos = isCurrentUser ? "your" : `${player.display_name}'s`;
  const verb = isCurrentUser ? "are" : "is";

  // Below 200 = one or two slots per round at most
  if (avg < 200) {
    const taunts: string[] = [
      `${pos} average score in "${weakest}" is ${avg}. That is one slot. Maybe two on a good day. Barely showing up.`,
      `${avg} average in "${weakest}". ${n} ${verb} essentially a spectator in that category with extra steps.`,
      `"${weakest}": avg ${avg}. One slot a round if lucky. The leaderboard does not even notice ${n}.`,
      `${avg} per round in "${weakest}". At that rate ${n} ${verb} not competing — ${isCurrentUser ? "you're" : "they're"} decorating the scoreboard for everyone else.`,
      `Average of ${avg} in "${weakest}". That is a participation trophy masquerading as a score.`,
      `${n} average ${avg} points in "${weakest}". One answer. Sometimes zero. Truly doing the bare minimum.`,
      `"${weakest}" avg: ${avg}. ${n} ${verb} technically playing. The points suggest otherwise.`,
    ];
    return taunts[Math.floor(Math.random() * taunts.length)];
  }

  // 200–500 = decent but not threatening
  if (avg < 500) {
    const taunts: string[] = [
      `${avg} average in "${weakest}". A few slots per round. Respectable floor, unremarkable ceiling.`,
      `"${weakest}": avg ${avg}. Not embarrassing, not impressive. The beige of scores.`,
      `${n} average ${avg} in "${weakest}". Consistent. Consistently mediocre.`,
      `${avg} per round in "${weakest}". ${n} ${verb} always there. Never really a threat.`,
      `"${weakest}" avg ${avg}. Hovering around fine. No danger to anyone.`,
    ];
    return taunts[Math.floor(Math.random() * taunts.length)];
  }

  // 500+ = surprisingly decent for their worst category
  const taunts: string[] = [
    `${avg} average in "${weakest}" and it is still ${pos} worst category. That is either impressive or a sign the bar is very low everywhere else.`,
    `"${weakest}": avg ${avg}. For a supposed weak spot that is uncomfortably competent.`,
    `${n} average ${avg} in ${pos} weakest category. Whatever the strong ones look like must be insufferable.`,
  ];
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
  const [scoreTaunt, setScoreTaunt] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const stats = await playersApi.getCategoryStats(player.player_id);
        if (!cancelled) {
          setCategoryStats(stats);
          setTaunt(generateTrashTalk(player, stats, isCurrentUser));
          setScoreTaunt(buildScoreTaunt(player, stats, isCurrentUser));
          setLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setTaunt(generateTrashTalk(player, null, isCurrentUser));
          setScoreTaunt(null);
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
        <div className={styles.playerMeta}>
          <span className={styles.playerName}>
            {player.display_name}
            {isCurrentUser && <span className={styles.youBadge}>YOU</span>}
          </span>
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
          {missingPlayers === 0 ? "LFG!!!1!!!! " : "Waiting for more idiots, "}
          <span className={styles.missingNum}>{missingPlayers}</span> still
          missing
        </p>
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
