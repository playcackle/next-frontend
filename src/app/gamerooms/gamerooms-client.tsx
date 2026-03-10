"use client";

import { useState, useMemo } from "react";
import GameroomTile from "@/components/gameroom-tile";
import Link from "next/link";
import styles from "./gamerooms.module.css";

type LobbyInfo = {
  lobby_id: string;
  collection_name: string;
  status: string;
  player_count: number;
  join_base_url?: string | null;
};

type Props = { gamerooms: LobbyInfo[] };

type SortKey = "name" | "players_asc" | "players_desc" | "availability";
type StatusFilter = "all" | "open" | "in_progress" | "full";

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  full: "Full",
  waiting: "Waiting",
};

const MAX_PLAYERS = 25;

function getRoomStatus(room: LobbyInfo): StatusFilter {
  if (room.player_count >= MAX_PLAYERS) return "full";
  if (room.status === "in_progress" || room.status === "playing") return "in_progress";
  return "open";
}

export default function GameroomsClient({ gamerooms }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("availability");

  const filtered = useMemo(() => {
    let list = gamerooms.filter((r) => {
      const matchesSearch = r.collection_name
        .toLowerCase()
        .includes(search.toLowerCase());
      const roomStatus = getRoomStatus(r);
      const matchesStatus =
        statusFilter === "all" || roomStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });

    list = [...list].sort((a, b) => {
      if (sortKey === "name") {
        return a.collection_name.localeCompare(b.collection_name);
      }
      if (sortKey === "players_asc") return a.player_count - b.player_count;
      if (sortKey === "players_desc") return b.player_count - a.player_count;
      // availability: most open slots first
      return (
        (MAX_PLAYERS - b.player_count) - (MAX_PLAYERS - a.player_count)
      );
    });

    return list;
  }, [gamerooms, search, statusFilter, sortKey]);

  const STATUS_OPTS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "open", label: "Open" },
    { key: "in_progress", label: "In Progress" },
    { key: "full", label: "Full" },
  ];

  const SORT_OPTS: { key: SortKey; label: string }[] = [
    { key: "availability", label: "Most Available" },
    { key: "name", label: "Name A-Z" },
    { key: "players_desc", label: "Most Players" },
    { key: "players_asc", label: "Fewest Players" },
  ];

  return (
    <div className={styles.pageWrapper}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <Link href="/" className={styles.backLink}>
          &larr; Home
        </Link>
        <div>
          <h1 className={styles.pageTitle}>
            <span className={styles.titleAccentBlue}>Game</span>
            <span className={styles.titleAccentPink}>rooms</span>
          </h1>
          <p className={styles.roomCount}>
            {filtered.length} of {gamerooms.length} rooms
          </p>
        </div>
      </div>

      {/* Filters bar */}
      <div className={styles.filtersBar}>
        {/* Search */}
        <div className={styles.searchWrapper}>
          <svg
            className={styles.searchIcon}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search rooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
            aria-label="Search game rooms"
          />
          {search && (
            <button
              className={styles.searchClear}
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              &times;
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className={styles.filterGroup}>
          <span className={styles.filterGroupLabel}>Status</span>
          <div className={styles.filterChips}>
            {STATUS_OPTS.map(({ key, label }) => (
              <button
                key={key}
                className={`${styles.chip} ${statusFilter === key ? styles.chipActive : ""}`}
                onClick={() => setStatusFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className={styles.filterGroup}>
          <span className={styles.filterGroupLabel}>Sort</span>
          <select
            className={styles.sortSelect}
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            aria-label="Sort game rooms"
          >
            {SORT_OPTS.map(({ key, label }) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateText}>
            {gamerooms.length === 0
              ? "No game rooms available right now. Check back soon!"
              : "No rooms match your filters."}
          </p>
          {gamerooms.length > 0 && search && (
            <button
              className={styles.clearFiltersBtn}
              onClick={() => { setSearch(""); setStatusFilter("all"); }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className={styles.gameroomsGrid}>
          {filtered.map((room) => (
            <div key={room.lobby_id} className={styles.tileWrapper}>
              <GameroomTile gameroom={room} />
              {room.status && (
                <span
                  className={`${styles.statusBadge} ${
                    styles[`status_${getRoomStatus(room)}`]
                  }`}
                >
                  {STATUS_LABELS[room.status] ?? room.status}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
