import { AuthButtons } from "@/components/auth-buttons";
import GameroomTileComponent from "@/components/gameroom-tile";
import SettingsControls from "@/components/settings-controls"; // Import the new component
import { getServerSession } from "next-auth";
import styles from "./page.module.css";

type LobbyInfo = {
  lobby_id: string;
  collection_name: string;
  status: string;
  player_count: number;
  join_base_url?: string | null;
  game_ws_url?: string | null;
  chat_ws_url?: string | null;
};

export default async function Home() {
  const gamerooms = await fetchGamerooms();
  const session = await getServerSession();
  const isSession = session?.user;
  return (
    <>
      <SettingsControls musicSrc="/audio/Snapscore.wav" />
      <section className={styles.heroSection}>
        <h1 className={styles.title}>
          <span className={styles.neonText}>CAC</span>
          <span className={styles.neonTextPink}>KLE</span>
        </h1>
      </section>
      {isSession ? (
        <section className={styles.lobbiesSection}>
          <div className={styles.lobbiesContainer}>
	            {gamerooms.map((x: LobbyInfo, i: number) => (
	              <GameroomTileComponent gameroom={x} key={i} />
	            ))}
          </div>
        </section>
      ) : (
        <section className={styles.authSection}>
          <AuthButtons />
        </section>
      )}
    </>
  );
}

// Server-side function to fetch available gamerooms
async function fetchGamerooms(): Promise<LobbyInfo[]> {
  try {
    const baseUrl =
      process.env.BACKEND_URL || process.env.NEXT_PUBLIC_LOBBY_MANAGER_URL;
    if (!baseUrl) {
      throw new Error("Lobby Manager URL is not configured.");
    }

    const response = await fetch(`${baseUrl}/lobbies`, {
      // Add cache options for revalidation
      next: {
        revalidate: 60, // Revalidate every 60 seconds
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching lobbies: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Failed to fetch lobbies lobbies:", error);
    return [];
  }
}
