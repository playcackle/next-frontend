"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

interface PerformanceContextType {
  performanceMode: boolean;
  setPerformanceMode: (enabled: boolean) => void;
  reducedMotion: boolean;
}

const PerformanceContext = createContext<PerformanceContextType>({
  performanceMode: false,
  setPerformanceMode: () => {},
  reducedMotion: false,
});

export function PerformanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [performanceMode, setPerformanceModeState] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem("performanceMode");
    if (saved !== null) {
      setPerformanceModeState(saved === "true");
    }

    // Check system preference for reduced motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    // Auto-enable performance mode if user prefers reduced motion
    if (mediaQuery.matches && saved === null) {
      setPerformanceModeState(true);
    }

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Apply performance mode class to body
  useEffect(() => {
    if (performanceMode) {
      document.body.classList.add("performance-mode");
    } else {
      document.body.classList.remove("performance-mode");
    }
  }, [performanceMode]);

  const setPerformanceMode = (enabled: boolean) => {
    setPerformanceModeState(enabled);
    localStorage.setItem("performanceMode", enabled.toString());
  };

  return (
    <PerformanceContext.Provider
      value={{ performanceMode, setPerformanceMode, reducedMotion }}
    >
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  return useContext(PerformanceContext);
}
