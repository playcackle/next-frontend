"use client";

import { useState } from "react";
import {
  generationApi,
  topicsApi,
  type TopicGenerateResponse,
  type SlotProposal,
  type TopicAnalysisResponse,
} from "@/lib/api/admin";
import styles from "./AIGenerate.module.css";

const CATEGORIES = [
  "Geography",
  "Sports",
  "Film & TV",
  "Music",
  "Food & Drink",
  "Science & Nature",
  "History & Politics",
  "Tech & Gaming",
  "Pop Culture",
];

const TOPIC_TYPES = [
  { value: "finite_enumerable", label: "Finite Enumerable (exact known universe)" },
  { value: "ranked_list", label: "Ranked List (defined by ranking)" },
  { value: "bounded_cultural", label: "Bounded Cultural (thematic/cultural set)" },
];

interface AIGenerateProps {
  topicId?: number;
  topicName?: string;
  onComplete?: () => void;
  onClose?: () => void;
  title?: string;
}

export default function AIGenerate({
  topicId,
  topicName = "",
  onComplete,
  onClose,
  title = "🤖 AI Generate Slots",
}: AIGenerateProps) {
  const [step, setStep] = useState<"input" | "analysing" | "analysed" | "generating" | "preview" | "saving">("input");

  // Input state
  const [name, setName] = useState(topicName);
  const [example, setExample] = useState("");

  // Analysis state
  const [analysis, setAnalysis] = useState<TopicAnalysisResponse | null>(null);
  const [confirmedCategory, setConfirmedCategory] = useState("");
  const [confirmedMode, setConfirmedMode] = useState("mainstream");
  const [confirmedTopicType, setConfirmedTopicType] = useState("bounded_cultural");
  const [confirmedNumSlots, setConfirmedNumSlots] = useState(30);

  // Generation state
  const [generationResult, setGenerationResult] = useState<TopicGenerateResponse | null>(null);
  const [editedSlots, setEditedSlots] = useState<SlotProposal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  // Saving state
  const [selectedCollectionIds] = useState<number[]>([]);

  const resetState = () => {
    setStep("input");
    setName(topicName);
    setExample("");
    setAnalysis(null);
    setConfirmedCategory("");
    setConfirmedMode("mainstream");
    setConfirmedTopicType("bounded_cultural");
    setConfirmedNumSlots(30);
    setGenerationResult(null);
    setEditedSlots([]);
    setError(null);
    setStatusMessage("");
  };

  const handleClose = () => {
    resetState();
    onClose?.();
  };

  const handleAnalyse = async () => {
    if (!name.trim() || !example.trim()) {
      setError("Topic name and example are required");
      return;
    }

    setError(null);
    setStep("analysing");

    try {
      const result = await generationApi.analyseTopic(name, example);
      setAnalysis(result);
      setConfirmedCategory(result.category);
      setConfirmedMode(result.mode);
      setConfirmedTopicType(result.topic_type);
      setConfirmedNumSlots(result.recommended_slots);
      setStep("analysed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setStep("input");
    }
  };

  const handleGenerate = async () => {
    if (!name.trim() || !example.trim()) {
      setError("Topic name and example are required");
      return;
    }

    setError(null);
    setStep("generating");
    setStatusMessage("Researching topic with Perplexity...");

    try {
      const result = await generationApi.generateTopic({
        name,
        example,
        num_slots: confirmedNumSlots,
        topic_type: confirmedTopicType,
        category: confirmedCategory,
        mode: confirmedMode,
      });

      setGenerationResult(result);
      setEditedSlots(result.slots);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setStep("analysed");
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
      const topic = await topicsApi.create({
        name: generationResult?.topic_name || name,
        prompt: generationResult?.topic_prompt || "",
        example_text: generationResult?.example_text || undefined,
        collection_ids: selectedCollectionIds,
        category: confirmedCategory || undefined,
        mode: confirmedMode || undefined,
        topic_type: confirmedTopicType || undefined,
      });

      setStatusMessage(`Creating ${editedSlots.length} slots...`);

      await generationApi.createSlotsBulk(
        topic.id,
        editedSlots.map((slot) => ({
          canonical_text: slot.canonical_text,
          prompt: slot.prompt,
          bot_bob_clue: slot.bot_bob_clue || undefined,
          is_rare: slot.is_rare,
          aliases: slot.aliases || [],
        }))
      );

      setStatusMessage("Done!");
      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setStep("preview");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {onClose && (
          <button className={styles.closeButton} onClick={handleClose}>
            ✕
          </button>
        )}
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
              autoFocus
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
              onKeyDown={(e) => e.key === "Enter" && handleAnalyse()}
            />
            <p className={styles.helpText}>
              The AI will classify the topic and estimate scope before generating
            </p>
          </div>

          <button
            className={styles.submitButton}
            onClick={handleAnalyse}
            disabled={!name.trim() || !example.trim()}
          >
            🔍 ANALYSE TOPIC
          </button>
        </div>
      )}

      {/* Step 1b: Analysing */}
      {step === "analysing" && (
        <div className={styles.generating}>
          <div className={styles.spinner}></div>
          <p className={styles.statusMessage}>Analysing topic...</p>
          <p className={styles.generatingHint}>
            Classifying type, category, mode, and estimating scope (~2s)
          </p>
        </div>
      )}

      {/* Step 2: Analysis results — editable before generating */}
      {step === "analysed" && analysis && (
        <div className={styles.form}>
          <div className={styles.topicInfo} style={{ marginBottom: '0.5rem' }}>
            <p style={{ fontWeight: 'bold', margin: 0 }}>{name}</p>
            <p style={{ color: '#aaa', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
              ~{analysis.estimated_count} items estimated
            </p>
          </div>

          {!analysis.is_suitable && (
            <div className={styles.estimateWarning}>
              <p style={{ margin: '0 0 0.5rem' }}>⚠️ This topic may not be suitable as-is. Consider narrowing:</p>
              <ul className={styles.suggestionsList}>
                {analysis.suggestions.map((s, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      className={styles.suggestionButton}
                      onClick={() => { setName(s); setAnalysis(null); setStep("input"); }}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.formField}>
            <label className={styles.label}>Category</label>
            <select
              className={styles.input}
              value={confirmedCategory}
              onChange={(e) => setConfirmedCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className={styles.formField}>
            <label className={styles.label}>Mode</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {["mainstream", "after_dark"].map((m) => (
                <button
                  key={m}
                  type="button"
                  className={styles.estimateButton}
                  style={{
                    background: confirmedMode === m ? '#00ff00' : undefined,
                    color: confirmedMode === m ? '#000' : undefined,
                  }}
                  onClick={() => setConfirmedMode(m)}
                >
                  {m === "mainstream" ? "Mainstream" : "After Dark"}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formField}>
            <label className={styles.label}>Topic Type</label>
            <select
              className={styles.input}
              value={confirmedTopicType}
              onChange={(e) => setConfirmedTopicType(e.target.value)}
            >
              {TOPIC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.formField}>
            <label className={styles.label}>Number of Slots</label>
            <input
              type="number"
              className={styles.input}
              value={confirmedNumSlots}
              min={10}
              max={200}
              onChange={(e) => setConfirmedNumSlots(Number(e.target.value))}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={styles.cancelButton}
              onClick={() => { setAnalysis(null); setStep("input"); }}
            >
              ← BACK
            </button>
            <button
              className={styles.submitButton}
              onClick={handleGenerate}
              disabled={!analysis.is_suitable}
            >
              {analysis.is_suitable ? "🚀 GENERATE" : "⚠️ NOT SUITABLE"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Generating */}
      {step === "generating" && (
        <div className={styles.generating}>
          <div className={styles.spinner}></div>
          <p className={styles.statusMessage}>{statusMessage}</p>
          <p className={styles.generatingHint}>
            This takes about 15-30 seconds...
          </p>
        </div>
      )}

      {/* Step 4: Preview */}
      {step === "preview" && generationResult && (
        <div className={styles.preview}>
          <div className={styles.topicInfo}>
            <p><strong>Topic:</strong> {generationResult.topic_name}</p>
            <p><strong>Prompt:</strong> {generationResult.topic_prompt}</p>
            <p style={{ fontSize: '0.8rem', color: '#aaa' }}>
              {generationResult.category} · {generationResult.mode} · {generationResult.topic_type}
            </p>
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
                  onChange={(e) => {
                    const vals = e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean);
                    handleSlotEdit(index, "aliases", vals);
                  }}
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
              onClick={() => { setGenerationResult(null); setEditedSlots([]); setStep("analysed"); }}
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

      {/* Step 5: Saving */}
      {step === "saving" && (
        <div className={styles.generating}>
          <div className={styles.spinner}></div>
          <p className={styles.statusMessage}>{statusMessage}</p>
        </div>
      )}
    </div>
  );
}
