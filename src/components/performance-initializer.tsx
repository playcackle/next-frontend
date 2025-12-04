"use client";

import {
  performanceConfiguredAtom,
  performanceModeAtom,
} from "@/atoms/performance-atom";
import { useAtomValue } from "jotai";
import { useEffect } from "react";

/**
 * Initializes performance mode class on body element
 * This runs on every page load to ensure the class is applied
 */
export function PerformanceInitializer() {
  const performanceMode = useAtomValue(performanceModeAtom);
  const isConfigured = useAtomValue(performanceConfiguredAtom);

  useEffect(() => {
    if (isConfigured) {
      if (performanceMode) {
        document.body.classList.add("performance-mode");
      } else {
        document.body.classList.remove("performance-mode");
      }
    }
  }, [performanceMode, isConfigured]);

  return null;
}
