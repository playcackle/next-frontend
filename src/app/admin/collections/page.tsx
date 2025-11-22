"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { collectionsApi, type Collection } from "@/lib/api/admin";
import styles from "./page.module.css";

export default function CollectionsPage() {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");

  console.log("CollectionsPage render:", { loading, error, collectionsCount: collections.length });

  // Load collections on mount
  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      console.log("loadCollections: Starting...");
      setLoading(true);
      setError(null);
      const data = await collectionsApi.getAll();
      console.log("loadCollections: Received data:", data);
      setCollections(data);
      console.log("loadCollections: State updated");
    } catch (err) {
      console.error("loadCollections: Error:", err);
      setError(err instanceof Error ? err.message : "Failed to load collections");
    } finally {
      setLoading(false);
      console.log("loadCollections: Done. Loading=false");
    }
  };

  const handleCreate = async () => {
    if (!newCollectionName.trim()) {
      alert("Please enter a collection name");
      return;
    }

    try {
      await collectionsApi.create({
        name: newCollectionName,
        description: newCollectionDesc || undefined,
      });
      setShowCreateDialog(false);
      setNewCollectionName("");
      setNewCollectionDesc("");
      loadCollections();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create collection");
    }
  };

  const handleEdit = (id: number) => {
    router.push(`/admin/collections/${id}`);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?\n\nThis will delete all topics and slots in this collection.`)) {
      return;
    }

    try {
      await collectionsApi.delete(id);
      loadCollections();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete collection");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.neonText}>COLLECTION</span>
          <span className={styles.neonTextPink}>MANAGER</span>
        </h1>

        <button
          className={styles.createButton}
          onClick={() => setShowCreateDialog(true)}
        >
          + CREATE NEW COLLECTION
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          <p>⚠️ {error}</p>
          <button onClick={loadCollections} className={styles.retryButton}>
            RETRY
          </button>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>LOADING COLLECTIONS...</p>
        </div>
      ) : (
        <div className={styles.collectionsList}>
          {collections.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No collections found</p>
              <p className={styles.emptyHint}>Create your first collection to get started!</p>
            </div>
          ) : (
            collections.map((collection) => (
              <div key={collection.id} className={styles.collectionCard}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.collectionName}>{collection.name}</h3>
                    {collection.description && (
                      <p className={styles.collectionDesc}>{collection.description}</p>
                    )}
                  </div>
                  <div className={styles.cardActions}>
                    <button
                      className={styles.editButton}
                      onClick={() => handleEdit(collection.id)}
                      title="Edit collection"
                    >
                      ✏️ EDIT
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDelete(collection.id, collection.name)}
                      title="Delete collection"
                    >
                      🗑️ DELETE
                    </button>
                  </div>
                </div>
                <div className={styles.cardFooter}>
                  <span className={styles.topicCount}>
                    📚 {collection.topic_count || 0} topics
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Dialog */}
      {showCreateDialog && (
        <div className={styles.modal} onClick={() => setShowCreateDialog(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>CREATE NEW COLLECTION</h2>

            <div className={styles.formGroup}>
              <label htmlFor="name">Collection Name *</label>
              <input
                id="name"
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="e.g., 80s Pop Culture"
                className={styles.input}
                autoFocus
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={newCollectionDesc}
                onChange={(e) => setNewCollectionDesc(e.target.value)}
                placeholder="Optional description..."
                className={styles.textarea}
                rows={3}
              />
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewCollectionName("");
                  setNewCollectionDesc("");
                }}
              >
                CANCEL
              </button>
              <button className={styles.createButton} onClick={handleCreate}>
                CREATE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
