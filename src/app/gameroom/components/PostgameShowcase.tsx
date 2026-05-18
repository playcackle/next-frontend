"use client";

import {
  AlertCircle,
  Award,
  BadgeCheck,
  Crosshair,
  Flame,
  Target,
  Timer,
  TrendingUp,
  type LucideIcon,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import { scoresAtom, playerAccoladesAtom } from "../store/gameAtoms";
import type { PlayerAccolade } from "../types/payloads";
import styles from "./PostgameShowcase.module.css";

const ACCOLADE_ICONS: Record<string, LucideIcon> = {
  speed_demon: Zap,
  first_blood: Crosshair,
  precision: Target,
  perfectionist: BadgeCheck,
  machine_gun: Zap,
  snapping_spree: Flame,
  hot_streak: TrendingUp,
  clutch_player: Timer,
  sniper: Crosshair,
  close_call: AlertCircle,
};

// Human-readable labels and descriptions for each accolade type
const ACCOLADE_META: Record<string, { title: string; description: string }> = {
  speed_demon: {
    title: "Speed Demon",
    description: "Answered with blazing speed across multiple rounds.",
  },
  first_blood: {
    title: "First Blood",
    description: "First to snap an answer in the round.",
  },
  precision: {
    title: "Precision",
    description: "Consistently snapped correct answers without misses.",
  },
  perfectionist: {
    title: "Perfectionist",
    description: "Flawless performance — no wrong answers submitted.",
  },
  machine_gun: {
    title: "Machine Gun",
    description: "Submitted the highest volume of answers.",
  },
  snapping_spree: {
    title: "Snapping Spree",
    description: "On an unstoppable snapping streak.",
  },
  hot_streak: {
    title: "Hot Streak",
    description: "Kept momentum going round after round.",
  },
  clutch_player: {
    title: "Clutch Player",
    description: "Delivered when the pressure was highest.",
  },
  sniper: {
    title: "Sniper",
    description: "Locked on and never missed the target.",
  },
  close_call: {
    title: "Close Call",
    description: "Barely made it — but still got the snap.",
  },
};

interface ShowcaseSlide {
  accolade_type: string;
  title: string;
  description: string;
  display_name: string;
  count: number;
}

const AUTO_ADVANCE_MS = 3500;

export default function PostgameShowcase() {
  const scores = useAtomValue(scoresAtom);
  const playerAccolades = useAtomValue(playerAccoladesAtom);

  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  // Build lookup map: player_id -> PlayerAccolades
  const playerIdToAccolades = useMemo(() => {
    const map = new Map<string, PlayerAccolade>();
    playerAccolades.forEach((pa) => map.set(pa.player_id, pa));
    return map;
  }, [playerAccolades]);

  // Cast scores to include rank
  const rankedScores = scores as Array<{
    player_id: string;
    display_name: string;
    score: number;
    rank?: number;
  }>;

  // Build flat list of slides: one per (player, accolade_type) combination
  const slides = useMemo<ShowcaseSlide[]>(() => {
    const result: ShowcaseSlide[] = [];
    rankedScores.forEach((player) => {
      const pa = playerIdToAccolades.get(player.player_id);
      if (!pa) return;
      Object.entries(pa.accolades_count).forEach(([accolade_type, count]) => {
        if (count <= 0) return;
        const meta = ACCOLADE_META[accolade_type];
        result.push({
          accolade_type,
          title: meta?.title ?? accolade_type,
          description: meta?.description ?? "",
          display_name: player.display_name,
          count,
        });
      });
    });
    return result;
  }, [rankedScores, playerIdToAccolades]);

  const total = slides.length;

  // Auto-advance
  useEffect(() => {
    if (total <= 1) return;
    const timer = setInterval(() => {
      goNext();
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, total]);

  const goTo = (index: number) => {
    if (animating || index === current) return;
    setDirection(index > current ? "next" : "prev");
    setAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setAnimating(false);
    }, 300);
  };

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

  if (total === 0) return null;

  const slide = slides[current];
  const IconComponent = ACCOLADE_ICONS[slide.accolade_type] ?? Award;

  return (
    <div className={styles.container}>
      <p className={styles.label}>Postgame Awards</p>

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
          className={`${styles.card} ${animating ? (direction === "next" ? styles.exitLeft : styles.exitRight) : styles.enter}`}
        >
          <div className={styles.iconWrapper}>
            <IconComponent size={28} aria-hidden="true" />
          </div>

          <div className={styles.cardBody}>
            <p className={styles.cardTitle}>{slide.title}</p>
            <p className={styles.cardDescription}>{slide.description}</p>
            <p className={styles.cardPlayer}>{slide.display_name}</p>
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
