"use client";

import { useState, useEffect } from "react";
import { slotsApi, aliasesApi, type Slot, type SlotDetail } from "@/lib/api/admin";
import styles from "./SlotBulkEdit.module.css";

type EditableSlot = {
  id: number;
  canonical_text: string;
  prompt: string;
  bot_bob_clue: string;
  is_rare: boolean;
  aliases: string[];
};

type SlotDiff = {
  id: number;
  original: EditableSlot;
  edited: EditableSlot;
  changes: (keyof Omit<EditableSlot, "id">)[];
  error?: string;
};

function slotsToJson(slots: SlotDetail[]): string {
  const editable = slots.map((s) => ({
    id: s.id,
    canonical_text: s.canonical_text,
    prompt: s.prompt,
    bot_bob_clue: s.bot_bob_clue ?? "",
    is_rare: s.is_rare,
    aliases: s.aliases.map((a) => a.alias_text),
  }));
  return JSON.stringify(editable, null, 2);
}

function computeDiff(
  rawText: string,
  existingSlots: Slot[],
  slotDetailMap: Map<number, SlotDetail>
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

  const editedCanonicals = new Map<string, number>();
  for (const s of existingSlots) {
    editedCanonicals.set(s.canonical_text.trim().toLowerCase(), s.id);
  }
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
        original: { id: -1, canonical_text: "", prompt: "", bot_bob_clue: "", is_rare: false, aliases: [] },
        edited: { id: -1, canonical_text: "", prompt: "", bot_bob_clue: "", is_rare: false, aliases: [] },
        changes: [],
        error: "missing or invalid id",
      });
      continue;
    }

    const original = byId.get(id);
    if (!original) {
      diffs.push({
        id,
        original: { id, canonical_text: "", prompt: "", bot_bob_clue: "", is_rare: false, aliases: [] },
        edited: { id, canonical_text: "", prompt: "", bot_bob_clue: "", is_rare: false, aliases: [] },
        changes: [],
        error: `id ${id} not found in topic`,
      });
      continue;
    }

    const detail = slotDetailMap.get(id);
    const originalAliases = detail ? detail.aliases.map((a) => a.alias_text) : [];

    let editedAliases: string[] = [];
    if (Array.isArray(obj.aliases)) {
      editedAliases = obj.aliases
        .filter((a): a is string => typeof a === "string")
        .map((a) => a.trim())
        .filter(Boolean);
    }

    const edited: EditableSlot = {
      id,
      canonical_text: typeof obj.canonical_text === "string" ? obj.canonical_text.trim() : original.canonical_text,
      prompt: typeof obj.prompt === "string" ? obj.prompt.trim() : original.prompt,
      bot_bob_clue: typeof obj.bot_bob_clue === "string" ? obj.bot_bob_clue : (original.bot_bob_clue ?? ""),
      is_rare: typeof obj.is_rare === "boolean" ? obj.is_rare : original.is_rare,
      aliases: editedAliases,
    };

    const orig: EditableSlot = {
      id,
      canonical_text: original.canonical_text,
      prompt: original.prompt,
      bot_bob_clue: original.bot_bob_clue ?? "",
      is_rare: original.is_rare,
      aliases: originalAliases,
    };

    const scalarChanges = (["canonical_text", "prompt", "bot_bob_clue", "is_rare"] as const).filter(
      (k) => edited[k] !== orig[k]
    );

    const origAliasSet = new Set(orig.aliases.map((a) => a.toLowerCase().trim()));
    const editedAliasSet = new Set(edited.aliases.map((a) => a.toLowerCase().trim()));
    const aliasesChanged =
      origAliasSet.size !== editedAliasSet.size ||
      [...origAliasSet].some((a) => !editedAliasSet.has(a));

    const changes: (keyof Omit<EditableSlot, "id">)[] = [
      ...scalarChanges,
      ...(aliasesChanged ? (["aliases"] as const) : []),
    ];

    if (changes.length === 0) continue;

    let error: string | undefined;
    if (!edited.canonical_text) {
      error = "canonical_text cannot be empty";
    } else if (!edited.prompt) {
      error = "prompt cannot be empty";
    } else if (scalarChanges.includes("canonical_text")) {
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
  const [step, setStep] = useState<"loading" | "edit" | "review" | "saving" | "done">("loading");
  const [slotDetailMap, setSlotDetailMap] = useState<Map<number, SlotDetail>>(new Map());
  const [jsonText, setJsonText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [diffs, setDiffs] = useState<SlotDiff[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    Promise.all(existingSlots.map((s) => slotsApi.getById(s.id)))
      .then((details) => {
        const map = new Map(details.map((d) => [d.id, d]));
        setSlotDetailMap(map);
        setJsonText(slotsToJson(details));
        setStep("edit");
      })
      .catch(() => {
        setJsonText(
          JSON.stringify(
            existingSlots.map((s) => ({
              id: s.id,
              canonical_text: s.canonical_text,
              prompt: s.prompt,
              bot_bob_clue: s.bot_bob_clue ?? "",
              is_rare: s.is_rare,
              aliases: [],
            })),
            null,
            2
          )
        );
        setStep("edit");
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReview = () => {
    const { diffs: computed, parseError: err } = computeDiff(jsonText, existingSlots, slotDetailMap);
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
        valid.map(async (d) => {
          const scalarFields = ["canonical_text", "prompt", "bot_bob_clue", "is_rare"] as const;
          const hasScalarChange = scalarFields.some((f) => d.changes.includes(f));

          if (hasScalarChange) {
            await slotsApi.update(d.id, {
              canonical_text: d.edited.canonical_text,
              prompt: d.edited.prompt,
              bot_bob_clue: d.edited.bot_bob_clue || undefined,
              is_rare: d.edited.is_rare,
            });
          }

          if (d.changes.includes("aliases")) {
            const detail = slotDetailMap.get(d.id);
            const existingAliases = detail?.aliases ?? [];

            const origAliasTexts = new Set(existingAliases.map((a) => a.alias_text.toLowerCase().trim()));
            const newAliasTexts = new Set(d.edited.aliases.map((a) => a.toLowerCase().trim()));

            const toDelete = existingAliases.filter(
              (a) => !newAliasTexts.has(a.alias_text.toLowerCase().trim())
            );
            const toCreate = d.edited.aliases.filter(
              (a) => !origAliasTexts.has(a.toLowerCase().trim())
            );

            await Promise.all([
              ...toDelete.map((a) => aliasesApi.delete(a.id)),
              ...toCreate.map((a) => aliasesApi.create(d.id, { alias_text: a })),
            ]);
          }
        })
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

  const resetToOriginal = () => {
    const details = existingSlots.map((s) => {
      const d = slotDetailMap.get(s.id);
      return d ?? ({ ...s, aliases: [] } as SlotDetail);
    });
    setJsonText(slotsToJson(details));
    setParseError(null);
  };

  const validDiffs = diffs.filter((d) => !d.error);
  const errorDiffs = diffs.filter((d) => d.error);

  const renderDiffValue = (field: keyof Omit<EditableSlot, "id">, slot: EditableSlot): string => {
    if (field === "aliases") {
      return slot.aliases.length > 0 ? slot.aliases.join(", ") : "—";
    }
    return String(slot[field]) || "—";
  };

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

      {/* Step 0: Loading slot details */}
      {step === "loading" && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Loading slot details...</p>
        </div>
      )}

      {/* Step 1: Edit */}
      {step === "edit" && (
        <div className={styles.form}>
          <div className={styles.formField}>
            <label className={styles.label}>
              Edit slots JSON{" "}
              <span className={styles.hint}>
                — {existingSlots.length} slots · id, canonical_text, prompt, bot_bob_clue, is_rare, aliases
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
            <button className={styles.resetButton} onClick={resetToOriginal}>
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
                      <span className={styles.diffOld}>{renderDiffValue(field, d.original)}</span>
                      <span className={styles.diffArrow}>→</span>
                      <span className={styles.diffNew}>{renderDiffValue(field, d.edited)}</span>
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
