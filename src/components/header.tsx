"use client";

import { Button } from "@radix-ui/themes";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import styles from "./header.module.css";

export default function Header() {
  const { user, loading } = useUser();
  const [signingOut, setSigningOut] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

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
        {!loading && user && (
          <>
            <Link href="/profile" className={styles.playerName}>
              {user.user_metadata?.name || user.email}
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
        {!loading && !user && (
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
