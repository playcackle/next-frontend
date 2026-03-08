"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { lobbiesApi, type Lobby } from "@/lib/api/admin";
import styles from "./page.module.css";

export default function LobbiesPage() {
  const router = useRouter();
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load lobbies on mount and refresh every 5 seconds
  useEffect(() => {
    loadLobbies();
    const interval = setInterval(loadLobbies, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadLobbies = async () => {
    try {
      setError(null);
      const data = await lobbiesApi.getAll();
      setLobbies(data || []);
    } catch (err) {
      console.error("Failed to load lobbies:", err);
      setError(err instanceof Error ? err.message : "Failed to load lobbies");
      setLobbies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigure = (lobbyId: string) => {
    router.push(`/admin/lobbies/${lobbyId}`);
  };

  const handleForceReset = async (lobbyId: string) => {
    if (!confirm("Are you sure you want to force reset this gameroom?\n\nThis will interrupt active gameplay.")) {
      return;
    }

    try {
      await lobbiesApi.forceReset(lobbyId, "Admin forced reset");
      alert("Gameroom reset successfully");
      loadLobbies();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reset gameroom");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "WAITING":
        return "#ffc107";
      case "IN_ROUND":
        return "#00ff00";
      case "ROUND_BREAK":
        return "#00ffff";
      case "GAME_OVER":
        return "#ff00ff";
      default:
        return "#999";
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.neonText}>ACTIVE</span>
          <span className={styles.neonTextPink}>GAMEROOMS</span>
        </h1>
        <p className={styles.subtitle}>
          Monitor and configure running gameroom instances
        </p>
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className={styles.errorContainer}>
          <div className={styles.errorBox}>
            <h3>Failed to load gamerooms</h3>
            <p>{error}</p>
            <button className={styles.retryButton} onClick={loadLobbies}>
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading gamerooms...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && lobbies.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyMessage}>
            No active gamerooms found. Start a gameroom service to see it appear here.
          </p>
        </div>
      )}

      {/* Lobbies Grid */}
      {!loading && !error && lobbies.length > 0 && (
        <div className={styles.lobbiesGrid}>
          {lobbies.map((lobby) => (
            <div key={lobby.lobby_id} className={styles.lobbyCard}>
              <div className={styles.lobbyHeader}>
                <h3 className={styles.lobbyTitle}>
                  Gameroom
                  <span className={styles.lobbyId}>#{lobby.lobby_id.slice(0, 8)}</span>
                </h3>
                <div
                  className={styles.statusBadge}
                  style={{ backgroundColor: getStatusColor(lobby.status) }}
                >
                  {lobby.status}
                </div>
              </div>

              <div className={styles.lobbyInfo}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Players:</span>
                  <span className={styles.infoValue}>{lobby.player_count}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Collection:</span>
                  <span className={styles.infoValue}>
                    {lobby.collection_name || "None"}
                  </span>
                </div>
                {lobby.configuration && (
                  <>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Rounds:</span>
                      <span className={styles.infoValue}>
                        {lobby.configuration.num_rounds || "N/A"}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Round Time:</span>
                      <span className={styles.infoValue}>
                        {lobby.configuration.round_duration || "N/A"}s
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className={styles.lobbyActions}>
                <button
                  className={styles.configureButton}
                  onClick={() => handleConfigure(lobby.lobby_id)}
                >
                  Configure
                </button>
                <button
                  className={styles.resetButton}
                  onClick={() => handleForceReset(lobby.lobby_id)}
                >
                  Force Reset
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
