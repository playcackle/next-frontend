"use client";

import { Settings, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import BackgroundMusic from "./background-music";
import CRTEffect from "./crt-effect";
import PerformanceToggle from "./performance-toggle";
import styles from "./settings-controls.module.css";

interface SettingsControlsProps {
  musicSrc: string;
}

const SettingsControls: React.FC<SettingsControlsProps> = ({ musicSrc }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={styles.settingsWrapper}>
      <button
        className={styles.settingsToggle}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label={isExpanded ? "Close settings" : "Open settings"}
      >
        {isExpanded ? <X size={18} /> : <Settings size={18} />}
      </button>

      <div
        className={`${styles.settingsPanel} ${
          isExpanded ? styles.expanded : ""
        }`}
      >
        <div className={styles.settingsHeader}>
          <span className={styles.settingsTitle}>Settings</span>
        </div>

        <div className={styles.settingsContent}>
          <div className={styles.settingItem}>
            <span className={styles.settingLabel}>Low Performance</span>
            <PerformanceToggle />
          </div>

          <div className={styles.settingItem}>
            <span className={styles.settingLabel}>CRT Effect</span>
            <CRTEffect />
          </div>

          <div className={styles.settingItem}>
            <span className={styles.settingLabel}>Music</span>
            <BackgroundMusic src={musicSrc} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsControls;
