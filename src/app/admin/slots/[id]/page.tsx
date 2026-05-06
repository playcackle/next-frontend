"use client";

import { AlertTriangle, ArrowLeft, Pencil, Star, X } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  slotsApi,
  aliasesApi,
  type SlotDetail,
} from "@/lib/api/admin";
import styles from "./page.module.css";

export default function SlotDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slotId = parseInt(params.id as string);

  const [slot, setSlot] = useState<SlotDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState(false);

  // Slot form state
  const [canonicalText, setCanonicalText] = useState("");
  const [prompt, setPrompt] = useState("");
  const [bobClue, setBobClue] = useState("");
  const [isRare, setIsRare] = useState(false);

  // New alias state
  const [newAlias, setNewAlias] = useState("");

  useEffect(() => {
    loadData();
  }, [slotId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load slot details with aliases
      const slotData = await slotsApi.getById(slotId);
      setSlot(slotData);
      setCanonicalText(slotData.canonical_text);
      setPrompt(slotData.prompt);
      setBobClue(slotData.bot_bob_clue || "");
      setIsRare(slotData.is_rare);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load slot");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSlot = async () => {
    if (!canonicalText.trim() || !prompt.trim()) {
      alert("Canonical text and prompt are required");
      return;
    }

    try {
      await slotsApi.update(slotId, {
        canonical_text: canonicalText,
        prompt: prompt,
        bot_bob_clue: bobClue || undefined,
        is_rare: isRare,
      });
      setEditingSlot(false);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update slot");
    }
  };

  const handleAddAlias = async () => {
    if (!newAlias.trim()) {
      alert("Alias text is required");
      return;
    }

    try {
      await aliasesApi.create(slotId, { alias_text: newAlias });
      setNewAlias("");
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add alias");
    }
  };

  const handleDeleteAlias = async (aliasId: number, aliasText: string) => {
    if (!confirm(`Delete alias "${aliasText}"?`)) {
      return;
    }

    try {
      await aliasesApi.delete(aliasId);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete alias");
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>LOADING SLOT...</p>
        </div>
      </div>
    );
  }

  if (error || !slot) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p><AlertTriangle size={16} /> {error || "Slot not found"}</p>
          <button onClick={() => router.back()}><ArrowLeft size={16} /> BACK</button>
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
            <span className={styles.neonTextPink}>SLOT</span>
          </h1>

          <button className={styles.backButton} onClick={() => router.back()}>
            <ArrowLeft size={16} /> BACK
          </button>
        </div>

        <div className={styles.content}>
          {/* Slot Metadata */}
          <div className={styles.metadataSection}>
            {editingSlot ? (
              <div className={styles.editForm}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Canonical Text *</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={canonicalText}
                    onChange={(e) => setCanonicalText(e.target.value)}
                    placeholder="The main answer text"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Prompt *</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Clue or hint for players"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Bot Bob Clue</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={bobClue}
                    onChange={(e) => setBobClue(e.target.value)}
                    placeholder="Optional bot clue"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={isRare}
                      onChange={(e) => setIsRare(e.target.checked)}
                      className={styles.checkbox}
                    />
                    <span>Is Rare</span>
                  </label>
                </div>
                <div className={styles.editActions}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => {
                      setEditingSlot(false);
                      setCanonicalText(slot.canonical_text);
                      setPrompt(slot.prompt);
                      setBobClue(slot.bot_bob_clue || "");
                      setIsRare(slot.is_rare);
                    }}
                  >
                    CANCEL
                  </button>
                  <button
                    className={styles.saveButton}
                    onClick={handleSaveSlot}
                  >
                    SAVE
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.metadataDisplay}>
                <div>
                  <h2 className={styles.slotCanonical}>
                    {slot.canonical_text}
                    {slot.is_rare && (
                      <span className={styles.rareBadge}><Star size={14} /> RARE</span>
                    )}
                  </h2>
                  <p className={styles.slotPrompt}>
                    <strong>Prompt:</strong> {slot.prompt}
                  </p>
                  {slot.bot_bob_clue && (
                    <p className={styles.slotBobClue}>
                      <strong>Bot Clue:</strong> {slot.bot_bob_clue}
                    </p>
                  )}
                </div>
                <button
                  className={styles.editMetadataButton}
                  onClick={() => setEditingSlot(true)}
                >
                  <Pencil size={16} /> EDIT
                </button>
              </div>
            )}
          </div>

          {/* Aliases Section */}
          <div className={styles.aliasesSection}>
            <h2 className={styles.sectionTitle}>
              Aliases ({slot.aliases.length})
            </h2>

            {/* Add Alias Form */}
            <div className={styles.addAliasForm}>
              <input
                type="text"
                className={styles.aliasInput}
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                placeholder="Enter new alias..."
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddAlias();
                  }
                }}
              />
              <button className={styles.addButton} onClick={handleAddAlias}>
                + ADD ALIAS
              </button>
            </div>

            {/* Aliases List */}
            <div className={styles.aliasesList}>
              {slot.aliases.length === 0 ? (
                <p className={styles.emptyMessage}>
                  No aliases yet. Add your first alias above.
                </p>
              ) : (
                slot.aliases.map((alias) => (
                  <div key={alias.id} className={styles.aliasCard}>
                    <span className={styles.aliasText}>{alias.alias_text}</span>
                    <button
                      className={styles.deleteButton}
                      onClick={() =>
                        handleDeleteAlias(alias.id, alias.alias_text)
                      }
                    >
                      <X size={14} /> DELETE
                    </button>
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
