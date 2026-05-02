"use client";

import { joinGameroom } from "@/actions/joinGameroom";
import { gameRoomAtom } from "@/app/store/gameRoom";
import { useUser } from "@/hooks/useUser";
import { useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ErrorModal from "./error-modal";
import styles from "./gameroom-tile.module.css";

type GameroomTileProps = {
  gameroom: {
    lobby_id: string;
    collection_name: string;
    status: string;
    player_count: number;
    max_players?: number | null;
    join_base_url?: string | null;
    discord_url?: string | null;
    discord_invite_url?: string | null;
  };
};

const STATUS_LABELS: Record<string, string> = {
  WAITING: "Waiting",
  IN_ROUND: "In Round",
  ROUND_BREAK: "Break",
  POST_GAME_SHOWCASE: "Finished",
  waiting: "Waiting",
  in_progress: "In Progress",
  playing: "Playing",
  open: "Open",
  full: "Full",
};

function getStatusClass(status: string, playerCount: number, maxPlayers: number | null | undefined): string {
  if (maxPlayers != null && playerCount >= maxPlayers) return "full";
  if (status === "IN_ROUND" || status === "ROUND_BREAK" || status === "POST_GAME_SHOWCASE") return "in_progress";
  return "open";
}

export default function GameroomTile(props: GameroomTileProps) {
  const { gameroom } = props;
  const { user } = useUser();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const setGameroom = useSetAtom(gameRoomAtom);

  const maxPlayers = gameroom.max_players;
  const statusClass = getStatusClass(gameroom.status, gameroom.player_count, maxPlayers);

  const handleClick = async () => {
    if (!user?.id) {
      setErrorMessage("Please sign in to join a gameroom.");
      setShowModal(true);
      return;
    }
    const gameRoom = await joinGameroom({
      lobbyId: gameroom.lobby_id,
      playerId: user.id,
      joinBaseUrl: gameroom.join_base_url ?? undefined,
    });
    if ("isError" in gameRoom) {
      setErrorMessage(gameRoom.error);
      setShowModal(true);
      return;
    }
    setErrorMessage(undefined);
    setGameroom({ ...gameRoom, discord_invite_url: gameroom.discord_invite_url ?? null });
    router.push(`/gameroom?name=${gameroom.collection_name}`);
  };

  const handleDiscordClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    if (!gameroom.discord_url) return;

    // Convert an https://discord.com/channels/... URL to a discord:// deep-link
    const discordProtocolUrl = gameroom.discord_url.replace(
      /^https:\/\/discord\.com\//,
      "discord://"
    );

    const fallbackTimeout = setTimeout(() => {
      window.open(gameroom.discord_url!, "_blank", "noopener,noreferrer");
    }, 1500);

    window.location.href = discordProtocolUrl;

    // If the protocol handler works, the page will lose focus; clear the fallback
    window.addEventListener(
      "blur",
      () => clearTimeout(fallbackTimeout),
      { once: true }
    );
  };

  return (
    <div className={styles.lobbyCard} onClick={handleClick}>
      <h3 className={styles.lobbyName}>{gameroom.collection_name}</h3>
      <div className={styles.statusBadgeWrapper}>
        <span className={`${styles.statusBadge} ${styles[`status_${statusClass}`]}`}>
          {STATUS_LABELS[gameroom.status] ?? gameroom.status}
        </span>
      </div>
      <div className={styles.lobbyCapacity}>
        <span className={styles.capacityText}>
          {maxPlayers != null
            ? `${maxPlayers - gameroom.player_count} / ${maxPlayers} seats open`
            : `${gameroom.player_count} players`}
        </span>
        {maxPlayers != null && (
          <div className={styles.capacityBar}>
            <div
              className={styles.capacityFill}
              style={{ width: `${Math.min(100, (gameroom.player_count / maxPlayers) * 100)}%` }}
            ></div>
          </div>
        )}
      </div>
      {gameroom.discord_url && (
        <a
          href={gameroom.discord_url}
          className={styles.discordLink}
          onClick={handleDiscordClick}
          aria-label="Join voice channel on Discord"
        >
          <svg
            className={styles.discordIcon}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.054a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
          Join Voice Channel
        </a>
      )}
      <ErrorModal
        onOpenChange={setShowModal}
        open={showModal}
        title="Unable to join gameroom"
        message={errorMessage ?? "Unable to join. Please try again."}
        showHomeButton={false}
      />
    </div>
  );
}
