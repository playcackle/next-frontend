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
            SNAP<span className={styles.logoHighlight}>SCORE</span>
          </span>
        </Link>
      </div>
      <nav className={styles.nav}>
        {/* <ul className={styles.navList}>
          <li>
            <Link href="/about" className={styles.navLink}>
              About
            </Link>
          </li>
          <li>
            <Link href="/leaderboard" className={styles.navLink}>
              Leaderboard
            </Link>
          </li>
        </ul> */}
      </nav>
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
              Login
            </Link>
            <Link href="/register" className={styles.registerLink}>
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
