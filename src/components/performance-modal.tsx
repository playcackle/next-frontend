"use client";

import {
  setPerformancePreferenceAtom,
  showPerformanceModalAtom,
} from "@/atoms/performance-atom";
import {
  getPerformanceRecommendation,
  getPerformanceTier,
  getTierDescription,
  getTierSpecs,
  type PerformanceTier,
} from "@/lib/performance-utils";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import styles from "./performance-modal.module.css";

export function PerformanceModal() {
  const showModal = useAtomValue(showPerformanceModalAtom);
  const setPreference = useSetAtom(setPerformancePreferenceAtom);
  const [tier, setTier] = useState<PerformanceTier>("high");
  const [specs, setSpecs] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const detectedTier = getPerformanceTier();
    setTier(detectedTier);
    setSpecs(getTierSpecs(detectedTier));
  }, []);

  // Don't render on server or if already configured
  if (!mounted || !showModal) return null;

  const recommended = getPerformanceRecommendation(tier);
  const description = getTierDescription(tier);

  const handleChoice = (enablePerformanceMode: boolean) => {
    setPreference(enablePerformanceMode);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.icon}>⚡</div>
          <h2 className={styles.title}>Performance Settings</h2>
        </div>

        <div className={styles.content}>
          <div className={styles.tierBadge} data-tier={tier}>
            {tier.toUpperCase()} TIER DEVICE
          </div>

          <p className={styles.specs}>{specs}</p>
          <p className={styles.description}>{description}</p>

          <div className={styles.comparison}>
            <div className={styles.option}>
              <h3>Full effects</h3>
              <ul>
                <li>Full CRT scanline effects</li>
                <li>All neon animations</li>
                <li>Blur & glow effects</li>
                <li>Best visual experience</li>
              </ul>
            </div>
            <div className={styles.option}>
              <h3>Low Performance Mode ON</h3>
              <ul>
                <li>Disabled CRT screen effects</li>
                <li>Reduced animations</li>
                <li>No blur effects</li>
                <li>Smoother gameplay</li>
              </ul>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={`${styles.button} ${styles.buttonSecondary} ${
              !recommended ? styles.recommended : ""
            }`}
            onClick={() => handleChoice(false)}
          >
            {!recommended && (
              <span className={styles.recommendedBadge}>Recommended</span>
            )}
            Full Effects
          </button>
          <button
            className={`${styles.button} ${styles.buttonPrimary} ${
              recommended ? styles.recommended : ""
            }`}
            onClick={() => handleChoice(true)}
          >
            {recommended && (
              <span className={styles.recommendedBadge}>Recommended</span>
            )}
            Low Performance Mode
          </button>
        </div>
      </div>
    </div>
  );
}
