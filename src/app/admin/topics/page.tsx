"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { topicsApi, collectionsApi, type Topic, type Collection } from "@/lib/api/admin";
import AIGenerate from "../components/AIGenerate";
import { AlertTriangle, Pencil, Trash2, Zap } from "lucide-react";
import styles from "./page.module.css";

export default function TopicsPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCollection, setFilterCollection] = useState<number | null>(null);
  const [showAIGenerate, setShowAIGenerate] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [topicsData, collectionsData] = await Promise.all([
        topicsApi.getAll(),
        collectionsApi.getAll(),
      ]);
      setTopics(topicsData);
      setCollections(collectionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleViewTopic = (topicId: number) => {
    router.push(`/admin/topics/${topicId}`);
  };

  const handleDeleteTopic = async (topicId: number, topicName: string) => {
    if (!confirm(`Delete topic "${topicName}"?\n\nThis will delete all slots and aliases in this topic.`)) {
      return;
    }

    try {
      await topicsApi.delete(topicId);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete topic");
    }
  };

  const getCollectionNames = (collectionIds: number[]) => {
    if (!collectionIds || collectionIds.length === 0) {
      return "No collection";
    }
    return collectionIds
      .map((id) => collections.find((c) => c.id === id)?.name || `Collection ${id}`)
      .join(", ");
  };

  const filteredTopics = filterCollection
    ? topics.filter((t) => t.collection_ids?.includes(filterCollection))
    : topics;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>LOADING TOPICS...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <span><AlertTriangle size={20} /> {error}</span>
          <button onClick={loadData} className={styles.retryButton}>
            RETRY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.neonText}>TOPIC</span>
          <span className={styles.neonTextPink}>BROWSER</span>
        </h1>
        <button
          className={styles.uploadToggle}
          onClick={() => setShowAIGenerate(true)}
        >
          ＋ NEW TOPIC
        </button>
      </div>

      {/* AI Generate Section */}
      {showAIGenerate && (
        <div className={styles.uploadSection}>
          <AIGenerate
            onComplete={() => { loadData(); setShowAIGenerate(false); }}
            onClose={() => setShowAIGenerate(false)}
            title={<><Zap size={16} /> New Topic</>}
          />
        </div>
      )}

      {/* Filter */}
      <div className={styles.filterSection}>
        <label className={styles.filterLabel}>Filter by Collection:</label>
        <select
          className={styles.filterSelect}
          value={filterCollection || ""}
          onChange={(e) => setFilterCollection(e.target.value ? parseInt(e.target.value) : null)}
        >
          <option value="">All Collections</option>
          {collections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.name}
            </option>
          ))}
        </select>
      </div>

      {/* Topics List */}
      <div className={styles.topicsList}>
        {filteredTopics.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No topics found</p>
            {filterCollection && (
              <button
                className={styles.clearFilterButton}
                onClick={() => setFilterCollection(null)}
              >
                Clear Filter
              </button>
            )}
          </div>
        ) : (
          filteredTopics.map((topic) => (
            <div key={topic.id} className={styles.topicCard}>
              <div className={styles.topicInfo}>
                <h3 className={styles.topicName}>{topic.name}</h3>
                <p className={styles.collectionName}>
                  Collections: {getCollectionNames(topic.collection_ids)}
                </p>
                {topic.prompt && (
                  <p className={styles.topicPrompt}>Prompt: {topic.prompt}</p>
                )}
              </div>
              <div className={styles.topicMeta}>
                <span className={styles.slotCount}>
                  {topic.slot_count || 0} slots
                </span>
                {topic.category && (
                  <span className={styles.categoryBadge}>{topic.category}</span>
                )}
                <div className={styles.topicActions}>
                  <button
                    className={styles.viewButton}
                    onClick={() => handleViewTopic(topic.id)}
                  >
                    <Pencil size={16} /> EDIT
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDeleteTopic(topic.id, topic.name)}
                  >
                    <Trash2 size={16} /> DELETE
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
