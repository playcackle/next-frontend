import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// Key for localStorage
const PERFORMANCE_STORAGE_KEY = "triviabox-performance-mode";
const PERFORMANCE_CONFIGURED_KEY = "triviabox-performance-configured";

// Atom to track if user has configured performance settings
export const performanceConfiguredAtom = atomWithStorage<boolean>(
  PERFORMANCE_CONFIGURED_KEY,
  false
);

// Main performance mode atom with localStorage persistence
export const performanceModeAtom = atomWithStorage<boolean>(
  PERFORMANCE_STORAGE_KEY,
  false
);

// Derived atom to check if we should show the modal
export const showPerformanceModalAtom = atom((get) => {
  const isConfigured = get(performanceConfiguredAtom);
  return !isConfigured;
});

// Action atom to set performance preference and mark as configured
export const setPerformancePreferenceAtom = atom(
  null,
  (get, set, enabled: boolean) => {
    set(performanceModeAtom, enabled);
    set(performanceConfiguredAtom, true);

    // Apply class to body
    if (typeof window !== "undefined") {
      if (enabled) {
        document.body.classList.add("performance-mode");
      } else {
        document.body.classList.remove("performance-mode");
      }
    }
  }
);

