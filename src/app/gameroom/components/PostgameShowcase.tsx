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
import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { accoladesAtom } from "../store/gameAtoms";
import type { Accolade } from "../types/state";
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

const AUTO_ADVANCE_MS = 3500;

interface PostgameShowcaseProps {
  accolades?: Accolade[];
}

export default function PostgameShowcase({ accolades: propAccolades }: PostgameShowcaseProps) {
  const atomAccolades = useAtomValue(accoladesAtom);
  const accolades = propAccolades ?? atomAccolades;

  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  const total = accolades.length;

  // Auto-advance
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

  if (total === 0) return null;

  const accolade = accolades[current];
  const IconComponent = ACCOLADE_ICONS[accolade.accolade_type] ?? Award;

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
            <p className={styles.cardTitle}>{accolade.title}</p>
            <p className={styles.cardDescription}>{accolade.description}</p>
            <p className={styles.cardPlayer}>{accolade.player_display_name}</p>
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
          {accolades.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === current ? styles.dotActive : ""}`}
              onClick={() => {
                if (animating || i === current) return;
                setDirection(i > current ? "next" : "prev");
                setAnimating(true);
                setTimeout(() => {
                  setCurrent(i);
                  setAnimating(false);
                }, 300);
              }}
              aria-label={`Go to award ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
