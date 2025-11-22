"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  collectionsApi,
  topicsApi,
  type CollectionDetail,
  type Topic,
} from "@/lib/api/admin";
import styles from "./page.module.css";

export default function CollectionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const collectionId = parseInt(params.id as string);

  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [collectionDesc, setCollectionDesc] = useState("");

  useEffect(() => {
    loadData();
  }, [collectionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load collection details
      const collectionData = await collectionsApi.getById(collectionId);
      setCollection(collectionData);
      setCollectionName(collectionData.name);
      setCollectionDesc(collectionData.description || "");

      // Load all available topics (not in this collection)
      const allTopics = await topicsApi.getAll();
      const topicIdsInCollection = new Set(
        collectionData.topics.map((t) => t.id)
      );
      const available = allTopics.filter((t) => !topicIdsInCollection.has(t.id));
      setAvailableTopics(available);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMetadata = async () => {
    try {
      await collectionsApi.update(collectionId, {
        name: collectionName,
        description: collectionDesc,
      });
      setEditingName(false);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update collection");
    }
  };

  const handleAddTopic = async (topicId: number) => {
    try {
      await collectionsApi.addTopic(collectionId, topicId);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add topic");
    }
  };

  const handleRemoveTopic = async (topicId: number) => {
    if (!confirm("Remove this topic from the collection?")) return;

    try {
      await collectionsApi.removeTopic(collectionId, topicId);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove topic");
    }
  };

  const handleViewTopic = (topicId: number) => {
    router.push(`/admin/topics/${topicId}`);
  };

  const filteredTopics = availableTopics.filter((topic) =>
    topic.name.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>LOADING COLLECTION...</p>
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>⚠️ {error || "Collection not found"}</p>
          <button onClick={() => router.push("/admin/collections")}>
            ← BACK TO COLLECTIONS
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <span className={styles.neonText}>EDIT</span>
            <span className={styles.neonTextPink}>COLLECTION</span>
          </h1>

          <button
            className={styles.backButton}
            onClick={() => router.push("/admin/collections")}
          >
            ← BACK
          </button>
        </div>

        <div className={styles.content}>
          {/* Collection Metadata */}
          <div className={styles.metadataSection}>
            {editingName ? (
              <div className={styles.editForm}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Collection Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                    placeholder="Collection name"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Description</label>
                  <textarea
                    className={styles.textarea}
                    value={collectionDesc}
                    onChange={(e) => setCollectionDesc(e.target.value)}
                    placeholder="Optional description"
                    rows={2}
                  />
                </div>
                <div className={styles.editActions}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => {
                      setEditingName(false);
                      setCollectionName(collection.name);
                      setCollectionDesc(collection.description || "");
                    }}
                  >
                    CANCEL
                  </button>
                  <button
                    className={styles.saveButton}
                    onClick={handleSaveMetadata}
                  >
                    SAVE
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.metadataDisplay}>
                <div>
                  <h2 className={styles.collectionName}>{collection.name}</h2>
                  {collection.description && (
                    <p className={styles.collectionDesc}>
                      {collection.description}
                    </p>
                  )}
                </div>
                <button
                  className={styles.editMetadataButton}
                  onClick={() => setEditingName(true)}
                >
                  ✏️ EDIT
                </button>
              </div>
            )}
          </div>

          {/* Two-column layout */}
          <div className={styles.sectionsContainer}>
            {/* Available Topics */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Available Topics</h2>
              <input
                type="text"
                className={styles.filterInput}
                placeholder="Filter topics..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <div className={styles.availableTopics}>
                {filteredTopics.length === 0 ? (
                  <p className={styles.emptyMessage}>
                    {filter
                      ? "No topics match your filter"
                      : "All topics are in this collection"}
                  </p>
                ) : (
                  filteredTopics.map((topic) => (
                    <div key={topic.id} className={styles.topicCard}>
                      <div className={styles.topicInfo}>
                        <span className={styles.topicName}>{topic.name}</span>
                        <span className={styles.topicSlotCount}>
                          {topic.slot_count || 0} slots
                        </span>
                      </div>
                      <button
                        type="button"
                        className={styles.addTopicButton}
                        onClick={() => handleAddTopic(topic.id)}
                      >
                        + ADD
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Topics in Collection */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Topics in Collection ({collection.topics.length})
              </h2>
              <div className={styles.selectedTopics}>
                {collection.topics.length === 0 ? (
                  <p className={styles.emptyMessage}>
                    No topics in collection. Add topics from the left.
                  </p>
                ) : (
                  collection.topics.map((topic) => (
                    <div key={topic.id} className={styles.selectedTopicCard}>
                      <div className={styles.topicInfo}>
                        <span className={styles.topicName}>{topic.name}</span>
                        <span className={styles.topicSlotCount}>
                          {topic.slot_count || 0} slots
                        </span>
                      </div>
                      <div className={styles.topicActions}>
                        <button
                          type="button"
                          className={styles.viewButton}
                          onClick={() => handleViewTopic(topic.id)}
                        >
                          👁️ VIEW
                        </button>
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() => handleRemoveTopic(topic.id)}
                        >
                          ✕ REMOVE
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
