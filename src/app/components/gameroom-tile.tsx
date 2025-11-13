"use client";

import { useSetAtom } from "jotai";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { joinGameroom } from "../actions/joinGameroom";
import { GameroomTile } from "../models/gameroom";
import { gameRoomAtom } from "../store/gameRoom";
import ErrorModal from "./error-modal";
import styles from "./gameroom-tile.module.css";

export type GameroomTileProps = {
  gameroom: GameroomTile;
};

export default function GameroomTile(props: GameroomTileProps) {
  const { gameroom } = props;
  const { data } = useSession();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const setGameroom = useSetAtom(gameRoomAtom);

  const handleClick = async () => {
    const gameRoom = await joinGameroom(data?.user.id);
    if (gameRoom.isError) {
      setShowModal(true);
      return;
    }
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
      />
    </div>
  );
}
