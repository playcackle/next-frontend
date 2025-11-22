/**
 * API client for admin CRUD operations
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_LOBBY_MANAGER_URL || 'http://localhost:8001';

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

// ============================================================================
// Collections API
// ============================================================================

export const collectionsApi = {
  /**
   * Get all collections
   */
  async getAll(): Promise<Collection[]> {
    const res = await fetch(`${API_BASE_URL}/admin/collections`);
    if (!res.ok) throw new Error('Failed to fetch collections');
    return res.json();
  },

  /**
   * Get a single collection with all topics
   */
  async getById(id: number): Promise<CollectionDetail> {
    const res = await fetch(`${API_BASE_URL}/admin/collections/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch collection ${id}`);
    return res.json();
  },

  /**
   * Create a new collection
   */
  async create(data: CollectionCreate): Promise<Collection> {
    const res = await fetch(`${API_BASE_URL}/admin/collections`, {
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
    const res = await fetch(`${API_BASE_URL}/admin/collections/${id}`, {
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
    const res = await fetch(`${API_BASE_URL}/admin/collections/${id}`, {
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
    const res = await fetch(`${API_BASE_URL}/admin/collections/${collectionId}/topics`, {
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
    const res = await fetch(`${API_BASE_URL}/admin/collections/${collectionId}/topics/${topicId}`, {
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
      ? `${API_BASE_URL}/admin/topics?collection_id=${collectionId}`
      : `${API_BASE_URL}/admin/topics`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch topics');
    return res.json();
  },

  /**
   * Get a single topic with all slots
   */
  async getById(id: number): Promise<TopicDetail> {
    const res = await fetch(`${API_BASE_URL}/admin/topics/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch topic ${id}`);
    return res.json();
  },

  /**
   * Create a new topic
   */
  async create(data: TopicCreate): Promise<Topic> {
    const res = await fetch(`${API_BASE_URL}/admin/topics`, {
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
    const res = await fetch(`${API_BASE_URL}/admin/topics/${id}`, {
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
    const res = await fetch(`${API_BASE_URL}/admin/topics/${id}`, {
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
    const res = await fetch(`${API_BASE_URL}/admin/topics/${topicId}/slots`);
    if (!res.ok) throw new Error('Failed to fetch slots');
    return res.json();
  },

  /**
   * Get a single slot with all aliases
   */
  async getById(id: number): Promise<SlotDetail> {
    const res = await fetch(`${API_BASE_URL}/admin/slots/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch slot ${id}`);
    return res.json();
  },

  /**
   * Create a new slot
   */
  async create(topicId: number, data: SlotCreate): Promise<Slot> {
    const res = await fetch(`${API_BASE_URL}/admin/topics/${topicId}/slots`, {
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
    const res = await fetch(`${API_BASE_URL}/admin/slots/${id}`, {
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
    const res = await fetch(`${API_BASE_URL}/admin/slots/${id}`, {
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
    const res = await fetch(`${API_BASE_URL}/admin/slots/${slotId}/aliases`);
    if (!res.ok) throw new Error('Failed to fetch aliases');
    return res.json();
  },

  /**
   * Create a new alias
   */
  async create(slotId: number, data: SlotAliasCreate): Promise<SlotAlias> {
    const res = await fetch(`${API_BASE_URL}/admin/slots/${slotId}/aliases`, {
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
    const res = await fetch(`${API_BASE_URL}/admin/slots/aliases/${aliasId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to delete alias');
    }
  },
};
