export type PerformanceTier = "low" | "medium" | "high";

export function getPerformanceTier(): PerformanceTier {
  if (typeof window === "undefined") return "high";

  // Use multiple signals
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4;

  // Check actual rendering performance

  if (cores <= 2 || memory < 2) return "low";
  if (cores <= 4 || memory < 4) return "medium";
  return "high";
}

export function getPerformanceRecommendation(tier: PerformanceTier): boolean {
  // Returns true if performance mode should be enabled
  return tier === "low" || tier === "medium";
}

export function getTierDescription(tier: PerformanceTier): string {
  switch (tier) {
    case "low":
      return "Your device has limited resources. We strongly recommend enabling Performance Mode for the best experience.";
    case "medium":
      return "Your device has moderate resources. We recommend enabling Performance Mode to prevent potential lag.";
    case "high":
      return "Your device has great resources! You can enjoy all visual effects, but you can still enable Performance Mode if you prefer.";
  }
}

export function getTierSpecs(_tier?: PerformanceTier): string {
  const memory = (navigator as any).deviceMemory;
  const cores = navigator.hardwareConcurrency;
  return `Detected: ${memory || "Unknown"} GB RAM, ${
    cores || "Unknown"
  } CPU cores`;
}
