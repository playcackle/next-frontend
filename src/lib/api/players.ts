/**
 * API client for player-related operations
 */

const apiFetch = (path: string, init?: RequestInit) => {
  const normalizedPath = path.startsWith("/players")
    ? path.substring("/players".length)
    : path;
  return fetch(`/api/players${normalizedPath}`, init);
};

const getErrorMessage = async (res: Response, fallback: string) => {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      const error = await res.json();
      return error.detail || error.error || fallback;
    } catch {
      return fallback;
    }
  }

  try {
    const text = await res.text();
    return text || fallback;
  } catch {
    return fallback;
  }
};

// ============================================================================
// Types
// ============================================================================

export type PlayerProfileStats = {
  // Basic Info
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  last_seen_active_at: string | null;

  // Aggregate Stats
  total_score: number;
  games_played: number;
  rounds_played: number;
  total_slots_snapped: number;

  // Computed Stats
  average_score_per_game: number;
  average_score_per_round: number;
  average_slots_per_game: number;
  average_slots_per_round: number;

  // Analytics Stats
  overall_accuracy: number | null;
  average_claim_rank: number | null;
  rare_claims: number | null;
  near_miss_count: number | null;
  near_miss_rate: number | null;
  avg_near_miss_similarity: number | null;
};

export type LeaderboardEntry = {
  rank: number;
  player_id: string;
  player_name: string;
  total_score: number;
  games_played: number;
  total_slots_snapped: number;
};

export type LeaderboardResponse = {
  entries: LeaderboardEntry[];
  total_players: number;
};

export type PlayerAccoladeSummary = {
  accolade_type: string;
  count: number;
};

export type PlayerAccoladeStats = {
  total_accolades: number;
  accolades_by_type: PlayerAccoladeSummary[];
  category_breakdown: Record<string, Record<string, number>> | null;
};

export type PlayerPlaystyleDimension = {
  key: string;
  label: string;
  raw: number;
  normalized: number;
};

export type PlayerPlaystyleProfile = {
  archetype: string;
  summary: string;
  dimensions: PlayerPlaystyleDimension[];
  top_traits: string[];
  total_accolades: number;
};

export type PlayerCategoryStat = {
  category_name: string;
  rounds_played: number;
  total_score: number;
  average_score: number | null;
  total_submissions: number;
  successful_snaps: number;
  accuracy: number | null;
  rare_claims: number;
  near_miss_rate: number | null;
};

export type PlayerCategoryStatsResponse = {
  most_played_category: string | null;
  best_accuracy_category: string | null;
  weakest_accuracy_category: string | null;
  highest_scoring_category: string | null;
  categories: PlayerCategoryStat[];
};

export type PlayerComparisonStat = {
  value: number | null;
  percentile: number | null;
  label: string | null;
};

export type PlayerComparisonsResponse = {
  total_score: PlayerComparisonStat;
  overall_accuracy: PlayerComparisonStat;
  total_accolades: PlayerComparisonStat;
  games_played: PlayerComparisonStat;
};

// ============================================================================
// Players API
// ============================================================================

export const playersApi = {
  /**
   * Get player profile with comprehensive statistics
   */
  async getProfile(playerId: string): Promise<PlayerProfileStats> {
    const res = await apiFetch(`/${playerId}/profile`);
    if (!res.ok) {
      throw new Error(await getErrorMessage(res, "Failed to fetch player profile"));
    }
    return res.json();
  },

  /**
   * Get global leaderboard (all-time)
   */
  async getLeaderboard(limit: number = 20): Promise<LeaderboardResponse> {
    const res = await apiFetch(`/leaderboard?limit=${limit}`);
    if (!res.ok) {
      throw new Error(await getErrorMessage(res, "Failed to fetch leaderboard"));
    }
    return res.json();
  },

  /**
   * Get aggregated accolade stats for a player
   */
  async getAccoladeStats(playerId: string): Promise<PlayerAccoladeStats> {
    const res = await apiFetch(`/${playerId}/accolades/stats`);
    if (!res.ok) {
      throw new Error(await getErrorMessage(res, "Failed to fetch accolade stats"));
    }
    return res.json();
  },

  /**
   * Get derived playstyle profile for a player
   */
  async getPlaystyle(playerId: string): Promise<PlayerPlaystyleProfile> {
    const res = await apiFetch(`/${playerId}/playstyle`);
    if (!res.ok) {
      throw new Error(await getErrorMessage(res, "Failed to fetch player playstyle"));
    }
    return res.json();
  },

  /**
   * Get per-category performance for a player
   */
  async getCategoryStats(playerId: string): Promise<PlayerCategoryStatsResponse> {
    const res = await apiFetch(`/${playerId}/category-stats`);
    if (!res.ok) {
      throw new Error(await getErrorMessage(res, "Failed to fetch player category stats"));
    }
    return res.json();
  },

  /**
   * Get normalized comparison stats for a player
   */
  async getComparisons(playerId: string): Promise<PlayerComparisonsResponse> {
    const res = await apiFetch(`/${playerId}/comparisons`);
    if (!res.ok) {
      throw new Error(await getErrorMessage(res, "Failed to fetch player comparisons"));
    }
    return res.json();
  },
};
