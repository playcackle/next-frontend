"use client";
import styles from "./synthwave-background.module.css";

interface SynthwaveBackgroundProps {
  animated?: boolean;
}

export default function SynthwaveBackground({
  animated = false,
}: SynthwaveBackgroundProps) {
  return (
    <div className={styles.synthwaveContainer}>
      <div className={styles.sky}></div>
      <div className={styles.stars}></div>
      <div className={styles.sun}></div>
      <div className={animated ? styles.grid : styles.gridStatic}></div>
    </div>
  );
}
