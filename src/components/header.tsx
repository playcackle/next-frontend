"use client";

import { gameRoomAtom } from "@/app/store/gameRoom";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@radix-ui/themes";
import { useAtomValue } from "jotai";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import styles from "./header.module.css";

export default function Header() {
  const { user, loading } = useUser();
  const [signingOut, setSigningOut] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();
  const gameroom = useAtomValue(gameRoomAtom);
  const inGameroom = pathname === "/gameroom";
  const isLaunched = process.env.NEXT_PUBLIC_LAUNCHED === "true";
  const discordUrl =
    inGameroom && gameroom?.discord_invite_url
      ? gameroom.discord_invite_url
      : (process.env.NEXT_PUBLIC_DISCORD_URL ?? null);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
    setSigningOut(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link href="/">
          <span className={styles.logoText}>
            CAC<span className={styles.logoHighlight}>KLE</span>
          </span>
        </Link>
      </div>
      <div className={styles.auth}>
        {!inGameroom && (
          <Link href="/how-to-play" className={styles.howToPlayLink}>
            How to Play
          </Link>
        )}
        {discordUrl && (
          <a
            href={discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.discordButton}
            title={
              inGameroom && gameroom?.discord_invite_url
                ? "Join the voice channel for this room"
                : "Join the Cackle Discord community"
            }
          >
            <svg
              className={styles.discordIcon}
              viewBox="0 0 127.14 96.36"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
            </svg>
            {inGameroom && gameroom?.discord_invite_url ? "Voice" : "Banter"}
          </a>
        )}
        {!loading && user && (
          <>
            <Link href="/profile" className={styles.playerName}>
              {user.identities?.[0]?.identity_data?.["name"] ||
                user.user_metadata.name.replace(".#0") ||
                user.email}
            </Link>
            <Button
              className={styles.signOutButton}
              disabled={signingOut}
              onClick={handleSignOut}
            >
              {signingOut ? "Signing Out..." : "Sign Out"}
            </Button>
          </>
        )}
        {!loading && !user && isLaunched && (
          <>
            <Link href="/login" className={styles.loginLink}>
              Back for more
            </Link>
            <Link href="/register" className={styles.registerLink}>
              Join the greatness
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
