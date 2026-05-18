"use client";

import { useAtomValue } from "jotai";
import {
  AlertCircle,
  Award,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Flame,
  Target,
  Timer,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { playerAccoladesAtom } from "../store/gameAtoms";
import type { PlayerAccolade } from "../types/payloads";
import styles from "./PostgameShowcase.module.css";

// ── Constants ────────────────────────────────────────────────────────────────

const COLORS = [
  "var(--neon-pink)",
  "var(--neon-green)",
  "var(--neon-purple)",
  "#00ddff",
  "#ff6600",
];

interface AccoladeMeta {
  title: string;
  description: string;
  icon: LucideIcon;
}

const ACCOLADE_LIST: Record<string, AccoladeMeta> = {
  speed_demon: {
    title: "Speed Demon",
    description: "Answered with blazing speed across multiple rounds.",
    icon: Zap,
  },
  first_blood: {
    title: "First Blood",
    description: "First to snap an answer in the round.",
    icon: Crosshair,
  },
  precision: {
    title: "Precision",
    description: "Consistently snapped correct answers without misses.",
    icon: Target,
  },
  perfectionist: {
    title: "Perfectionist",
    description: "Flawless performance — no wrong answers submitted.",
    icon: BadgeCheck,
  },
  machine_gun: {
    title: "Machine Gun",
    description: "Submitted the highest volume of answers.",
    icon: Zap,
  },
  snapping_spree: {
    title: "Snapping Spree",
    description: "On an unstoppable snapping streak.",
    icon: Flame,
  },
  hot_streak: {
    title: "Hot Streak",
    description: "Kept momentum going round after round.",
    icon: TrendingUp,
  },
  clutch_player: {
    title: "Clutch Player",
    description: "Delivered when the pressure was highest.",
    icon: Timer,
  },
  sniper: {
    title: "Sniper",
    description: "Locked on and never missed the target.",
    icon: Crosshair,
  },
  close_call: {
    title: "Close Call",
    description: "Barely made it — but still got the snap.",
    icon: AlertCircle,
  },
};

// ── Types ────────────────────────────────────────────────────────────────────

interface TopAccolade {
  player_id: string;
  display_name: string;
  score: number;
  top_accolade: string;
  top_count: number;
  color: string;
  accolade: AccoladeMeta | undefined;
}

// ── Helper ───────────────────────────────────────────────────────────────────

function getTopAccolades(players: PlayerAccolade[]): Array<TopAccolade> {
  return players.map((player) => {
    let topAccolade = "";
    let topCount = 0;

    for (const [accolade, count] of Object.entries(player.accolades_count)) {
      if (count > topCount) {
        topCount = count;
        topAccolade = accolade;
      }
    }

    return {
      player_id: player.player_id,
      display_name: player.display_name,
      score: player.score,
      top_accolade: topAccolade,
      top_count: topCount,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      accolade: ACCOLADE_LIST[topAccolade],
    };
  });
}

// ── Component ────────────────────────────────────────────────────────────────

const AUTO_ADVANCE_MS = 3500;

export default function PostgameShowcase() {
  const playerAccolades = useAtomValue(playerAccoladesAtom);

  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  const slides = useMemo<TopAccolade[]>(
    () => getTopAccolades(playerAccolades).filter((s) => s.top_accolade !== ""),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playerAccolades],
  );

  const total = slides.length;

  useEffect(() => {
    if (total <= 1) return;
    const timer = setInterval(() => {
      goNext();
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, total]);

  const goNext = () => {
    if (animating || total <= 1) return;
    setDirection("next");
    setAnimating(true);
    setTimeout(() => {
      setCurrent((c) => (c + 1) % total);
      setAnimating(false);
    }, 300);
  };

  const goPrev = () => {
    if (animating || total <= 1) return;
    setDirection("prev");
    setAnimating(true);
    setTimeout(() => {
      setCurrent((c) => (c - 1 + total) % total);
      setAnimating(false);
    }, 300);
  };

  const goTo = (index: number) => {
    if (animating || index === current) return;
    setDirection(index > current ? "next" : "prev");
    setAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setAnimating(false);
    }, 300);
  };

  if (total === 0) return null;

  const slide = slides[current];
  const IconComponent = slide.accolade?.icon ?? Award;

  return (
    <div className={styles.showcase}>
      <p className={styles.title}>Postgame Awards</p>

      <div className={styles.carouselRow}>
        {total > 1 && (
          <button
            className={styles.navButton}
            onClick={goPrev}
            aria-label="Previous award"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        <div
          className={`${styles.card} ${
            animating
              ? direction === "next"
                ? styles.exitLeft
                : styles.exitRight
              : styles.enter
          }`}
        >
          <div
            className={styles.iconWrapper}
            style={
              {
                "--accent": slide.color,
              } as React.CSSProperties
            }
          >
            <IconComponent size={26} aria-hidden="true" />
          </div>

          <div className={styles.cardBody}>
            <p className={styles.cardTitle}>
              {slide.accolade?.title ?? slide.top_accolade}
            </p>
            <p className={styles.cardDescription}>
              {slide.accolade?.description ?? ""}
            </p>
            <p className={styles.cardPlayer} style={{ color: slide.color }}>
              {slide.display_name}
            </p>
          </div>
        </div>

        {total > 1 && (
          <button
            className={styles.navButton}
            onClick={goNext}
            aria-label="Next award"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {total > 1 && (
        <div className={styles.dots}>
          {slides.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === current ? styles.dotActive : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Go to award ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
