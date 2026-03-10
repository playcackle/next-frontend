"use client";

import { useState } from "react";
import {
  generationApi,
  topicsApi,
  type TopicGenerateResponse,
  type SlotProposal,
  type EstimateSlotsResponse,
} from "@/lib/api/admin";
import styles from "./AIGenerate.module.css";

interface AIGenerateProps {
  topicId?: number;
  topicName?: string;
  onComplete?: () => void;
}

export default function AIGenerate({ topicId, topicName = "", onComplete }: AIGenerateProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"input" | "generating" | "preview" | "saving">("input");
  
  // Input state
  const [name, setName] = useState(topicName);
  const [example, setExample] = useState("");
  const [numSlots, setNumSlots] = useState(30);
  
  // Estimate state
  const [estimate, setEstimate] = useState<EstimateSlotsResponse | null>(null);
  const [estimating, setEstimating] = useState(false);
  
  // Generation state
  const [generationResult, setGenerationResult] = useState<TopicGenerateResponse | null>(null);
  const [editedSlots, setEditedSlots] = useState<SlotProposal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  
  // Saving state
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<number[]>([]);
  const [createdTopicId, setCreatedTopicId] = useState<number | null>(null);

  const resetState = () => {
    setStep("input");
    setName(topicName);
    setExample("");
    setNumSlots(30);
    setEstimate(null);
    setGenerationResult(null);
    setEditedSlots([]);
    setError(null);
    setStatusMessage("");
    setCreatedTopicId(null);
  };

  const handleEstimate = async () => {
    if (!name.trim() || !example.trim()) {
      setError("Topic name and example are required to estimate");
      return;
    }

    setEstimating(true);
    setError(null);

    try {
      const result = await generationApi.estimateSlots(name, example);
      setEstimate(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to estimate");
    } finally {
      setEstimating(false);
    }
  };

  const handleGenerate = async () => {
    if (!name.trim() || !example.trim()) {
      setError("Topic name and example are required");
      return;
    }

    setError(null);
    setStep("generating");
    setStatusMessage("Generating witty topic prompt...");

    try {
      // Note: We use name as both topic name and research prompt for now
      const result = await generationApi.generateTopic({
        name,
        example,
        num_slots: numSlots,
      });

      setGenerationResult(result);
      setEditedSlots(result.slots);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setStep("input");
    }
  };

  const handleSlotEdit = (index: number, field: keyof SlotProposal, value: string | boolean | string[]) => {
    const updated = [...editedSlots];
    if (field === "is_rare") {
      updated[index] = { ...updated[index], is_rare: value as boolean };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setEditedSlots(updated);
  };

  const handleDeleteSlot = (index: number) => {
    setEditedSlots(editedSlots.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (editedSlots.length === 0) {
      setError("No slots to save");
      return;
    }

    setError(null);
    setStep("saving");
    setStatusMessage("Creating topic...");

    try {
      // Step 1: Create the topic
      const topic = await topicsApi.create({
        name: generationResult?.topic_name || name,
        prompt: generationResult?.topic_prompt || "",
        example_text: generationResult?.example_text || undefined,
        collection_ids: selectedCollectionIds,
      });

      setCreatedTopicId(topic.id);
      setStatusMessage(`Creating ${editedSlots.length} slots...`);

      // Step 2: Bulk create slots
      await generationApi.createSlotsBulk(
        topic.id,
        editedSlots.map((slot) => ({
          canonical_text: slot.canonical_text,
          prompt: slot.prompt,
          bot_bob_clue: slot.bot_bob_clue || undefined,
          is_rare: slot.is_rare,
        }))
      );

      setStatusMessage("Done!");
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setStep("preview");
    }
  };

  if (!isOpen) {
    return (
      <button className={styles.generateButton} onClick={() => setIsOpen(true)}>
        🤖 AI GENERATE
      </button>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>🤖 AI Generate Slots</h3>
        <button className={styles.closeButton} onClick={() => { setIsOpen(false); resetState(); }}>
          ✕
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Step 1: Input */}
      {step === "input" && (
        <div className={styles.form}>
          <div className={styles.formField}>
            <label className={styles.label}>Topic Name</label>
            <input
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sci-Fi TV Shows"
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.label}>
              Example Answer <span className={styles.hint}>(guides the AI direction)</span>
            </label>
            <input
              type="text"
              className={styles.input}
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder="e.g., Star Trek"
            />
            <p className={styles.helpText}>
              The AI will generate a witty topic prompt based on this example
            </p>
          </div>

          <div className={styles.formField}>
            <label className={styles.label}>Number of Slots</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="number"
                className={styles.input}
                value={numSlots}
                onChange={(e) => {
                  setNumSlots(parseInt(e.target.value) || 30);
                  setEstimate(null);
                }}
                min={10}
                max={100}
                style={{ width: '100px' }}
              />
              <button
                type="button"
                className={styles.estimateButton}
                onClick={handleEstimate}
                disabled={!name.trim() || !example.trim() || estimating}
              >
                {estimating ? "⏳..." : "📊 Check Size"}
              </button>
            </div>
            {estimate && (
              <div className={estimate.is_too_large ? styles.estimateWarning : styles.estimateResult}>
                {estimate.is_too_large ? (
                  <>
                    {'⚠️'} Topic too large: ~{estimate.item_count} items. Consider narrowing down:
                    <ul className={styles.suggestionsList}>
                      {estimate.suggestions.map((s, i) => (
                        <li key={i}>
                          <button 
                            type="button"
                            className={styles.suggestionButton}
                            onClick={() => { setName(s); setEstimate(null); }}
                          >
                            {s}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <span style={{ color: '#00ff00' }}>
                    {'✅'} Topic size OK: ~{estimate.item_count} items - {estimate.reasoning}
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            className={styles.submitButton}
            onClick={handleGenerate}
            disabled={!name.trim() || !example.trim() || (estimate?.is_too_large ?? false)}
          >
            {estimate?.is_too_large ? "⚠️ TOPIC TOO LARGE" : "🚀 GENERATE"}
          </button>
        </div>
      )}

      {/* Step 2: Generating */}
      {step === "generating" && (
        <div className={styles.generating}>
          <div className={styles.spinner}></div>
          <p className={styles.statusMessage}>{statusMessage}</p>
          <p className={styles.generatingHint}>
            This takes about 15-30 seconds...
          </p>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === "preview" && generationResult && (
        <div className={styles.preview}>
          <div className={styles.topicInfo}>
            <p><strong>Topic:</strong> {generationResult.topic_name}</p>
            <p><strong>Prompt:</strong> {generationResult.topic_prompt}</p>
          </div>

          <div className={styles.slotsInfo}>
            <p>{editedSlots.length} slots generated</p>
          </div>

          <div className={styles.slotsList}>
            {editedSlots.map((slot, index) => (
              <div key={index} className={styles.slotRow}>
                <input
                  type="text"
                  className={styles.slotInput}
                  value={slot.canonical_text}
                  onChange={(e) => handleSlotEdit(index, "canonical_text", e.target.value)}
                  placeholder="Answer"
                />
                <input
                  type="text"
                  className={styles.slotClue}
                  value={slot.bot_bob_clue || ""}
                  onChange={(e) => handleSlotEdit(index, "bot_bob_clue", e.target.value)}
                  placeholder="Bot clue"
                />
                <input
                  type="text"
                  className={styles.slotAliases}
                  value={slot.aliases?.join(", ") || ""}
                  onChange={(e) => handleSlotEdit(index, "aliases", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                  placeholder="Aliases (comma sep)"
                />
                <label className={styles.rareCheckbox}>
                  <input
                    type="checkbox"
                    checked={slot.is_rare}
                    onChange={(e) => handleSlotEdit(index, "is_rare", e.target.checked)}
                  />
                  Rare
                </label>
                <button
                  className={styles.deleteSlotButton}
                  onClick={() => handleDeleteSlot(index)}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>

          <div className={styles.previewActions}>
            <button
              className={styles.cancelButton}
              onClick={() => { setGenerationResult(null); setEditedSlots([]); setStep("input"); }}
            >
              ← BACK
            </button>
            <button
              className={styles.submitButton}
              onClick={handleSave}
              disabled={editedSlots.length === 0}
            >
              💾 SAVE {editedSlots.length} SLOTS
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Saving */}
      {step === "saving" && (
        <div className={styles.generating}>
          <div className={styles.spinner}></div>
          <p className={styles.statusMessage}>{statusMessage}</p>
        </div>
      )}
    </div>
  );
}
