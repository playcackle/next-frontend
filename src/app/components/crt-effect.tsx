"use client";

import { useEffect, useState } from "react";
import styles from "./settings-controls.module.css"; // Import the CSS module

export default function CRTEffect() {
  const [isCRTEnabled, setIsCRTEnabled] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Check if CRT effect preference is stored in localStorage
    const storedPreference = localStorage.getItem("crtEffect");
    if (storedPreference !== null) {
      setIsCRTEnabled(storedPreference === "true");
    }

    // Set initial load to false after a short delay
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

  if (!isCRTEnabled) {
    return (
      <button className={styles["crt-toggle"]} onClick={toggleCRTEffect}>
        Enable CRT Effect
      </button>
    );
  }

  return (
    <>
      <div className={`crt-overlay ${isInitialLoad ? "crt-turn-on" : ""}`}>
        <div className="crt-scanlines"></div>
        <div className="crt-flicker"></div>
        <div className="crt-vignette"></div>
      </div>
      <button className={styles["crt-toggle"]} onClick={toggleCRTEffect}>
        Disable CRT Effect
      </button>
    </>
  );
}
