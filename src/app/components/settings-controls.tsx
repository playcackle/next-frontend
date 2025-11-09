"use client";

import React from "react";
import CRTEffect from "./crt-effect";
import BackgroundMusic from "./background-music";
import styles from "./settings-controls.module.css"; // We'll create this CSS module

interface SettingsControlsProps {
  musicSrc: string;
}

const SettingsControls: React.FC<SettingsControlsProps> = ({ musicSrc }) => {
  return (
    <div className={styles.settingsContainer}>
      <CRTEffect />
      <BackgroundMusic src={musicSrc} />
    </div>
  );
};

export default SettingsControls;
