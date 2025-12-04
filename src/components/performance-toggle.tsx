"use client";

import { performanceModeAtom } from "@/atoms/performance-atom";
import { useAtom } from "jotai";
import styles from "./settings-controls.module.css";

export default function PerformanceToggle() {
  const [performanceMode, setPerformanceMode] = useAtom(performanceModeAtom);

  const handleToggle = () => {
    const newValue = !performanceMode;
    setPerformanceMode(newValue);

    if (newValue) {
      document.body.classList.add("performance-mode");
    } else {
      document.body.classList.remove("performance-mode");
    }
  };

  return (
    <button
      className={`${styles.toggleButton} ${
        performanceMode ? styles.active : ""
      }`}
      onClick={handleToggle}
      title="Toggle low performance mode for better experience on older devices"
    >
      {performanceMode ? "On" : "Off"}
    </button>
  );
}
