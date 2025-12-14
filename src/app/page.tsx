import { AuthButtons } from "@/components/auth-buttons";
import GameroomTileComponent from "@/components/gameroom-tile";
import SettingsControls from "@/components/settings-controls";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
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

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; error_description?: string }>;
}) {
  const gamerooms = await fetchGamerooms();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Handle auth errors from email confirmation (searchParams is a Promise in Next.js 16+)
  const params = await searchParams;
  const authError = params.error;
  const errorDescription = params.error_description;

  return (
    <>
      <SettingsControls musicSrc="/audio/Snapscore.wav" />
      <section className={styles.heroSection}>
        <h1 className={styles.title}>
          <span className={styles.neonText}>CAC</span>
          <span className={styles.neonTextPink}>KLE</span>
        </h1>

        {authError && (
          <div style={{
            color: "#ff0055",
            backgroundColor: "rgba(255, 0, 85, 0.1)",
            padding: "15px 20px",
            borderRadius: "8px",
            marginTop: "20px",
            border: "1px solid #ff0055",
            maxWidth: "600px",
            margin: "20px auto"
          }}>
            <div style={{ fontSize: "18px", marginBottom: "10px" }}>⚠️ Email Link Expired</div>
            <div style={{ fontSize: "14px", marginBottom: "15px" }}>
              {errorDescription?.replace(/\+/g, " ") || "Your email confirmation link has expired."}
            </div>
            <div style={{ fontSize: "14px" }}>
              Please{" "}
              <Link href="/register" style={{ color: "#00ff88", textDecoration: "underline" }}>
                sign up again
              </Link>
              {" "}to get a new confirmation email, or{" "}
              <Link href="/login" style={{ color: "#00ff88", textDecoration: "underline" }}>
                try logging in
              </Link>
              {" "}if you already confirmed.
            </div>
          </div>
        )}
      </section>
      {user ? (
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
