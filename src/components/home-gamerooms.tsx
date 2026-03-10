"use client";

import GameroomTile from "@/components/gameroom-tile";
import Link from "next/link";
import styles from "@/app/page.module.css";

type LobbyInfo = {
  lobby_id: string;
  collection_name: string;
  status: string;
  player_count: number;
  join_base_url?: string | null;
  game_ws_url?: string | null;
  chat_ws_url?: string | null;
};

type Props = { gamerooms: LobbyInfo[] };

const PREVIEW_COUNT = 4;

export default function HomeGamerooms({ gamerooms }: Props) {
  const preview = gamerooms.slice(0, PREVIEW_COUNT);

  if (gamerooms.length === 0) {
    return (
      <div className={styles.gameroomsEmpty}>
        <p>No game rooms available right now. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className={styles.gameroomsSection}>
      <div className={styles.gameroomsGrid}>
        {preview.map((room) => (
          <GameroomTile key={room.lobby_id} gameroom={room} />
        ))}
      </div>

      {gamerooms.length > PREVIEW_COUNT && (
        <div className={styles.gameroomsFooter}>
          <Link href="/gamerooms" className={styles.browseAllBtn}>
            Browse All {gamerooms.length} Rooms
          </Link>
        </div>
      )}
    </div>
  );
}
