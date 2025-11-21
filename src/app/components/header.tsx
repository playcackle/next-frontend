"use client";

import { Button } from "@radix-ui/themes";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import Link from "next/link";
import styles from "./header.module.css";

type Props = {
  session: Session;
};

export default function Header(props: Props) {
  const { session } = props;
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
        {session?.user && (
          <>
            <div className={styles.playerName}>{session.user?.name}</div>
            <Button
              className={styles.signOutButton}
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Sign Out
            </Button>
          </>
        )}
        {!session?.user && (
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
