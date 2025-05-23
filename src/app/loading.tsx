"use client";

import { useEffect, useRef, useState } from "react";
import LoadingGrid from "./components/loading-grid";
import styles from "./loading.module.css";

const Progress = () => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("INITIALIZING");
  const cassetteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 10) + 1;
      });
    }, 300);

    // Change loading text periodically
    const texts = [
      "INITIALIZING",
      "LOADING DATA",
      "REWINDING TAPE",
      "TUNING FREQUENCY",
      "ADJUSTING TRACKING",
      "SYNCING BEATS",
      "CHARGING FLUX",
      "BOOTING UP",
    ];

    let textIndex = 0;
    const textInterval = setInterval(() => {
      textIndex = (textIndex + 1) % texts.length;
      setLoadingText(texts[textIndex]);
    }, 1500);

    // Animate cassette rotation
    if (cassetteRef.current) {
      const cassette = cassetteRef.current;
      let rotation = 0;

      const rotateCassette = () => {
        rotation += 1;
        cassette.style.transform = `rotate(${rotation}deg)`;
        requestAnimationFrame(rotateCassette);
      };

      requestAnimationFrame(rotateCassette);
    }

    return () => {
      clearInterval(interval);
      clearInterval(textInterval);
    };
  }, []);

  return (
    <div className={styles.loadingContainer}>
      <div className={styles.scanlines}></div>

      <div className={styles.cassetteContainer}>
        <div className={styles.cassette}>
          <div className={styles.cassetteBody}>
            <div className={styles.cassetteLabel}>
              <span>RETRO QUIZ</span>
              <span className={styles.side}>A-SIDE</span>
            </div>
            <div className={styles.cassetteSpool} ref={cassetteRef}>
              <div className={styles.spoolHole}></div>
              <div className={styles.spoolHole}></div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.loadingTextContainer}>
        <div className={styles.loadingText}>
          <span className={styles.neonText}>{loadingText}</span>
        </div>

        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className={styles.progressText}>{progress}%</div>
        </div>
      </div>
      <LoadingGrid />
    </div>
  );
};

export default Progress;
