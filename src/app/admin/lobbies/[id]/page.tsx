"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  lobbiesApi,
  collectionsApi,
  hostSettingsApi,
  fuzzyMatchConfigApi,
  type Lobby,
  type Collection,
  type GameConfigurationParameters,
  type HostSettings,
  type FuzzyMatchConfig,
} from "@/lib/api/admin";
import * as Slider from "@radix-ui/react-slider";
import * as Select from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import styles from "./page.module.css";

export default function LobbyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const lobbyId = params.id as string;

  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Parameter state
  const [config, setConfig] = useState<GameConfigurationParameters>({
    num_rounds: 10,
    round_duration: 150,
    round_break_duration: 90,
    max_normal_slots: 8,
    max_rare_slots: 2,
    min_players_to_start: 2,
    game_start_delay: 10,
    new_game_wait_duration: 30,
    points_normal_slot: 100,
    points_rare_slot: 250,
    max_players: 25,
  });

  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);
  const [applyMode, setApplyMode] = useState<"on_next_reset" | "immediate">("on_next_reset");

  // Host settings state
  const [hostSettings, setHostSettings] = useState<HostSettings | null>(null);
  const [hostSettingsLoading, setHostSettingsLoading] = useState(false);
  const [hostSettingsSaving, setHostSettingsSaving] = useState(false);

  // Fuzzy match config state
  const [fuzzyMatchConfig, setFuzzyMatchConfig] = useState<FuzzyMatchConfig | null>(null);
  const [fuzzyMatchLoading, setFuzzyMatchLoading] = useState(false);
  const [fuzzyMatchSaving, setFuzzyMatchSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [lobbyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [lobbyData, collectionsData] = await Promise.all([
        lobbiesApi.getById(lobbyId),
        collectionsApi.getAll(),
      ]);

      setLobby(lobbyData);
      setCollections(collectionsData);

      // Set config from lobby or use defaults
      if (lobbyData.configuration) {
        setConfig((prev) => ({ ...prev, ...lobbyData.configuration }));
      }

      if (lobbyData.collection_id) {
        setSelectedCollection(lobbyData.collection_id);
      }

      // Load host settings and fuzzy match config
      loadHostSettings();
      loadFuzzyMatchConfig();
    } catch (err) {
      console.error("Failed to load lobby:", err);
      setError(err instanceof Error ? err.message : "Failed to load lobby");
    } finally {
      setLoading(false);
    }
  };

  const loadHostSettings = async () => {
    try {
      setHostSettingsLoading(true);
      const settings = await hostSettingsApi.get(lobbyId);
      setHostSettings(settings);
    } catch (err) {
      console.error("Failed to load host settings:", err);
      // Don't set error state, just log it - host settings are optional
    } finally {
      setHostSettingsLoading(false);
    }
  };

  const loadFuzzyMatchConfig = async () => {
    try {
      setFuzzyMatchLoading(true);
      const config = await fuzzyMatchConfigApi.get(lobbyId);
      setFuzzyMatchConfig(config);
    } catch (err) {
      console.error("Failed to load fuzzy match config:", err);
      // Don't set error state, just log it - optional
    } finally {
      setFuzzyMatchLoading(false);
    }
  };

  const updateHostSetting = async <K extends keyof HostSettings>(
    key: K,
    value: HostSettings[K]
  ) => {
    if (!hostSettings) return;

    try {
      setHostSettingsSaving(true);
      const updated = await hostSettingsApi.update(lobbyId, {
        [key]: value,
      });
      setHostSettings(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update host setting");
      // Revert the change in UI
      loadHostSettings();
    } finally {
      setHostSettingsSaving(false);
    }
  };

  const updateFuzzyMatchSetting = async <K extends keyof FuzzyMatchConfig>(
    key: K,
    value: FuzzyMatchConfig[K]
  ) => {
    if (!fuzzyMatchConfig) return;

    try {
      setFuzzyMatchSaving(true);
      const updated = await fuzzyMatchConfigApi.update(lobbyId, {
        [key]: value,
      });
      setFuzzyMatchConfig(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update fuzzy match setting");
      // Revert the change in UI
      loadFuzzyMatchConfig();
    } finally {
      setFuzzyMatchSaving(false);
    }
  };

  const handleSaveConfiguration = async () => {
    try {
      setSaving(true);
      await lobbiesApi.reconfigure(lobbyId, {
        parameters: config,
        apply_mode: applyMode,
      });
      alert(
        applyMode === "immediate"
          ? "Configuration applied immediately. Game has been reset."
          : "Configuration scheduled. Will apply on next game reset."
      );
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleChangeCollection = async () => {
    if (!selectedCollection) {
      alert("Please select a collection");
      return;
    }

    try {
      setSaving(true);
      await lobbiesApi.changeGameroomCollection(lobbyId, {
        collection_id: selectedCollection,
        apply_immediately: applyMode === "immediate",
      });
      alert(
        applyMode === "immediate"
          ? "Collection changed and game reset."
          : "Collection change scheduled for next reset."
      );
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to change collection");
    } finally {
      setSaving(false);
    }
  };

  const handleForceReset = async () => {
    if (!confirm("Force reset this gameroom?\n\nThis will interrupt active gameplay.")) {
      return;
    }

    try {
      await lobbiesApi.forceReset(lobbyId, "Admin forced reset");
      alert("Gameroom reset successfully");
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reset gameroom");
    }
  };

  const handleResetToDefaults = () => {
    if (!confirm("Reset all parameters to default values?")) {
      return;
    }

    setConfig({
      num_rounds: 10,
      round_duration: 150,
      round_break_duration: 90,
      max_normal_slots: 8,
      max_rare_slots: 2,
      min_players_to_start: 2,
      game_start_delay: 10,
      new_game_wait_duration: 30,
      points_normal_slot: 100,
      points_rare_slot: 250,
      max_players: 25,
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading gameroom configuration...</p>
        </div>
      </div>
    );
  }

  if (error || !lobby) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h3>Failed to load gameroom</h3>
          <p>{error}</p>
          <button className={styles.button} onClick={() => router.back()}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => router.back()}>
          ← Back to Lobbies
        </button>
        <h1 className={styles.title}>
          <span className={styles.neonText}>GAMEROOM</span>
          <span className={styles.neonTextPink}>CONFIG</span>
        </h1>
        <p className={styles.subtitle}>
          Lobby: <span className={styles.lobbyId}>{lobbyId.slice(0, 16)}</span>
        </p>
      </div>

      {/* Apply Mode Toggle */}
      <div className={styles.applyModeSection}>
        <label className={styles.sectionTitle}>Apply Mode</label>
        <div className={styles.applyModeButtons}>
          <button
            className={`${styles.applyModeButton} ${
              applyMode === "on_next_reset" ? styles.active : ""
            }`}
            onClick={() => setApplyMode("on_next_reset")}
          >
            On Next Reset (Graceful)
          </button>
          <button
            className={`${styles.applyModeButton} ${
              applyMode === "immediate" ? styles.active : ""
            }`}
            onClick={() => setApplyMode("immediate")}
          >
            Immediate (Disruptive)
          </button>
        </div>
      </div>

      {/* Collection Selector */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Collection</h2>
        <div className={styles.collectionControls}>
          <Select.Root
            value={selectedCollection?.toString()}
            onValueChange={(value) => setSelectedCollection(Number(value))}
          >
            <Select.Trigger className={styles.selectTrigger}>
              <Select.Value placeholder="Select a collection" />
              <Select.Icon>
                <ChevronDown size={16} />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className={styles.selectContent}>
                <Select.Viewport>
                  {collections.map((collection) => (
                    <Select.Item
                      key={collection.id}
                      value={collection.id.toString()}
                      className={styles.selectItem}
                    >
                      <Select.ItemText>{collection.name}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
          <button
            className={styles.changeCollectionButton}
            onClick={handleChangeCollection}
            disabled={saving}
          >
            Change Collection
          </button>
        </div>
      </div>

      {/* Game Parameters */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Game Structure</h2>
        <div className={styles.parameterGrid}>
          <ParameterSlider
            label="Number of Rounds"
            value={config.num_rounds || 10}
            onChange={(value) => setConfig({ ...config, num_rounds: value })}
            min={1}
            max={50}
            unit="rounds"
          />
          <ParameterSlider
            label="Max Normal Slots"
            value={config.max_normal_slots || 8}
            onChange={(value) => setConfig({ ...config, max_normal_slots: value })}
            min={1}
            max={20}
            unit="slots"
          />
          <ParameterSlider
            label="Max Rare Slots"
            value={config.max_rare_slots || 2}
            onChange={(value) => setConfig({ ...config, max_rare_slots: value })}
            min={0}
            max={10}
            unit="slots"
          />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Timing</h2>
        <div className={styles.parameterGrid}>
          <ParameterSlider
            label="Round Duration"
            value={config.round_duration || 150}
            onChange={(value) => setConfig({ ...config, round_duration: value })}
            min={30}
            max={600}
            unit="seconds"
          />
          <ParameterSlider
            label="Round Break Duration"
            value={config.round_break_duration || 90}
            onChange={(value) => setConfig({ ...config, round_break_duration: value })}
            min={15}
            max={300}
            unit="seconds"
          />
          <ParameterSlider
            label="Game Start Delay"
            value={config.game_start_delay || 10}
            onChange={(value) => setConfig({ ...config, game_start_delay: value })}
            min={5}
            max={60}
            unit="seconds"
          />
          <ParameterSlider
            label="New Game Wait Time"
            value={config.new_game_wait_duration || 30}
            onChange={(value) => setConfig({ ...config, new_game_wait_duration: value })}
            min={10}
            max={120}
            unit="seconds"
          />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Player Rules</h2>
        <div className={styles.parameterGrid}>
          <ParameterSlider
            label="Min Players to Start"
            value={config.min_players_to_start || 2}
            onChange={(value) => setConfig({ ...config, min_players_to_start: value })}
            min={1}
            max={10}
            unit="players"
          />
          <ParameterSlider
            label="Max Players"
            value={config.max_players || 25}
            onChange={(value) => setConfig({ ...config, max_players: value })}
            min={2}
            max={100}
            unit="players"
          />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Scoring</h2>
        <div className={styles.parameterGrid}>
          <ParameterSlider
            label="Points per Normal Slot"
            value={config.points_normal_slot || 100}
            onChange={(value) => setConfig({ ...config, points_normal_slot: value })}
            min={1}
            max={1000}
            unit="points"
          />
          <ParameterSlider
            label="Points per Rare Slot"
            value={config.points_rare_slot || 250}
            onChange={(value) => setConfig({ ...config, points_rare_slot: value })}
            min={1}
            max={2000}
            unit="points"
          />
        </div>
      </div>

      {/* Host Settings (BotBob) */}
      {hostSettings && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Host Settings (BotBob)
            {hostSettingsLoading && <span className={styles.loadingBadge}>Loading...</span>}
          </h2>

          <div className={styles.hostSettingsGrid}>
            {/* Enable/Disable Host */}
            <div className={styles.toggleControl}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={hostSettings.enabled}
                  onChange={(e) => updateHostSetting("enabled", e.target.checked)}
                  disabled={hostSettingsSaving}
                  className={styles.checkbox}
                />
                Enable Host
              </label>
            </div>

            {/* Welcome Message */}
            <div className={styles.toggleControl}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={hostSettings.welcome_message_enabled}
                  onChange={(e) =>
                    updateHostSetting("welcome_message_enabled", e.target.checked)
                  }
                  disabled={hostSettingsSaving || !hostSettings.enabled}
                  className={styles.checkbox}
                />
                Show Welcome Message
              </label>
            </div>

            {/* Hints Enabled */}
            <div className={styles.toggleControl}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={hostSettings.hints_enabled}
                  onChange={(e) => updateHostSetting("hints_enabled", e.target.checked)}
                  disabled={hostSettingsSaving || !hostSettings.enabled}
                  className={styles.checkbox}
                />
                Enable Hints
              </label>
            </div>
          </div>

          {/* Hint Timing */}
          {hostSettings.hints_enabled && (
            <div className={styles.parameterGrid}>
              <ParameterSlider
                label="Initial Hint Delay"
                value={hostSettings.hint_delay_seconds}
                onChange={(value) => updateHostSetting("hint_delay_seconds", value)}
                min={10}
                max={120}
                unit="seconds"
              />
              <ParameterSlider
                label="Normal Hint Interval"
                value={hostSettings.hint_interval_seconds}
                onChange={(value) => updateHostSetting("hint_interval_seconds", value)}
                min={10}
                max={120}
                unit="seconds"
              />
            </div>
          )}

          {/* Urgency Mode */}
          {hostSettings.hints_enabled && (
            <>
              <div className={styles.toggleControl}>
                <label className={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    checked={hostSettings.urgency_enabled}
                    onChange={(e) => updateHostSetting("urgency_enabled", e.target.checked)}
                    disabled={hostSettingsSaving || !hostSettings.enabled}
                    className={styles.checkbox}
                  />
                  Enable Urgency Mode
                </label>
              </div>

              {hostSettings.urgency_enabled && (
                <div className={styles.parameterGrid}>
                  <ParameterSlider
                    label="Urgency Time Threshold"
                    value={hostSettings.urgency_time_left_seconds}
                    onChange={(value) =>
                      updateHostSetting("urgency_time_left_seconds", value)
                    }
                    min={15}
                    max={180}
                    unit="seconds"
                  />
                  <ParameterSlider
                    label="Urgency Hint Interval"
                    value={hostSettings.urgency_interval_seconds}
                    onChange={(value) =>
                      updateHostSetting("urgency_interval_seconds", value)
                    }
                    min={5}
                    max={60}
                    unit="seconds"
                  />
                </div>
              )}

              {hostSettings.urgency_enabled && (
                <div className={styles.urgencyDescription}>
                  <p>
                    When ≤{hostSettings.urgency_time_left_seconds}s remain in a round, hints
                    will be sent every {hostSettings.urgency_interval_seconds}s instead of
                    every {hostSettings.hint_interval_seconds}s.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Fuzzy Matching Configuration */}
      {fuzzyMatchConfig && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Fuzzy Matching
            {fuzzyMatchLoading && <span className={styles.loadingBadge}>Loading...</span>}
          </h2>

          <div className={styles.fuzzyMatchDescription}>
            <p>
              Control how typos and variations are handled. Higher similarity scores are stricter.
            </p>
          </div>

          <div className={styles.parameterGrid}>
            <ParameterSlider
              label="Minimum Similarity (Acceptance)"
              value={fuzzyMatchConfig.min_similarity}
              onChange={(value) => updateFuzzyMatchSetting("min_similarity", value)}
              min={80}
              max={100}
              unit="%"
              description="Score required to accept typos (100 = exact match only)"
            />
            <ParameterSlider
              label="Near-Miss Threshold"
              value={fuzzyMatchConfig.near_miss_threshold}
              onChange={(value) => updateFuzzyMatchSetting("near_miss_threshold", value)}
              min={60}
              max={95}
              unit="%"
              description="Score to show 'close!' feedback"
            />
            <ParameterSlider
              label="Minimum Word Length"
              value={fuzzyMatchConfig.min_word_length}
              onChange={(value) => updateFuzzyMatchSetting("min_word_length", value)}
              min={3}
              max={10}
              unit="chars"
              description="Words shorter than this use exact matching"
            />
            <ParameterSlider
              label="Max Length Difference"
              value={fuzzyMatchConfig.max_length_diff}
              onChange={(value) => updateFuzzyMatchSetting("max_length_diff", value)}
              min={1}
              max={10}
              unit="chars"
              description="Max character difference for fuzzy match"
            />
          </div>

          <div className={styles.fuzzyMatchPresets}>
            <p className={styles.presetsLabel}>Quick Presets:</p>
            <div className={styles.presetButtons}>
              <button
                className={styles.presetButton}
                onClick={() => {
                  updateFuzzyMatchSetting("min_similarity", 100);
                }}
                disabled={fuzzyMatchSaving}
              >
                Strict (Exact Only)
              </button>
              <button
                className={styles.presetButton}
                onClick={() => {
                  updateFuzzyMatchSetting("min_similarity", 92);
                }}
                disabled={fuzzyMatchSaving}
              >
                Balanced (Default)
              </button>
              <button
                className={styles.presetButton}
                onClick={() => {
                  updateFuzzyMatchSetting("min_similarity", 85);
                }}
                disabled={fuzzyMatchSaving}
              >
                Forgiving
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <button
          className={styles.resetDefaultsButton}
          onClick={handleResetToDefaults}
          disabled={saving}
        >
          Reset to Defaults
        </button>
        <button
          className={styles.forceResetButton}
          onClick={handleForceReset}
          disabled={saving}
        >
          Force Reset Now
        </button>
        <button
          className={styles.saveButton}
          onClick={handleSaveConfiguration}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Configuration"}
        </button>
      </div>
    </div>
  );
}

function ParameterSlider({
  label,
  value,
  onChange,
  min,
  max,
  unit,
  description,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  unit: string;
  description?: string;
}) {
  return (
    <div className={styles.parameterControl}>
      <div className={styles.parameterHeader}>
        <label className={styles.parameterLabel}>{label}</label>
        <span className={styles.parameterValue}>
          {value} {unit}
        </span>
      </div>
      {description && (
        <p className={styles.parameterDescription}>{description}</p>
      )}
      <Slider.Root
        className={styles.sliderRoot}
        value={[value]}
        onValueChange={([newValue]) => onChange(newValue)}
        min={min}
        max={max}
        step={1}
      >
        <Slider.Track className={styles.sliderTrack}>
          <Slider.Range className={styles.sliderRange} />
        </Slider.Track>
        <Slider.Thumb className={styles.sliderThumb} />
      </Slider.Root>
      <div className={styles.sliderLabels}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
