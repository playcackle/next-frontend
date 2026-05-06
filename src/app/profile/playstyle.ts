import type { PlayerPlaystyleProfile } from "@/lib/api/players";

export const EMPTY_PLAYSTYLE_PROFILE: PlayerPlaystyleProfile = {
  archetype: "All-Round Operator",
  summary: "Play more games to shape your playstyle.",
  dimensions: [
    { key: "speed", label: "Speed", raw: 0, normalized: 0 },
    { key: "precision", label: "Precision", raw: 0, normalized: 0 },
    { key: "pressure", label: "Pressure", raw: 0, normalized: 0 },
    { key: "clutch", label: "Clutch", raw: 0, normalized: 0 },
    { key: "opportunism", label: "Opportunism", raw: 0, normalized: 0 },
  ],
  top_traits: [],
  total_accolades: 0,
};
