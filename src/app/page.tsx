import { AuthButtons } from "@/components/auth-buttons";
import SettingsControls from "@/components/settings-controls";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import styles from "./page.module.css";
import HomeLeaderboard from "@/components/home-leaderboard";
import HomeUserStats from "@/components/home-user-stats";
import HomeGamerooms from "@/components/home-gamerooms";

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const authError = params.error;
  const errorDescription = params.error_description;

  return (
    <>
      <SettingsControls musicSrc="/audio/Snapscore.wav" />

      <div className={styles.pageWrapper}>
        {/* Hero */}
        <section className={styles.heroSection}>
          <h1 className={styles.title}>
            <span className={styles.neonText}>CAC</span>
            <span className={styles.neonTextPink}>KLE</span>
          </h1>
          <p className={styles.tagline}>Race. Claim. Win.</p>

          {authError && (
            <div className={styles.authErrorBanner}>
              <span className={styles.authErrorIcon}>!</span>
              <div>
                <strong>Email Link Expired</strong>
                <p>
                  {errorDescription?.replace(/\+/g, " ") ||
                    "Your email confirmation link has expired."}
                </p>
                <p>
                  <Link href="/register" className={styles.authErrorLink}>
                    Sign up again
                  </Link>{" "}
                  or{" "}
                  <Link href="/login" className={styles.authErrorLink}>
                    try logging in
                  </Link>
                  .
                </p>
              </div>
            </div>
          )}
        </section>

        {user ? (
          <>
            {/* Section 1: Global Leaderboard */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.sectionTitleAccent}>Global</span>{" "}
                  Leaderboard
                </h2>
                <Link href="/leaderboard" className={styles.seeAllLink}>
                  See All
                </Link>
              </div>
              <HomeLeaderboard />
            </section>

            {/* Section 2: Your Stats */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.sectionTitleAccent}>Your</span> Stats
                </h2>
                <Link href="/profile" className={styles.seeAllLink}>
                  Full Profile
                </Link>
              </div>
              <HomeUserStats userId={user.id} />
            </section>

            {/* Section 3: Gamerooms */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.sectionTitleAccent}>Game</span> Rooms
                </h2>
                <Link href="/gamerooms" className={styles.seeAllLink}>
                  Browse All
                </Link>
              </div>
              <HomeGamerooms gamerooms={gamerooms} />
            </section>
          </>
        ) : (
          <section className={styles.authSection}>
            <AuthButtons />
          </section>
        )}
      </div>
    </>
  );
}

async function fetchGamerooms(): Promise<LobbyInfo[]> {
  try {
    const baseUrl =
      process.env.BACKEND_URL || process.env.NEXT_PUBLIC_LOBBY_MANAGER_URL;
    if (!baseUrl) {
      throw new Error("Lobby Manager URL is not configured.");
    }
    const response = await fetch(`${baseUrl}/lobbies`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) {
      throw new Error(`Error fetching lobbies: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error("Failed to fetch lobbies:", error);
    return [];
  }
}
