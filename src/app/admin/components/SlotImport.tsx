"use client";

import { useState } from "react";
import { generationApi, type Slot } from "@/lib/api/admin";
import styles from "./SlotImport.module.css";

type ImportedSlot = {
  canonical_text: string;
  prompt: string;
  bot_bob_clue: string;
  is_rare: boolean;
  _invalid?: string;
};

function validate(
  slot: ImportedSlot,
  index: number,
  allSlots: ImportedSlot[],
  existingKeys: Set<string>
): string | undefined {
  const key = slot.canonical_text.trim().toLowerCase();
  if (!slot.canonical_text.trim()) return "missing canonical_text";
  if (!slot.prompt.trim()) return "missing prompt";
  if (existingKeys.has(key)) return "already exists in topic";
  const dupeInBatch = allSlots.some(
    (s, i) => i !== index && s.canonical_text.trim().toLowerCase() === key
  );
  if (dupeInBatch) return "duplicate in this import";
  return undefined;
}

function parseSlots(
  text: string,
  existingKeys: Set<string>
): { slots: ImportedSlot[]; error: string | null } {
  let raw: unknown;
  try {
    raw = JSON.parse(text.trim());
  } catch {
    return { slots: [], error: "Invalid JSON — check for trailing commas or missing brackets" };
  }

  let arr: unknown[];
  if (Array.isArray(raw)) {
    arr = raw;
  } else if (
    raw &&
    typeof raw === "object" &&
    "slots" in raw &&
    Array.isArray((raw as Record<string, unknown>).slots)
  ) {
    arr = (raw as Record<string, unknown[]>).slots;
  } else if (raw && typeof raw === "object") {
    arr = [raw];
  } else {
    return { slots: [], error: 'Expected a JSON array or { "slots": [...] }' };
  }

  // First pass: extract unique canonical texts within the batch (id/topic_id/alias_count ignored)
  const seenInBatch = new Set<string>();
  const slots: ImportedSlot[] = [];

  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;

    const canonical = typeof obj.canonical_text === "string" ? obj.canonical_text.trim() : "";
    const batchKey = canonical.toLowerCase();
    if (seenInBatch.has(batchKey)) continue;
    seenInBatch.add(batchKey);

    slots.push({
      canonical_text: canonical,
      prompt: typeof obj.prompt === "string" ? obj.prompt.trim() : "",
      bot_bob_clue: typeof obj.bot_bob_clue === "string" ? obj.bot_bob_clue : "",
      is_rare: Boolean(obj.is_rare),
    });
  }

  // Second pass: validate each slot (now we have the full batch to check dupes against)
  const validated = slots.map((slot, i) => {
    const err = validate(slot, i, slots, existingKeys);
    return err ? { ...slot, _invalid: err } : slot;
  });

  return { slots: validated, error: null };
}

interface SlotImportProps {
  topicId: number;
  existingSlots: Slot[];
  onComplete?: () => void;
  onClose?: () => void;
}

