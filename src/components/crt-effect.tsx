"use client";

import { performanceModeAtom } from "@/atoms/performance-atom";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import styles from "./settings-controls.module.css";

export default function CRTEffect() {
  const [isCRTEnabled, setIsCRTEnabled] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const performanceMode = useAtomValue(performanceModeAtom);

  useEffect(() => {
    const storedPreference = localStorage.getItem("crtEffect");
    if (storedPreference !== null) {
      setIsCRTEnabled(storedPreference === "true");
    }

    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const toggleCRTEffect = () => {
    const newState = !isCRTEnabled;
    setIsCRTEnabled(newState);
    localStorage.setItem("crtEffect", newState.toString());
  };

  const isActive = isCRTEnabled && !performanceMode;

  return (
    <>
      {isActive && (
        <div className={`crt-overlay ${isInitialLoad ? "crt-turn-on" : ""}`}>
          <div className="crt-scanlines"></div>
          <div className="crt-flicker"></div>
          <div className="crt-vignette"></div>
        </div>
      )}
      <button
        className={`${styles.toggleButton} ${isActive ? styles.active : ""}`}
        onClick={toggleCRTEffect}
        disabled={performanceMode}
        title={performanceMode ? "Disabled in Performance Mode" : ""}
      >
        {performanceMode ? "Off" : isActive ? "On" : "Off"}
      </button>
    </>
  );
}
