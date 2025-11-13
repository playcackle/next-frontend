import GameroomTileComponent from "@/app/components/gameroom-tile";
import { getServerSession } from "next-auth";
import { AuthButtons } from "./components/auth-buttons";
import styles from "./page.module.css";
import { GameroomTile } from "@/app/models/gameroom"; // Import the GameroomTile type
import SettingsControls from "./components/settings-controls"; // Import the new component

export default async function Home() {
  const gamerooms = await fetchGamerooms();
  const session = await getServerSession();
  const isSession = session?.user;
  return (
    <>
      <SettingsControls musicSrc="/audio/Snapscore.wav" />
      <section className={styles.heroSection}>
        <h1 className={styles.title}>
          <span className={styles.neonText}>SNAP</span>
          <span className={styles.neonTextPink}>SCORE</span>
        </h1>
      </section>
      {isSession ? (
        <section className={styles.lobbiesSection}>
          <div className={styles.lobbiesContainer}>
            {gamerooms.map((x: GameroomTile, i: number) => (
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
async function fetchGamerooms(): Promise<GameroomTile[]> {
  try {
    const baseUrl =
      process.env.BACKEND_URL || process.env.NEXT_PUBLIC_APP_BACKEND_URL;

    const response = await fetch(`${baseUrl}/lobbies`, {
      // Add cache options for revalidation
      next: {
        revalidate: 60, // Revalidate every 60 seconds
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching lobbies: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch lobbies lobbies:", error);
    return [];
  }
}
