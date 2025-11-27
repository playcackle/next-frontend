"use client";

import { useState, useRef } from "react";
import { topicsApi, type CSVUploadResponse } from "@/lib/api/admin";
import styles from "./SlotCSVUpload.module.css";

interface SlotCSVUploadProps {
  onUploadComplete?: () => void;
}

export default function SlotCSVUpload({ onUploadComplete }: SlotCSVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<CSVUploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');
      if (!isExcel) {
        setError("Please select an Excel file (.xlsx or .xls)");
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const uploadResult = await topicsApi.uploadExcel(file, {
        updateExisting,
      });

      setResult(uploadResult);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload Excel file");
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setError(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.neonText}>UPLOAD</span>
          <span className={styles.neonTextPink}>SLOTS</span>
        </h2>
        <p className={styles.subtitle}>
          Bulk import slots from Excel format (matches populate_initial_data)
        </p>
      </div>

      {/* File Selection */}
      <div className={styles.fileSection}>
        <label className={styles.fileLabel}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className={styles.fileInput}
            disabled={uploading}
          />
          <span className={styles.fileButton}>
            {file ? "📄 CHANGE FILE" : "📁 SELECT EXCEL FILE"}
          </span>
        </label>

        {file && (
          <div className={styles.fileName}>
            <span className={styles.fileIcon}>✓</span>
            {file.name}
          </div>
        )}
      </div>

      {/* Options */}
      <div className={styles.options}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={updateExisting}
            onChange={(e) => setUpdateExisting(e.target.checked)}
            disabled={uploading}
            className={styles.checkbox}
          />
          <span>Update existing topics if they already exist</span>
        </label>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          className={styles.uploadButton}
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? "⏳ UPLOADING..." : "⬆️ UPLOAD SLOTS"}
        </button>

        {file && !uploading && (
          <button className={styles.clearButton} onClick={handleClear}>
            ✖️ CLEAR
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className={styles.error}>
          <p className={styles.errorTitle}>⚠️ ERROR</p>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className={styles.result}>
          <div className={styles.resultHeader}>
            <p className={styles.resultTitle}>
              {result.status === "success" ? "✓ SUCCESS" : "⚠️ PARTIAL SUCCESS"}
            </p>
            <p className={styles.resultMessage}>{result.message}</p>
          </div>

          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Topics Created:</span>
              <span className={styles.statValue}>{result.topics_created}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Topics Updated:</span>
              <span className={styles.statValue}>{result.topics_updated}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Slots Created:</span>
              <span className={styles.statValue}>{result.total_slots_created}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Aliases Created:</span>
              <span className={styles.statValue}>{result.total_aliases_created}</span>
            </div>
          </div>

          {/* Details */}
          {result.details.length > 0 && (
            <div className={styles.details}>
              <p className={styles.detailsTitle}>Topic Details:</p>
              {result.details.map((detail, idx) => (
                <div key={idx} className={styles.detailItem}>
                  <span className={styles.detailName}>{detail.topic_name}</span>
                  <span className={styles.detailStats}>
                    {detail.slots_created} slots, {detail.aliases_created} aliases
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className={styles.errors}>
              <p className={styles.errorsTitle}>Errors Encountered:</p>
              {result.errors.map((err, idx) => (
                <p key={idx} className={styles.errorItem}>
                  • {err}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Excel Format Help */}
      <details className={styles.help}>
        <summary className={styles.helpSummary}>📖 Excel Format Help</summary>
        <div className={styles.helpContent}>
          <p className={styles.helpTitle}>Excel Structure:</p>
          <ul className={styles.helpList}>
            <li><strong>Rows are grouped by "Category name"</strong> - each unique category becomes a topic</li>
            <li>Sheet names don't matter - organize your Excel however you want</li>
            <li>Multiple topics can be in a single sheet</li>
            <li>First row's "Prompt" per category becomes the topic prompt</li>
            <li>Row with Answer type "Example" sets the topic example</li>
          </ul>

          <p className={styles.helpTitle}>Required columns:</p>
          <ul className={styles.helpList}>
            <li><code>Category name</code> - Groups rows into topics (required)</li>
            <li><code>Prompt</code> - Topic-level prompt (first per category is used)</li>
            <li><code>Answer type</code> - Example, Normal, or Rare</li>
            <li><code>Answer</code> - The canonical answer text</li>
          </ul>

          <p className={styles.helpTitle}>Optional columns:</p>
          <ul className={styles.helpList}>
            <li><code>Aliases</code> - Comma-separated alternatives (e.g., "alias1, alias2")</li>
            <li><code>BotBob Clue</code> - Hint text for BotBob</li>
          </ul>

          <p className={styles.helpTitle}>Example (multiple topics in one sheet):</p>
          <pre className={styles.helpCode}>
{`Category name   | Prompt                  | Answer type | Answer        | Aliases        | BotBob Clue
Olympic Sports  | Winter or Summer sports | Example     | Swimming      | swim, swimming | Pool splashers
Olympic Sports  | Winter or Summer sports | Normal      | Alpine Skiing | alpine, skiing | Slope shredders
Olympic Sports  | Winter or Summer sports | Rare        | Biathlon      | biathlon, ski  | Ski snipers
Car Brands      | Name that car company   | Example     | Toyota        | toyota motors  | Japanese giant
Car Brands      | Name that car company   | Normal      | Ford          | ford motors    | Blue oval`}
          </pre>

          <p className={styles.helpNote}>
            ✨ <strong>New!</strong> Categories determine topics, not sheet names. Put as many topics as you want in one sheet!
            Topics are created without collection assignments - link them to collections afterward.
          </p>
        </div>
      </details>
    </div>
  );
}
