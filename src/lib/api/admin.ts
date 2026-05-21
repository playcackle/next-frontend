/**
 * API client for admin CRUD operations
 */

import { createClient } from "@/lib/supabase/client";

const LOBBY_MANAGER_URL = (import.meta.env.VITE_LOBBY_MANAGER_URL || "http://localhost:8001").replace(/\/+$/, "");
const CONTENT_SERVICE_URL = (import.meta.env.VITE_CONTENT_SERVICE_URL || "http://localhost:8003").replace(/\/+$/, "");
const PLAYER_SERVICE_URL = (import.meta.env.VITE_PLAYER_SERVICE_URL || "http://localhost:8004").replace(/\/+$/, "");

const CONTENT_PATHS = ["/collections", "/topics", "/slots", "/generate"];
const PLAYER_PATHS = ["/players"];

const resolveUrl = (path: string): string => {
  // Normalize and strip the /admin prefix that all call sites use
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const stripped = normalized.startsWith("/admin")
    ? normalized.substring("/admin".length)
    : normalized;

  if (CONTENT_PATHS.some((p) => stripped.startsWith(p))) {
    return `${CONTENT_SERVICE_URL}${stripped}`;
  }
  if (PLAYER_PATHS.some((p) => stripped.startsWith(p))) {
    return `${PLAYER_SERVICE_URL}${stripped}`;
  }
  // Lobbies, gamerooms, and everything else go to lobby_manager with /admin prefix
  return `${LOBBY_MANAGER_URL}/admin${stripped}`;
};

