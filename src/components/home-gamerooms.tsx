"use client";

import styles from "@/app/page.module.css";
import GameroomTile from "@/components/gameroom-tile";
import { useRealtimeLobbies, type LobbyInfo } from "@/hooks/useRealtimeLobbies";
import Link from "next/link";

type Props = { initialGamerooms: LobbyInfo[] };

const PREVIEW_COUNT = 4;

export default function HomeGamerooms({ initialGamerooms }: Props) {
  const gamerooms = useRealtimeLobbies(initialGamerooms);
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
