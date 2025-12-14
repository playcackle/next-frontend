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
    player_count: number;
    join_base_url?: string | null;
  };
};

export default function GameroomTile(props: GameroomTileProps) {
  const { gameroom } = props;
  const { user } = useUser();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const setGameroom = useSetAtom(gameRoomAtom);

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
      <div className={styles.lobbyCapacity}>
        <span className={styles.capacityText}>
          {25 - gameroom.player_count} slots available
        </span>
        <div className={styles.capacityBar}>
          <div
            className={styles.capacityFill}
            style={{
              width: `${(gameroom.player_count / 25) * 100}%`,
              backgroundColor: "--neon-pink",
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