const apiFetch = async (path: string, init?: RequestInit): Promise<Response> => {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("You must be logged in to access this.");
  }

  const url = resolveUrl(path);
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${session.access_token}`);

  const res = await fetch(url, { ...init, headers });
  if (res.status === 401) throw new Error("You must be logged in to access this.");
  if (res.status === 403) throw new Error("You don't have permission to access this.");
  return res;
};

const parseErrorResponse = async (res: Response, fallback: string): Promise<never> => {
  try {
    const error = await res.json();
    throw new Error(error.detail || fallback);
  } catch (e) {
    if (e instanceof Error && e.message !== fallback) throw e;
    throw new Error(fallback);
  }
};

// ============================================================================
// Types
// ============================================================================

export type Collection = {
  id: number;
  name: string;
  description: string | null;
  topic_count?: number;
};

export type CollectionDetail = Collection & {
  topics: Topic[];
};

export type CollectionCreate = {
  name: string;
  description?: string;
};

export type CollectionUpdate = {
  name?: string;
  description?: string;
};

export type Topic = {
  id: number;
  name: string;
  prompt: string | null;
  example_text: string | null;
  collection_ids: number[];
  slot_count?: number;
  category?: string | null;
  mode?: string | null;
  topic_type?: string | null;
};

export type TopicDetail = Topic & {
  slots: Slot[];
};

export type TopicCreate = {
  name: string;
  prompt?: string;
  example_text?: string;
  collection_ids: number[];
  category?: string;
  mode?: string;
  topic_type?: string;
};

export type TopicUpdate = {
  name?: string;
  prompt?: string;
  example_text?: string;
  collection_ids?: number[];
  category?: string;
  mode?: string;
  topic_type?: string;
};

export type Slot = {
  id: number;
  canonical_text: string;
  prompt: string;
  bot_bob_clue: string | null;
  is_rare: boolean;
  topic_id: number;
  alias_count?: number;
};

export type SlotDetail = Slot & {
  aliases: SlotAlias[];
};

export type SlotCreate = {
  canonical_text: string;
  prompt: string;
  bot_bob_clue?: string;
  is_rare: boolean;
  topic_id: number;
  aliases?: string[];
};

export type SlotUpdate = {
  canonical_text?: string;
  prompt?: string;
  bot_bob_clue?: string;
  is_rare?: boolean;
  topic_id?: number;
};

export type SlotAlias = {
  id: number;
  alias_text: string;
  slot_id: number;
};

export type SlotAliasCreate = {
  alias_text: string;
};

export type GameConfigurationParameters = {
  num_rounds?: number;
  round_duration?: number;
  round_break_duration?: number;
  max_normal_slots?: number;
  max_rare_slots?: number;
  min_players_to_start?: number;
  game_start_delay?: number;
  new_game_wait_duration?: number;
  points_normal_slot?: number;
  points_rare_slot?: number;
  max_players?: number;
};

export type Lobby = {
  lobby_id: string;
  status: string;
  player_count: number;
  collection_id: number | null;
  collection_name: string | null;
  configuration: GameConfigurationParameters | null;
  admin_base_url?: string | null;
  join_base_url?: string | null;
  game_ws_url?: string | null;
  chat_ws_url?: string | null;
  visibility?: "public" | "private" | "hidden";
  is_spawned?: boolean;
  railway_service_id?: string | null;
  owner_id?: string | null;
};

export type LobbyConfigurationUpdate = {
  parameters?: GameConfigurationParameters;
  apply_mode: 'immediate' | 'on_next_reset';
};

export type LobbyCollectionUpdate = {
  collection_id: number;
  apply_immediately: boolean;
};

export type LobbyResetRequest = {
  reason?: string;
};

export type HostSettings = {
  enabled: boolean;
  display_name: string;
  welcome_message_enabled: boolean;
  hints_enabled: boolean;
  hint_delay_seconds: number;
  hint_interval_seconds: number;
  max_hints_per_round: number;
  urgency_enabled: boolean;
  urgency_time_left_seconds: number;
  urgency_interval_seconds: number;
  accolades_enabled: boolean;
  accolade_initial_delay: number;
  accolade_spacing: number;
  num_accolades_to_show: number;
};

export type HostSettingsUpdate = {
  enabled?: boolean;
  display_name?: string;
  welcome_message_enabled?: boolean;
  hints_enabled?: boolean;
  hint_delay_seconds?: number;
  hint_interval_seconds?: number;
  max_hints_per_round?: number;
  urgency_enabled?: boolean;
  urgency_time_left_seconds?: number;
  urgency_interval_seconds?: number;
  accolades_enabled?: boolean;
  accolade_initial_delay?: number;
  accolade_spacing?: number;
  num_accolades_to_show?: number;
};

export type FuzzyMatchConfig = {
  min_similarity: number;
  min_word_length: number;
  near_miss_threshold: number;
  max_length_diff: number;
};

export type FuzzyMatchConfigUpdate = {
  min_similarity?: number;
  min_word_length?: number;
  near_miss_threshold?: number;
  max_length_diff?: number;
};

export type FuzzyMatchConfigResponse = {
  status: string;
  message: string;
  config: FuzzyMatchConfig;
};

// ============================================================================
// Collections API
// ============================================================================

export const collectionsApi = {
  /**
   * Get all collections
   */
  async getAll(): Promise<Collection[]> {
    const res = await apiFetch(`/admin/collections`);
    if (!res.ok) throw new Error('Failed to fetch collections');
    return res.json();
  },

  /**
   * Get a single collection with all topics
   */
  async getById(id: number): Promise<CollectionDetail> {
    const res = await apiFetch(`/admin/collections/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch collection ${id}`);
    return res.json();
  },

  /**
   * Create a new collection
   */
  async create(data: CollectionCreate): Promise<Collection> {
    const res = await apiFetch(`/admin/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to create collection');
    }
    return res.json();
  },

  /**
   * Update a collection
   */
  async update(id: number, data: CollectionUpdate): Promise<Collection> {
    const res = await apiFetch(`/admin/collections/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to update collection');
    }
    return res.json();
  },

  /**
   * Delete a collection
   */
  async delete(id: number): Promise<void> {
    const res = await apiFetch(`/admin/collections/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to delete collection');
    }
  },

  /**
   * Add a topic to a collection
   */
  async addTopic(collectionId: number, topicId: number): Promise<CollectionDetail> {
    const res = await apiFetch(`/admin/collections/${collectionId}/topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic_id: topicId }),
    });
    if (!res.ok) throw new Error('Failed to add topic to collection');
    return res.json();
  },

  /**
   * Remove a topic from a collection
   */
  async removeTopic(collectionId: number, topicId: number): Promise<void> {
    const res = await apiFetch(`/admin/collections/${collectionId}/topics/${topicId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to remove topic from collection');
  },
};

// ============================================================================
// Topics API
// ============================================================================

export const topicsApi = {
  /**
   * Get all topics, optionally filtered by collection
   */
  async getAll(collectionId?: number): Promise<Topic[]> {
    const url = collectionId
      ? `/admin/topics?collection_id=${collectionId}`
      : `/admin/topics`;
    const res = await apiFetch(url);
    if (!res.ok) throw new Error('Failed to fetch topics');
    return res.json();
  },

  /**
   * Get a single topic with all slots
   */
  async getById(id: number): Promise<TopicDetail> {
    const res = await apiFetch(`/admin/topics/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch topic ${id}`);
    return res.json();
  },

  /**
   * Create a new topic
   */
  async create(data: TopicCreate): Promise<Topic> {
    const res = await apiFetch(`/admin/topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to create topic');
    }
    return res.json();
  },

  /**
   * Update a topic
   */
  async update(id: number, data: TopicUpdate): Promise<Topic> {
    const res = await apiFetch(`/admin/topics/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to update topic');
    }
    return res.json();
  },

  /**
   * Delete a topic
    */
  async delete(id: number): Promise<void> {
    const res = await apiFetch(`/admin/topics/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to delete topic');
    }
  },
};

// ============================================================================
// Slots API
// ============================================================================

export const slotsApi = {
  /**
   * Get all slots for a topic
   */
  async getByTopic(topicId: number): Promise<Slot[]> {
    const res = await apiFetch(`/admin/topics/${topicId}/slots`);
    if (!res.ok) throw new Error('Failed to fetch slots');
    return res.json();
  },

  /**
   * Get a single slot with all aliases
   */
  async getById(id: number): Promise<SlotDetail> {
    const res = await apiFetch(`/admin/slots/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch slot ${id}`);
    return res.json();
  },

  /**
   * Create a new slot
   */
  async create(topicId: number, data: SlotCreate): Promise<Slot> {
    const res = await apiFetch(`/admin/topics/${topicId}/slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to create slot');
    }
    return res.json();
  },

  /**
   * Update a slot
   */
  async update(id: number, data: SlotUpdate): Promise<Slot> {
    const res = await apiFetch(`/admin/slots/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to update slot');
    }
    return res.json();
  },

  /**
   * Delete a slot
   */
  async delete(id: number): Promise<void> {
    const res = await apiFetch(`/admin/slots/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to delete slot');
    }
  },
};

// ============================================================================
// Aliases API
// ============================================================================

export const aliasesApi = {
  /**
   * Get all aliases for a slot
   */
  async getBySlot(slotId: number): Promise<SlotAlias[]> {
    const res = await apiFetch(`/admin/slots/${slotId}/aliases`);
    if (!res.ok) throw new Error('Failed to fetch aliases');
    return res.json();
  },

  /**
   * Create a new alias
   */
  async create(slotId: number, data: SlotAliasCreate): Promise<SlotAlias> {
    const res = await apiFetch(`/admin/slots/${slotId}/aliases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to create alias');
    }
    return res.json();
  },

  /**
   * Delete an alias
   */
  async delete(aliasId: number): Promise<void> {
    const res = await apiFetch(`/admin/slots/aliases/${aliasId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to delete alias');
    }
  }
};

// ============================================================================
// AI Content Generation Types
// ============================================================================

export type TopicGenerateRequest = {
  name: string;
  example: string;
  num_slots: number;
  research_prompt?: string;
  topic_type?: string;
  category?: string;
  mode?: string;
};

export type SlotProposal = {
  canonical_text: string;
  prompt: string;
  bot_bob_clue: string | null;
  is_rare: boolean;
  aliases: string[];
};

export type TopicGenerateResponse = {
  topic_name: string;
  topic_prompt: string;
  example_text: string | null;
  slots: SlotProposal[];
  research_data: string;
  slots_generated: number;
  category: string | null;
  mode: string | null;
  topic_type: string | null;
  metadata: Record<string, unknown>;
};

export type TopicPromptResponse = {
  topic_name: string;
  example: string;
  topic_prompt: string;
};

export type TopicAnalysisResponse = {
  topic_type: string;
  category: string;
  mode: string;
  estimated_count: number;
  is_suitable: boolean;
  recommended_slots: number;
  suggestions: string[];
};

// ============================================================================
// AI Content Generation API
// ============================================================================

export const generationApi = {
  /**
   * Generate topic content using AI (full flow)
   * This takes ~15-30 seconds
   */
  async generateTopic(request: TopicGenerateRequest): Promise<TopicGenerateResponse> {
    const res = await apiFetch(`/admin/generate/topic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to generate topic');
    }
    return res.json();
  },

  /**
   * Generate just the topic prompt (fast - one API call)
   * Useful for previewing the prompt before full generation
   */
  async generateTopicPrompt(topicName: string, example: string): Promise<TopicPromptResponse> {
    const res = await apiFetch(`/admin/generate/topic-prompt?topic_name=${encodeURIComponent(topicName)}&example=${encodeURIComponent(example)}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to generate topic prompt');
    }
    return res.json();
  },

  /**
   * Analyse a topic before generation — fast single LLM call.
   * Returns classification (type, category, mode), estimated count, suitability, and slot recommendation.
   */
  async analyseTopic(topicName: string, example: string): Promise<TopicAnalysisResponse> {
    const res = await apiFetch(`/admin/generate/analyse?topic_name=${encodeURIComponent(topicName)}&example=${encodeURIComponent(example)}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to analyse topic');
    }
    return res.json();
  },

  /**
   * Bulk create slots for a topic
   */
  async createSlotsBulk(topicId: number, slots: Omit<SlotCreate, 'topic_id'>[]): Promise<{ slots_created: number; topic_id: number }> {
    const res = await apiFetch(`/admin/topics/${topicId}/slots/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slots }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to create slots');
    }
    return res.json();
  },
};

// ============================================================================
// Lobbies API
// ============================================================================

export const lobbiesApi = {
  /**
   * Get all active lobbies
   */
  async getAll(): Promise<Lobby[]> {
    const res = await apiFetch(`/admin/lobbies`);
    if (!res.ok) throw new Error('Failed to fetch lobbies');
    const data = await res.json();
    return data.lobbies;
  },

  /**
   * Get a single lobby with configuration
   */
  async getById(lobbyId: string): Promise<Lobby> {
    const res = await apiFetch(`/admin/lobbies/${lobbyId}`);
    if (!res.ok) throw new Error(`Failed to fetch lobby ${lobbyId}`);
    return res.json();
  },

  /**
   * Update lobby configuration in the database
   */
  async updateConfig(
    lobbyId: string,
    config: GameConfigurationParameters
  ): Promise<any> {
    const res = await apiFetch(`/admin/lobbies/${lobbyId}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to update lobby configuration');
    }
    return res.json();
  },

  /**
   * Change lobby collection in the database
   */
  async changeCollection(lobbyId: string, collectionId: number): Promise<any> {
    const res = await apiFetch(`/admin/lobbies/${lobbyId}/collection?collection_id=${collectionId}`, {
      method: 'PUT',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to change lobby collection');
    }
    return res.json();
  },

  /**
   * Reconfigure a running gameroom instance
   */
  async reconfigure(
    lobbyId: string,
    update: LobbyConfigurationUpdate
  ): Promise<any> {
    const res = await apiFetch(`/admin/lobbies/${lobbyId}/reconfigure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to reconfigure gameroom');
    }
    return res.json();
  },

  /**
   * Change collection for a running gameroom
   */
  async changeGameroomCollection(
    lobbyId: string,
    update: LobbyCollectionUpdate
  ): Promise<any> {
    const res = await apiFetch(`/admin/lobbies/${lobbyId}/change-collection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to change gameroom collection');
    }
    return res.json();
  },

  /**
   * Force reset a gameroom
   */
  async forceReset(lobbyId: string, reason?: string): Promise<any> {
    const res = await apiFetch(`/admin/lobbies/${lobbyId}/force-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to force reset gameroom');
    }
    return res.json();
  },

  /**
   * Get live gameroom configuration
   */
  async getGameroomConfig(lobbyId: string): Promise<any> {
    const res = await apiFetch(`/admin/lobbies/${lobbyId}/gameroom-config`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Failed to get gameroom configuration");
    }
    return res.json();
  },

  /**
   * Spawn a new gameroom service via Railway API
   */
  async spawnGameroom(request?: {
    collection_id?: number;
    configuration?: GameConfigurationParameters;
  }): Promise<{ railway_service_id: string; railway_service_name: string; status: string }> {
    const res = await apiFetch(`/admin/gamerooms/spawn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request || {}),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Failed to spawn gameroom");
    }
    return res.json();
  },

  /**
   * Tear down a spawned gameroom service via Railway API
   */
  async teardownGameroom(railwayServiceId: string): Promise<{ railway_service_id: string; deleted: boolean }> {
    const res = await apiFetch(`/admin/gamerooms/${railwayServiceId}/teardown`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Failed to teardown gameroom");
    }
    return res.json();
  },

  /**
   * Make a spawned gameroom public so it appears in the lobby browser
   */
  async makePublic(lobbyId: string): Promise<{ status: string; lobby_id: string; visibility: string }> {
    const res = await apiFetch(`/admin/gamerooms/${lobbyId}/make-public`, {
      method: "POST",
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Failed to make gameroom public");
    }
    return res.json();
  },

  /**
   * Update visibility of any lobby (admin only)
   */
  async updateVisibility(lobbyId: string, visibility: "public" | "private" | "hidden"): Promise<{ status: string; lobby_id: string; visibility: string }> {
    const res = await apiFetch(`/admin/lobbies/${lobbyId}/visibility`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Failed to update visibility");
    }
    return res.json();
  },
};

// ============================================================================
// Host Settings API (via Lobby Manager proxy)
// ============================================================================

export const hostSettingsApi = {
  /**
   * Get host settings for a gameroom
   */
  async get(lobbyId: string): Promise<HostSettings> {
    const res = await apiFetch(`/admin/lobbies/${lobbyId}/host/settings`);
    if (!res.ok) await parseErrorResponse(res, 'Failed to fetch host settings');
    return res.json();
  },

  /**
   * Update host settings for a gameroom
   */
  async update(lobbyId: string, updates: HostSettingsUpdate): Promise<HostSettings> {
    const res = await apiFetch(`/admin/lobbies/${lobbyId}/host/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) await parseErrorResponse(res, 'Failed to update host settings');
    return res.json();
  },
};

// ============================================================================
// Fuzzy Match Config API (via Gameroom proxy)
// ============================================================================

export const fuzzyMatchConfigApi = {
  async get(lobbyId: string): Promise<FuzzyMatchConfig> {
    const res = await apiFetch(`/admin/lobbies/${lobbyId}/fuzzy-match-config`);
    if (!res.ok) await parseErrorResponse(res, 'Failed to fetch fuzzy match config');
    const data: FuzzyMatchConfigResponse = await res.json();
    return data.config;
  },

  async update(lobbyId: string, updates: FuzzyMatchConfigUpdate): Promise<FuzzyMatchConfig> {
    const res = await apiFetch(`/admin/lobbies/${lobbyId}/fuzzy-match-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) await parseErrorResponse(res, 'Failed to update fuzzy match config');
    const data: FuzzyMatchConfigResponse = await res.json();
    return data.config;
  },
};

// ============================================================================
// Bot API (via Lobby Manager admin proxy)
// ============================================================================

export type BotInfo = {
  name: string;
  player_id: string;
  lobby_id: string;
  status: 'running' | 'stopped';
};

export type BotAddRequest = {
  count: number;
  accuracy?: number;  // 0.0-1.0
  typo_rate?: number; // 0.0-1.0
  min_delay_seconds?: number; // Min time between submissions (default: 5.0)
  max_delay_seconds?: number; // Max time between submissions (default: 30.0)
};

export type BotAddResponse = {
  lobby_id: string;
  requested_count: number;
  accuracy: number;
  typo_rate: number;
  min_delay_seconds: number;
  max_delay_seconds: number;
  results: Record<string, string>;
};

export type BotListResponse = {
  lobby_id: string;
  bots: BotInfo[];
  count: number;
};

export const botsApi = {
  /**
   * Add bots to a specific lobby
   */
  async addToLobby(lobbyId: string, request: BotAddRequest): Promise<BotAddResponse> {
    const res = await apiFetch(`/admin/lobbies/${lobbyId}/bots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to add bots');
    }
    return res.json();
  },

  /**
   * Get bots in a specific lobby
   */
  async getInLobby(lobbyId: string): Promise<BotListResponse> {
    const res = await apiFetch(`/admin/lobbies/${lobbyId}/bots`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to fetch bots');
    }
    return res.json();
  },

  /**
   * Remove all bots from a lobby
   */
  async removeFromLobby(lobbyId: string): Promise<void> {
    const res = await apiFetch(`/admin/lobbies/${lobbyId}/bots`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to remove bots');
    }
  },
};
