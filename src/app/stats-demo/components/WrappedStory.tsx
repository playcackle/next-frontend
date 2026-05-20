"use client";

import { ChevronRight, Hand, PartyPopper, Share2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import styles from "./WrappedStory.module.css";

interface StorySlide {
  id: string;
  type: "intro" | "stat" | "category" | "achievement" | "identity" | "outro";
  title: string;
  value?: string | number;
  subtitle?: string;
  highlight?: string;
  emoji?: string;
}

interface WrappedStoryProps {
  playerName: string;
  stats: {
    total_score: number;
    games_played: number;
    total_slots_snapped: number;
    overall_accuracy: number;
    rare_claims: number;
    average_score_per_game: number;
  };
  topCategory: { name: string; score: number; gamesPlayed: number };
  playStyle: string;
  onClose: () => void;
}

export function WrappedStory({
  playerName,
  stats,
  topCategory,
  playStyle,
  onClose,
}: WrappedStoryProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides: StorySlide[] = [
    {
      id: "intro",
      type: "intro",
      title: `Hey ${playerName}`,
      subtitle: "Ready to see your Cackle journey?",
    },
    {
      id: "games",
      type: "stat",
      title: "You played",
      value: stats.games_played,
      subtitle: "games this season",
      highlight: "That's a lot of snapping!",
    },
    {
      id: "slots",
      type: "stat",
      title: "You snapped",
      value: stats.total_slots_snapped,
      subtitle: "total slots",
      highlight: "Quick reflexes!",
    },
    {
      id: "score",
      type: "stat",
      title: "Total score",
      value: stats.total_score,
      subtitle: "points earned",
      highlight: "Impressive!",
    },
    {
      id: "accuracy",
      type: "stat",
      title: "Accuracy",
      value: `${stats.overall_accuracy.toFixed(1)}%`,
      subtitle: "of your snaps were correct",
      highlight:
        stats.overall_accuracy >= 75 ? "Sharpshooter!" : "Room to grow!",
    },
    {
      id: "category",
      type: "category",
      title: "Your top category",
      value: topCategory.name,
      subtitle: `${topCategory.score} points in ${topCategory.gamesPlayed} games`,
      highlight: "Your specialty!",
    },
    {
      id: "rare",
      type: "stat",
      title: "Rare claims",
      value: stats.rare_claims,
      subtitle: "legendary snaps",
      highlight: "Collector's instinct!",
    },
    {
      id: "identity",
      type: "identity",
      title: "You are...",
      value: playStyle,
      subtitle: "Your unique play style",
    },
    {
      id: "outro",
      type: "outro",
      title: "Keep snapping!",
      subtitle: "Share your stats with friends",
    },
  ];

  const goToNext = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
      setAnimatedValue(0);
    }
  }, [currentSlide, slides.length]);

  const goToPrev = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
      setAnimatedValue(0);
    }
  }, [currentSlide]);

  // Auto-advance timer
  useEffect(() => {
    if (isPaused) return;

    const timer = setTimeout(() => {
      if (currentSlide < slides.length - 1) {
        goToNext();
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [currentSlide, isPaused, slides.length, goToNext]);

  // Animated counter effect
  useEffect(() => {
    const slide = slides[currentSlide];
    if (slide.type === "stat" && typeof slide.value === "number") {
      const target = slide.value;
      const duration = 1500;
      const steps = 60;
      const increment = target / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setAnimatedValue(target);
          clearInterval(timer);
        } else {
          setAnimatedValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [currentSlide, slides]);

  const slide = slides[currentSlide];
  const progress = ((currentSlide + 1) / slides.length) * 100;

  const getSlideGradient = () => {
    const gradients = [
      "linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #0a1a3e 100%)",
      "linear-gradient(135deg, #1a0a2e 0%, #2a0a4e 50%, #1a1a4e 100%)",
      "linear-gradient(135deg, #0a1a3e 0%, #1a2a4e 50%, #0a2a4e 100%)",
      "linear-gradient(135deg, #2a0a3e 0%, #3a0a4e 50%, #2a1a4e 100%)",
      "linear-gradient(135deg, #1a1a4e 0%, #2a1a5e 50%, #1a2a5e 100%)",
      "linear-gradient(135deg, #0a2a4e 0%, #1a3a5e 50%, #0a3a5e 100%)",
      "linear-gradient(135deg, #3a0a4e 0%, #4a0a5e 50%, #3a1a5e 100%)",
      "linear-gradient(135deg, #2a1a4e 0%, #3a2a5e 50%, #2a2a5e 100%)",
      "linear-gradient(135deg, #1a2a5e 0%, #2a3a6e 50%, #1a3a6e 100%)",
    ];
    return gradients[currentSlide % gradients.length];
  };

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={styles.storyContainer}
        style={{ background: getSlideGradient() }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Progress bars */}
        <div className={styles.progressContainer}>
          {slides.map((_, idx) => (
            <div key={idx} className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width:
                    idx < currentSlide
                      ? "100%"
                      : idx === currentSlide
                        ? `${progress}%`
                        : "0%",
                  transition: idx === currentSlide ? "width 4s linear" : "none",
                }}
              />
            </div>
          ))}
        </div>

        {/* Close button */}
        <button className={styles.closeBtn} onClick={onClose}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Navigation zones */}
        <button
          className={`${styles.navZone} ${styles.navLeft}`}
          onClick={goToPrev}
          disabled={currentSlide === 0}
          aria-label="Previous slide"
        />
        <button
          className={`${styles.navZone} ${styles.navRight}`}
          onClick={goToNext}
          disabled={currentSlide === slides.length - 1}
          aria-label="Next slide"
        />

        {/* Slide content */}
        <div
          className={`${styles.slideContent} ${styles[`slide_${slide.type}`]}`}
        >
          {slide.type === "intro" && (
            <>
              <div className={styles.introEmoji}>
                <Hand size={48} />
              </div>
              <h1 className={styles.introTitle}>{slide.title}</h1>
              <p className={styles.introSubtitle}>{slide.subtitle}</p>
              <div className={styles.swipeHint}>
                <span>Tap to continue</span>
                <ChevronRight size={20} />
              </div>
            </>
          )}

          {slide.type === "stat" && (
            <>
              <span className={styles.statLabel}>{slide.title}</span>
              <div className={styles.statValue}>
                {typeof slide.value === "number"
                  ? animatedValue.toLocaleString()
                  : slide.value}
              </div>
              <span className={styles.statSubtitle}>{slide.subtitle}</span>
              {slide.highlight && (
                <div className={styles.highlight}>{slide.highlight}</div>
              )}
            </>
          )}

          {slide.type === "category" && (
            <>
              <span className={styles.categoryLabel}>{slide.title}</span>
              <div className={styles.categoryValue}>{slide.value}</div>
              <span className={styles.categorySubtitle}>{slide.subtitle}</span>
              <div className={styles.categoryBadge}>{slide.highlight}</div>
            </>
          )}

          {slide.type === "identity" && (
            <>
              <span className={styles.identityLabel}>{slide.title}</span>
              <div className={styles.identityValue}>{slide.value}</div>
              <span className={styles.identitySubtitle}>{slide.subtitle}</span>
              <div className={styles.identityGlow} />
            </>
          )}

          {slide.type === "outro" && (
            <>
              <div className={styles.outroIcon}>
                <PartyPopper size={48} />
              </div>
              <h1 className={styles.outroTitle}>{slide.title}</h1>
              <p className={styles.outroSubtitle}>{slide.subtitle}</p>
              <button className={styles.shareBtn}>
                <Share2 size={20} />
                Share Stats
              </button>
            </>
          )}
        </div>

        {/* Slide indicator */}
        <div className={styles.slideIndicator}>
          {currentSlide + 1} / {slides.length}
        </div>
      </div>
    </div>
  );
}
