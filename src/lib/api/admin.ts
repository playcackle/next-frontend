/**
 * API client for admin CRUD operations
 */

const apiFetch = (path: string, init?: RequestInit) => {
  return fetch(`/api${path.startsWith("/") ? path : `/${path}`}`, init);
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
};

export type TopicDetail = Topic & {
  slots: Slot[];
};

export type TopicCreate = {
  name: string;
  prompt?: string;
  example_text?: string;
  collection_ids: number[];
};

export type TopicUpdate = {
  name?: string;
  prompt?: string;
  example_text?: string;
  collection_ids?: number[];
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
  urgency_enabled: boolean;
  urgency_time_left_seconds: number;
  urgency_interval_seconds: number;
};

export type HostSettingsUpdate = {
  enabled?: boolean;
  display_name?: string;
  welcome_message_enabled?: boolean;
  hints_enabled?: boolean;
  hint_delay_seconds?: number;
  hint_interval_seconds?: number;
  urgency_enabled?: boolean;
  urgency_time_left_seconds?: number;
  urgency_interval_seconds?: number;
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

export type TopicUploadResult = {
  topic_name: string;
  topic_id: number;
  slots_created: number;
  aliases_created: number;
};

export type ExcelUploadResponse = {
  status: string;
  message: string;
  topics_created: number;
  topics_updated: number;
  total_slots_created: number;
  total_aliases_created: number;
  collection_id: number | null;
  collection_name: string | null;
  details: TopicUploadResult[];
  errors: string[];
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

  /**
   * Upload slots from an Excel file
   *
   * Uses the same parsing logic as populate_initial_data().
   * Each sheet in the Excel file becomes a topic.
   * Topics can optionally be linked to collections, or you can link them later via collectionsApi.
   */
  async uploadExcel(
    file: File,
    options?: {
      collectionIds?: number[];
      updateExisting?: boolean;
    }
  ): Promise<ExcelUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    if (options?.collectionIds && options.collectionIds.length > 0) {
      formData.append('collection_ids', options.collectionIds.join(','));
    }

    formData.append('update_existing', (options?.updateExisting ?? false).toString());

    const res = await apiFetch(`/admin/upload-slots`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to upload Excel file');
    }

    const result: ExcelUploadResponse = await res.json();
    return result;
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
      throw new Error(error.detail || 'Failed to get gameroom configuration');
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
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to fetch host settings');
    }
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
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to update host settings');
    }
    return res.json();
  },
};

// ============================================================================
// Fuzzy Match Config API (via Gameroom proxy)
// ============================================================================

export const fuzzyMatchConfigApi = {
  /**
   * Get fuzzy match configuration for a gameroom
   * Note: The gameroom admin endpoint doesn't use lobby ID in the path
   * since each gameroom instance is already tied to a specific lobby
   */
  async get(lobbyId: string): Promise<FuzzyMatchConfig> {
    const gameroomUrl = await this.getGameroomAdminUrl(lobbyId);
    const res = await fetch(`${gameroomUrl}/admin/fuzzy-match-config`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to fetch fuzzy match config');
    }
    const data: FuzzyMatchConfigResponse = await res.json();
    return data.config;
  },

  /**
   * Update fuzzy match configuration for a gameroom
   */
  async update(lobbyId: string, updates: FuzzyMatchConfigUpdate): Promise<FuzzyMatchConfig> {
    const gameroomUrl = await this.getGameroomAdminUrl(lobbyId);
    const res = await fetch(`${gameroomUrl}/admin/fuzzy-match-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to update fuzzy match config');
    }
    const data: FuzzyMatchConfigResponse = await res.json();
    return data.config;
  },

  /**
   * Helper to get gameroom admin URL for a specific lobby
   */
  async getGameroomAdminUrl(lobbyId: string): Promise<string> {
    const lobby = await lobbiesApi.getById(lobbyId);
    if (!lobby.admin_base_url) {
      throw new Error('Gameroom admin URL not available');
    }
    return lobby.admin_base_url;
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
