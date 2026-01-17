"use client";

import { useState, useEffect, useCallback } from "react";
import { botsApi, type BotInfo } from "@/lib/api/admin";
import * as Slider from "@radix-ui/react-slider";
import styles from "./BotControls.module.css";

interface BotControlsProps {
  lobbyId: string;
}

export function BotControls({ lobbyId }: BotControlsProps) {
  const [botCount, setBotCount] = useState(5);
  const [accuracy, setAccuracy] = useState(70); // Percentage (0-100)
  const [activeBots, setActiveBots] = useState<BotInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBotStatus = useCallback(async () => {
    try {
      setError(null);
      const response = await botsApi.getInLobby(lobbyId);
      setActiveBots(response.bots);
    } catch (err) {
      console.error("Failed to load bot status:", err);
      setError(err instanceof Error ? err.message : "Failed to load bots");
    }
  }, [lobbyId]);

  useEffect(() => {
    loadBotStatus();
    // Refresh every 5 seconds
    const interval = setInterval(loadBotStatus, 5000);
    return () => clearInterval(interval);
  }, [loadBotStatus]);

  const handleAddBots = async () => {
    if (botCount === 0) return;

    setLoading(true);
    setError(null);

    try {
      await botsApi.addToLobby(lobbyId, {
        count: botCount,
        accuracy: accuracy / 100, // Convert percentage to 0-1
        typo_rate: 0.2,
      });
      await loadBotStatus();
    } catch (err) {
      console.error("Failed to add bots:", err);
      setError(err instanceof Error ? err.message : "Failed to add bots");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAll = async () => {
    if (activeBots.length === 0) return;

    if (!confirm(`Remove all ${activeBots.length} bots from this lobby?`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await botsApi.removeFromLobby(lobbyId);
      await loadBotStatus();
    } catch (err) {
      console.error("Failed to remove bots:", err);
      setError(err instanceof Error ? err.message : "Failed to remove bots");
    } finally {
      setLoading(false);
    }
  };

  const getAccuracyLabel = (acc: number): string => {
    if (acc >= 85) return "Expert";
    if (acc >= 65) return "Casual";
    if (acc >= 45) return "Struggling";
    return "Very Poor";
  };

  const getAccuracyColor = (acc: number): string => {
    if (acc >= 85) return "#00ff00";
    if (acc >= 65) return "#ffff00";
    if (acc >= 45) return "#ff8800";
    return "#ff0000";
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>Bot Stress Testing</h2>

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}

      <div className={styles.statusBar}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Active Bots:</span>
          <span className={styles.statValue}>{activeBots.length}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Running:</span>
          <span className={styles.statValue}>
            {activeBots.filter((b) => b.status === "running").length}
          </span>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <div className={styles.controlHeader}>
            <label className={styles.controlLabel}>Number of Bots to Add</label>
            <span className={styles.controlValue}>{botCount}</span>
          </div>
          <Slider.Root
            className={styles.sliderRoot}
            value={[botCount]}
            onValueChange={([value]) => setBotCount(value)}
            min={0}
            max={15}
            step={1}
          >
            <Slider.Track className={styles.sliderTrack}>
              <Slider.Range className={styles.sliderRange} />
            </Slider.Track>
            <Slider.Thumb className={styles.sliderThumb} />
          </Slider.Root>
          <div className={styles.sliderLabels}>
            <span>0</span>
            <span>15</span>
          </div>
        </div>

        <div className={styles.controlGroup}>
          <div className={styles.controlHeader}>
            <label className={styles.controlLabel}>Bot Accuracy</label>
            <span
              className={styles.controlValue}
              style={{ color: getAccuracyColor(accuracy) }}
            >
              {accuracy}% ({getAccuracyLabel(accuracy)})
            </span>
          </div>
          <Slider.Root
            className={styles.sliderRoot}
            value={[accuracy]}
            onValueChange={([value]) => setAccuracy(value)}
            min={30}
            max={95}
            step={5}
          >
            <Slider.Track className={styles.sliderTrack}>
              <Slider.Range className={styles.sliderRange} />
            </Slider.Track>
            <Slider.Thumb className={styles.sliderThumb} />
          </Slider.Root>
          <div className={styles.sliderLabels}>
            <span>30%</span>
            <span>95%</span>
          </div>
          <p className={styles.hint}>
            Higher accuracy means bots will submit more correct answers (with occasional
            typos)
          </p>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.addButton}
          onClick={handleAddBots}
          disabled={loading || botCount === 0}
        >
          {loading ? "Adding..." : `Add ${botCount} Bot${botCount !== 1 ? "s" : ""}`}
        </button>
        <button
          className={styles.removeButton}
          onClick={handleRemoveAll}
          disabled={loading || activeBots.length === 0}
        >
          {loading ? "Removing..." : "Remove All Bots"}
        </button>
      </div>

      {activeBots.length > 0 && (
        <div className={styles.botList}>
          <h3 className={styles.botListTitle}>
            Active Bots in Lobby ({activeBots.length})
          </h3>
          <ul className={styles.botItems}>
            {activeBots.map((bot) => (
              <li key={bot.name} className={styles.botItem}>
                <span className={styles.botName}>{bot.name}</span>
                <span
                  className={styles.botStatus}
                  data-status={bot.status}
                >
                  {bot.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