export default function SlotImport({
  topicId,
  existingSlots,
  onComplete,
  onClose,
}: SlotImportProps) {
  const [step, setStep] = useState<"paste" | "review" | "submitting" | "done">("paste");
  const [jsonText, setJsonText] = useState("");
  const [slots, setSlots] = useState<ImportedSlot[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState(0);

  const existingKeys = new Set(
    existingSlots.map((s) => s.canonical_text.trim().toLowerCase())
  );

  const handleParse = () => {
    const { slots: parsed, error } = parseSlots(jsonText, existingKeys);
    if (error) {
      setParseError(error);
      return;
    }
    if (parsed.length === 0) {
      setParseError("No slots found in JSON");
      return;
    }
    setParseError(null);
    setSlots(parsed);
    setStep("review");
  };

  const handleEdit = (
    index: number,
    field: keyof Omit<ImportedSlot, "_invalid">,
    value: string | boolean
  ) => {
    setSlots((prev) => {
      const updated = prev.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      );
      // Re-validate every slot so cross-batch duplicate status stays current
      return updated.map((s, i) => {
        const err = validate(s, i, updated, existingKeys);
        const next = { ...s };
        if (err) next._invalid = err;
        else delete next._invalid;
        return next;
      });
    });
  };

  const handleDelete = (index: number) => {
    setSlots((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // Re-validate after removal — a surviving dupe may now become valid
      return updated.map((s, i) => {
        const err = validate(s, i, updated, existingKeys);
        const next = { ...s };
        if (err) next._invalid = err;
        else delete next._invalid;
        return next;
      });
    });
  };

  const handlePost = async () => {
    const valid = slots.filter((s) => !s._invalid);
    if (valid.length === 0) return;

    setSubmitError(null);
    setStep("submitting");

    try {
      const result = await generationApi.createSlotsBulk(
        topicId,
        valid.map(({ _invalid: _i, bot_bob_clue, ...s }) => ({
          ...s,
          bot_bob_clue: bot_bob_clue || undefined,
        }))
      );
      setCreated(result.slots_created);
      setStep("done");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create slots");
      setStep("review");
    }
  };

  const validCount = slots.filter((s) => !s._invalid).length;
  const invalidCount = slots.filter((s) => s._invalid).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>📋 Import Slots from JSON</h3>
        {onClose && (
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      {submitError && (
        <div className={styles.error}>
          {submitError}
          <button onClick={() => setSubmitError(null)}>✕</button>
        </div>
      )}

      {/* Step 1: Paste */}
      {step === "paste" && (
        <div className={styles.form}>
          <div className={styles.formField}>
            <label className={styles.label}>
              Paste JSON{" "}
              <span className={styles.existingCount}>
                ({existingSlots.length} slots already in topic)
              </span>
            </label>
            <textarea
              className={styles.jsonTextarea}
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setParseError(null);
              }}
              placeholder={`[ { "canonical_text": "F-15 Eagle", "prompt": "Air superiority fighter", "bot_bob_clue": "Never lost a dogfight", "is_rare": false }, ... ]\n\nid, topic_id, alias_count and other extra fields are ignored.\nDuplicates within the paste and against existing topic slots are flagged.`}
              rows={14}
              spellCheck={false}
            />
            {parseError && <p className={styles.parseError}>⚠ {parseError}</p>}
          </div>
          <button
            className={styles.submitButton}
            onClick={handleParse}
            disabled={!jsonText.trim()}
          >
            🔍 PARSE JSON
          </button>
        </div>
      )}

      {/* Step 2: Review */}
      {step === "review" && (
        <div className={styles.review}>
          <div className={styles.reviewSummary}>
            <span className={styles.validBadge}>{validCount} new</span>
            {invalidCount > 0 && (
              <span className={styles.invalidBadge}>
                {invalidCount} blocked — fix or delete
              </span>
            )}
          </div>

          <div className={styles.columnHeaders}>
            <span className={styles.colIdx}>#</span>
            <span>Canonical Text</span>
            <span>Prompt</span>
            <span>Bot Clue</span>
            <span className={styles.colRare}>Rare</span>
            <span></span>
          </div>

          <div className={styles.slotsList}>
            {slots.map((slot, i) => (
              <div
                key={i}
                className={`${styles.slotRow} ${slot._invalid ? styles.slotRowInvalid : ""}`}
              >
                <span className={styles.slotIndex}>{i + 1}</span>
                <input
                  className={styles.cellInput}
                  value={slot.canonical_text}
                  onChange={(e) => handleEdit(i, "canonical_text", e.target.value)}
                  placeholder="canonical text"
                />
                <input
                  className={styles.cellInput}
                  value={slot.prompt}
                  onChange={(e) => handleEdit(i, "prompt", e.target.value)}
                  placeholder="prompt"
                />
                <input
                  className={`${styles.cellInput} ${styles.cellClue}`}
                  value={slot.bot_bob_clue}
                  onChange={(e) => handleEdit(i, "bot_bob_clue", e.target.value)}
                  placeholder="bot clue"
                />
                <label className={styles.rareCheckbox}>
                  <input
                    type="checkbox"
                    checked={slot.is_rare}
                    onChange={(e) => handleEdit(i, "is_rare", e.target.checked)}
                  />
                  ⭐
                </label>
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDelete(i)}
                  title="Remove"
                >
                  ✕
                </button>
                {slot._invalid && (
                  <span className={styles.invalidHint}>{slot._invalid}</span>
                )}
              </div>
            ))}
          </div>

          <div className={styles.reviewActions}>
            <button
              className={styles.cancelButton}
              onClick={() => {
                setSlots([]);
                setStep("paste");
              }}
            >
              ← BACK
            </button>
            <button
              className={styles.submitButton}
              onClick={handlePost}
              disabled={validCount === 0}
            >
              🚀 POST {validCount} SLOTS
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Submitting */}
      {step === "submitting" && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Creating {validCount} slots...</p>
        </div>
      )}

      {/* Step 4: Done */}
      {step === "done" && (
        <div className={styles.done}>
          <p className={styles.doneText}>✅ {created} slots created</p>
          <button
            className={styles.submitButton}
            onClick={() => {
              onComplete?.();
              onClose?.();
            }}
          >
            DONE
          </button>
        </div>
      )}
    </div>
  );
}
