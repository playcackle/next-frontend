"use client";

import { useState } from "react";
import { slotsApi, type Slot } from "@/lib/api/admin";
import styles from "./SlotBulkEdit.module.css";

type EditableSlot = {
  id: number;
  canonical_text: string;
  prompt: string;
  bot_bob_clue: string;
  is_rare: boolean;
};

type SlotDiff = {
  id: number;
  original: EditableSlot;
  edited: EditableSlot;
  changes: (keyof Omit<EditableSlot, "id">)[];
  error?: string;
};

function slotsToJson(slots: Slot[]): string {
  const editable = slots.map((s) => ({
    id: s.id,
    canonical_text: s.canonical_text,
    prompt: s.prompt,
    bot_bob_clue: s.bot_bob_clue ?? "",
    is_rare: s.is_rare,
  }));
  return JSON.stringify(editable, null, 2);
}

function computeDiff(
  rawText: string,
  existingSlots: Slot[]
): { diffs: SlotDiff[]; parseError: string | null } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText.trim());
  } catch {
    return { diffs: [], parseError: "Invalid JSON — check for trailing commas or missing brackets" };
  }

  if (!Array.isArray(parsed)) {
    return { diffs: [], parseError: "Expected a JSON array" };
  }

  const byId = new Map<number, Slot>(existingSlots.map((s) => [s.id, s]));

  // Build the full canonical_text map after applying all edits (for uniqueness check)
  const editedCanonicals = new Map<string, number>(); // canonical_lower → id
  // Start with all existing slots
  for (const s of existingSlots) {
    editedCanonicals.set(s.canonical_text.trim().toLowerCase(), s.id);
  }
  // Apply edited values (overwrite)
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    if (typeof obj.id !== "number") continue;
    const canonical = typeof obj.canonical_text === "string" ? obj.canonical_text.trim() : "";
    if (canonical) editedCanonicals.set(canonical.toLowerCase(), obj.id as number);
  }

  const diffs: SlotDiff[] = [];

  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;

    const id = typeof obj.id === "number" ? obj.id : NaN;

    if (isNaN(id)) {
      diffs.push({
        id: -1,
        original: { id: -1, canonical_text: "", prompt: "", bot_bob_clue: "", is_rare: false },
        edited: { id: -1, canonical_text: "", prompt: "", bot_bob_clue: "", is_rare: false },
        changes: [],
        error: "missing or invalid id",
      });
      continue;
    }

    const original = byId.get(id);
    if (!original) {
      diffs.push({
        id,
        original: { id, canonical_text: "", prompt: "", bot_bob_clue: "", is_rare: false },
        edited: { id, canonical_text: "", prompt: "", bot_bob_clue: "", is_rare: false },
        changes: [],
        error: `id ${id} not found in topic`,
      });
      continue;
    }

    const edited: EditableSlot = {
      id,
      canonical_text: typeof obj.canonical_text === "string" ? obj.canonical_text.trim() : original.canonical_text,
      prompt: typeof obj.prompt === "string" ? obj.prompt.trim() : original.prompt,
      bot_bob_clue: typeof obj.bot_bob_clue === "string" ? obj.bot_bob_clue : (original.bot_bob_clue ?? ""),
      is_rare: typeof obj.is_rare === "boolean" ? obj.is_rare : original.is_rare,
    };

    const orig: EditableSlot = {
      id,
      canonical_text: original.canonical_text,
      prompt: original.prompt,
      bot_bob_clue: original.bot_bob_clue ?? "",
      is_rare: original.is_rare,
    };

    const changes = (["canonical_text", "prompt", "bot_bob_clue", "is_rare"] as const).filter(
      (k) => edited[k] !== orig[k]
    );

    if (changes.length === 0) continue; // unchanged — skip

    // Validate
    let error: string | undefined;
    if (!edited.canonical_text) {
      error = "canonical_text cannot be empty";
    } else if (!edited.prompt) {
      error = "prompt cannot be empty";
    } else if (changes.includes("canonical_text")) {
      const key = edited.canonical_text.toLowerCase();
      const ownerOfKey = editedCanonicals.get(key);
      if (ownerOfKey !== undefined && ownerOfKey !== id) {
        error = `"${edited.canonical_text}" already used by id ${ownerOfKey}`;
      }
    }

    diffs.push({ id, original: orig, edited, changes, error });
  }

  return { diffs, parseError: null };
}

interface SlotBulkEditProps {
  existingSlots: Slot[];
  onComplete?: () => void;
  onClose?: () => void;
}

