"use client";

import { joinGameroom } from "@/actions/joinGameroom";
import { gameRoomAtom } from "@/app/store/gameRoom";
import { useUser } from "@/hooks/useUser";
import { useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ErrorModal from "./error-modal";
import styles from "./gameroom-tile.module.css";

export type GameroomTileProps = {
  gameroom: {
    lobby_id: string;
    collection_name: string;
    status: string;
    player_count: number;
    max_players?: number | null;
    join_base_url?: string | null;
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

function getStatusClass(status: string, playerCount: number, maxPlayers: number): string {
  if (playerCount >= maxPlayers) return "full";
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

  const maxPlayers = gameroom.max_players ?? 25;
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
    setGameroom(gameRoom);
    router.push(`/gameroom?name=${gameroom.collection_name}`);
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
          {maxPlayers - gameroom.player_count} / {maxPlayers} seats open
        </span>
        <div className={styles.capacityBar}>
          <div
            className={styles.capacityFill}
            style={{
              width: `${Math.min(100, (gameroom.player_count / maxPlayers) * 100)}%`,
            }}
          ></div>
        </div>
      </div>
      <ErrorModal
        onOpenChange={(change) => setShowModal(change)}
        open={showModal}
        title="Unable to join gameroom"
        message={errorMessage ?? "Unable to join. Please try again."}
      />
    </div>
  );
}
