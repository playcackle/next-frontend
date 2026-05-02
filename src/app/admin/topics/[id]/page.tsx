"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  topicsApi,
  slotsApi,
  collectionsApi,
  type TopicDetail,
  type Slot,
  type Collection,
} from "@/lib/api/admin";
import AIGenerate from "../../components/AIGenerate";
import SlotImport from "../../components/SlotImport";
import SlotBulkEdit from "../../components/SlotBulkEdit";
import styles from "./page.module.css";

export default function TopicDetailPage() {
  const router = useRouter();
  const params = useParams();
  const topicId = parseInt(params.id as string);

  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMetadata, setEditingMetadata] = useState(false);
  const [topicName, setTopicName] = useState("");
  const [topicPrompt, setTopicPrompt] = useState("");
  const [topicExample, setTopicExample] = useState("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showCreateSlot, setShowCreateSlot] = useState(false);
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  // New slot form state
  const [newSlotCanonical, setNewSlotCanonical] = useState("");
  const [newSlotPrompt, setNewSlotPrompt] = useState("");
  const [newSlotBobClue, setNewSlotBobClue] = useState("");
  const [newSlotIsRare, setNewSlotIsRare] = useState(false);

  useEffect(() => {
    loadData();
  }, [topicId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load topic details with slots and all collections for display
      const [topicData, collectionsData] = await Promise.all([
        topicsApi.getById(topicId),
        collectionsApi.getAll(),
      ]);
      setTopic(topicData);
      setTopicName(topicData.name);
      setTopicPrompt(topicData.prompt || "");
      setTopicExample(topicData.example_text || "");
      setCollections(collectionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load topic");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMetadata = async () => {
    try {
      await topicsApi.update(topicId, {
        name: topicName,
        prompt: topicPrompt || undefined,
        example_text: topicExample || undefined,
      });
      setEditingMetadata(false);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update topic");
    }
  };

  const handleCreateSlot = async () => {
    if (!newSlotCanonical.trim() || !newSlotPrompt.trim()) {
      alert("Canonical text and prompt are required");
      return;
    }

    try {
      await slotsApi.create(topicId, {
        canonical_text: newSlotCanonical,
        prompt: newSlotPrompt,
        bot_bob_clue: newSlotBobClue || undefined,
        is_rare: newSlotIsRare,
        topic_id: topicId,
      });

      // Reset form
      setNewSlotCanonical("");
      setNewSlotPrompt("");
      setNewSlotBobClue("");
      setNewSlotIsRare(false);
      setShowCreateSlot(false);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create slot");
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    if (!confirm("Delete this slot? This will also delete all its aliases.")) {
      return;
    }

    try {
      await slotsApi.delete(slotId);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete slot");
    }
  };

  const handleViewSlot = (slotId: number) => {
    router.push(`/admin/slots/${slotId}`);
  };

  const getCollectionNames = (collectionIds: number[]) => {
    if (!collectionIds || collectionIds.length === 0) {
      return "Not assigned to any collection";
    }
    return collectionIds
      .map(
        (id) => collections.find((collection) => collection.id === id)?.name || `Collection ${id}`
      )
      .join(", ");
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>LOADING TOPIC...</p>
        </div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>⚠️ {error || "Topic not found"}</p>
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
            <span className={styles.neonTextPink}>TOPIC</span>
          </h1>

          <button
            className={styles.backButton}
            onClick={() => router.back()}
          >
            ← BACK
          </button>
        </div>

        <div className={styles.content}>
          {/* Topic Metadata */}
          <div className={styles.metadataSection}>
            {editingMetadata ? (
              <div className={styles.editForm}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Topic Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    placeholder="Topic name"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Prompt</label>
                  <textarea
                    className={styles.textarea}
                    value={topicPrompt}
                    onChange={(e) => setTopicPrompt(e.target.value)}
                    placeholder="Optional prompt shown to players"
                    rows={2}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Example Text</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={topicExample}
                    onChange={(e) => setTopicExample(e.target.value)}
                    placeholder="Optional example"
                  />
                </div>
                <div className={styles.editActions}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => {
                      setEditingMetadata(false);
                      setTopicName(topic.name);
                      setTopicPrompt(topic.prompt || "");
                      setTopicExample(topic.example_text || "");
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
                  <h2 className={styles.topicName}>{topic.name}</h2>
                  {topic.prompt && (
                    <p className={styles.topicPrompt}>
                      <strong>Prompt:</strong> {topic.prompt}
                    </p>
                  )}
                  {topic.example_text && (
                    <p className={styles.topicExample}>
                      <strong>Example:</strong> {topic.example_text}
                    </p>
                  )}
                  <p className={styles.topicCollections}>
                    <strong>Collections:</strong>{" "}
                    {getCollectionNames(topic.collection_ids || [])}
                  </p>
                </div>
                <button
                  className={styles.editMetadataButton}
                  onClick={() => setEditingMetadata(true)}
                >
                  ✏️ EDIT
                </button>
              </div>
            )}
          </div>

          {/* Slots Section */}
          <div className={styles.slotsSection}>
            <div className={styles.slotsSectionHeader}>
              <h2 className={styles.sectionTitle}>
                Slots ({topic.slots.length})
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  className={styles.createSlotButton}
                  style={{ background: 'rgba(255,0,255,0.2)', borderColor: '#ff00ff', color: '#ff00ff' }}
                  onClick={() => { setShowAIGenerate(true); setShowCreateSlot(false); setShowImport(false); setShowBulkEdit(false); }}
                >
                  🤖 MORE SLOTS
                </button>
                <button
                  className={styles.createSlotButton}
                  style={{ background: showBulkEdit ? 'rgba(0,255,100,0.15)' : undefined, borderColor: showBulkEdit ? '#00ff64' : undefined, color: showBulkEdit ? '#00ff64' : undefined }}
                  onClick={() => { setShowBulkEdit(!showBulkEdit); setShowImport(false); setShowCreateSlot(false); setShowAIGenerate(false); }}
                >
                  {showBulkEdit ? "✕ CANCEL" : "✏️ BULK EDIT"}
                </button>
                <button
                  className={styles.createSlotButton}
                  style={{ background: showImport ? 'rgba(0,221,255,0.2)' : undefined, borderColor: showImport ? '#00ddff' : undefined, color: showImport ? '#00ddff' : undefined }}
                  onClick={() => { setShowImport(!showImport); setShowCreateSlot(false); setShowAIGenerate(false); setShowBulkEdit(false); }}
                >
                  {showImport ? "✕ CANCEL" : "📋 IMPORT JSON"}
                </button>
                <button
                  className={styles.createSlotButton}
                  onClick={() => { setShowCreateSlot(!showCreateSlot); setShowAIGenerate(false); setShowImport(false); setShowBulkEdit(false); }}
                >
                  {showCreateSlot ? "✕ CANCEL" : "+ NEW SLOT"}
                </button>
              </div>
            </div>

            {/* AI Generate More Slots */}
            {showAIGenerate && (
              <AIGenerate
                topicId={topic.id}
                topicName={topic.name}
                onComplete={() => { loadData(); setShowAIGenerate(false); }}
                onClose={() => setShowAIGenerate(false)}
                title="🤖 Generate More Slots"
              />
            )}

            {/* Bulk Edit */}
            {showBulkEdit && (
              <SlotBulkEdit
                existingSlots={topic.slots}
                onComplete={() => { loadData(); setShowBulkEdit(false); }}
                onClose={() => setShowBulkEdit(false)}
              />
            )}

            {/* JSON Import */}
            {showImport && (
              <SlotImport
                topicId={topic.id}
                existingSlots={topic.slots}
                onComplete={() => { loadData(); setShowImport(false); }}
                onClose={() => setShowImport(false)}
              />
            )}

            {/* Create Slot Form */}
            {showCreateSlot && (
              <div className={styles.createSlotForm}>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Canonical Text *</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={newSlotCanonical}
                      onChange={(e) => setNewSlotCanonical(e.target.value)}
                      placeholder="The main answer text"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Prompt *</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={newSlotPrompt}
                      onChange={(e) => setNewSlotPrompt(e.target.value)}
                      placeholder="Clue or hint for players"
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Bot Bob Clue</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={newSlotBobClue}
                      onChange={(e) => setNewSlotBobClue(e.target.value)}
                      placeholder="Optional bot clue"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={newSlotIsRare}
                        onChange={(e) => setNewSlotIsRare(e.target.checked)}
                        className={styles.checkbox}
                      />
                      <span>Is Rare</span>
                    </label>
                  </div>
                </div>
                <div className={styles.formActions}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => {
                      setShowCreateSlot(false);
                      setNewSlotCanonical("");
                      setNewSlotPrompt("");
                      setNewSlotBobClue("");
                      setNewSlotIsRare(false);
                    }}
                  >
                    CANCEL
                  </button>
                  <button
                    className={styles.saveButton}
                    onClick={handleCreateSlot}
                  >
                    CREATE SLOT
                  </button>
                </div>
              </div>
            )}

            {/* Slots List */}
            <div className={styles.slotsList}>
              {topic.slots.length === 0 ? (
                <p className={styles.emptyMessage}>
                  No slots yet. Create your first slot above.
                </p>
              ) : (
                topic.slots.map((slot) => (
                  <div key={slot.id} className={styles.slotCard}>
                    <div className={styles.slotInfo}>
                      <div className={styles.slotHeader}>
                        <span className={styles.slotCanonical}>
                          {slot.canonical_text}
                        </span>
                        {slot.is_rare && (
                          <span className={styles.rareBadge}>⭐ RARE</span>
                        )}
                      </div>
                      <p className={styles.slotPrompt}>
                        <strong>Prompt:</strong> {slot.prompt}
                      </p>
                      {slot.bot_bob_clue && (
                        <p className={styles.slotBobClue}>
                          <strong>Bot Clue:</strong> {slot.bot_bob_clue}
                        </p>
                      )}
                      <p className={styles.slotAliasCount}>
                        {slot.alias_count || 0} alias(es)
                      </p>
                    </div>
                    <div className={styles.slotActions}>
                      <button
                        className={styles.viewButton}
                        onClick={() => handleViewSlot(slot.id)}
                      >
                        ✏️ EDIT
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteSlot(slot.id)}
                      >
                        🗑️ DELETE
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