export default function SlotBulkEdit({ existingSlots, onComplete, onClose }: SlotBulkEditProps) {
  const [step, setStep] = useState<"edit" | "review" | "saving" | "done">("edit");
  const [jsonText, setJsonText] = useState(() => slotsToJson(existingSlots));
  const [parseError, setParseError] = useState<string | null>(null);
  const [diffs, setDiffs] = useState<SlotDiff[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  const handleReview = () => {
    const { diffs: computed, parseError: err } = computeDiff(jsonText, existingSlots);
    if (err) {
      setParseError(err);
      return;
    }
    setParseError(null);
    setDiffs(computed);
    setStep("review");
  };

  const handleSave = async () => {
    const valid = diffs.filter((d) => !d.error);
    if (valid.length === 0) return;

    setSaveError(null);
    setStep("saving");

    try {
      const results = await Promise.allSettled(
        valid.map((d) =>
          slotsApi.update(d.id, {
            canonical_text: d.edited.canonical_text,
            prompt: d.edited.prompt,
            bot_bob_clue: d.edited.bot_bob_clue || undefined,
            is_rare: d.edited.is_rare,
          })
        )
      );

      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        setSaveError(`${failed.length} slot(s) failed to update`);
        setStep("review");
        return;
      }

      setSavedCount(valid.length);
      setStep("done");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
      setStep("review");
    }
  };

  const validDiffs = diffs.filter((d) => !d.error);
  const errorDiffs = diffs.filter((d) => d.error);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>✏️ Bulk Edit Slots as JSON</h3>
        {onClose && (
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      {saveError && (
        <div className={styles.error}>
          {saveError}
          <button onClick={() => setSaveError(null)}>✕</button>
        </div>
      )}

      {/* Step 1: Edit */}
      {step === "edit" && (
        <div className={styles.form}>
          <div className={styles.formField}>
            <label className={styles.label}>
              Edit slots JSON{" "}
              <span className={styles.hint}>
                — {existingSlots.length} slots · id, canonical_text, prompt, bot_bob_clue, is_rare
              </span>
            </label>
            <textarea
              className={styles.jsonTextarea}
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setParseError(null);
              }}
              rows={20}
              spellCheck={false}
            />
            {parseError && <p className={styles.parseError}>⚠ {parseError}</p>}
          </div>
          <div className={styles.formActions}>
            <button className={styles.resetButton} onClick={() => setJsonText(slotsToJson(existingSlots))}>
              ↺ RESET
            </button>
            <button className={styles.submitButton} onClick={handleReview} disabled={!jsonText.trim()}>
              🔍 REVIEW CHANGES
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Review diff */}
      {step === "review" && (
        <div className={styles.review}>
          <div className={styles.reviewSummary}>
            {diffs.length === 0 ? (
              <span className={styles.noDiffs}>No changes detected</span>
            ) : (
              <>
                <span className={styles.validBadge}>{validDiffs.length} to update</span>
                {errorDiffs.length > 0 && (
                  <span className={styles.invalidBadge}>{errorDiffs.length} blocked</span>
                )}
              </>
            )}
          </div>

          {diffs.length > 0 && (
            <div className={styles.diffList}>
              {diffs.map((d) => (
                <div key={d.id} className={`${styles.diffCard} ${d.error ? styles.diffCardError : ""}`}>
                  <div className={styles.diffCardHeader}>
                    <span className={styles.diffCanonical}>{d.edited.canonical_text || d.original.canonical_text}</span>
                    <span className={styles.diffId}>id {d.id}</span>
                    {d.error && <span className={styles.diffError}>{d.error}</span>}
                  </div>
                  {d.changes.map((field) => (
                    <div key={field} className={styles.diffRow}>
                      <span className={styles.diffField}>{field}</span>
                      <span className={styles.diffOld}>{String(d.original[field]) || "—"}</span>
                      <span className={styles.diffArrow}>→</span>
                      <span className={styles.diffNew}>{String(d.edited[field]) || "—"}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className={styles.reviewActions}>
            <button className={styles.cancelButton} onClick={() => setStep("edit")}>
              ← BACK
            </button>
            <button
              className={styles.submitButton}
              onClick={handleSave}
              disabled={validDiffs.length === 0}
            >
              💾 SAVE {validDiffs.length} SLOTS
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Saving */}
      {step === "saving" && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Updating {validDiffs.length} slots...</p>
        </div>
      )}

      {/* Step 4: Done */}
      {step === "done" && (
        <div className={styles.done}>
          <p className={styles.doneText}>✅ {savedCount} slots updated</p>
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
