/**
 * API client for player-related operations
 */

const apiFetch = (path: string, init?: RequestInit) => {
  const normalizedPath = path.startsWith("/players")
    ? path.substring("/players".length)
    : path;
  return fetch(`/api/players${normalizedPath}`, init);
};

// ============================================================================
// Types
// ============================================================================

export type PlayerProfileStats = {
  // Basic Info
  id: string;
  name: string;
  email: string;
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
      const error = await res.json();
      throw new Error(error.detail || 'Failed to fetch player profile');
    }
    return res.json();
  },

  /**
   * Get global leaderboard (all-time)
   */
  async getLeaderboard(limit: number = 20): Promise<LeaderboardResponse> {
    const res = await apiFetch(`/leaderboard?limit=${limit}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to fetch leaderboard');
    }
    return res.json();
  },
};
