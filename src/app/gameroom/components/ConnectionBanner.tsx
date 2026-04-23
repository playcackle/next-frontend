"use client";

import { useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";
import {
  connectionStatusAtom,
  type ConnectionStatus,
} from "../store/gameAtoms";
import styles from "./ConnectionBanner.module.css";

interface ConnectionBannerProps {
  onRetry?: () => void;
}

/**
 * Lightweight banner that overlays the game UI during socket reconnection.
 * Replaces the old behaviour of hiding the entire game behind a loading screen.
 *
 * - "reconnecting" → amber banner with spinner
 * - "disconnected" → red banner with retry button (after max attempts)
 * - "connected" → brief green flash then auto-hide
 */
export default function ConnectionBanner({ onRetry }: ConnectionBannerProps) {
  const status = useAtomValue(connectionStatusAtom);
  const [visible, setVisible] = useState(false);
  const [displayStatus, setDisplayStatus] = useState<ConnectionStatus>(status);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wasDisconnectedRef = useRef(false);

  useEffect(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (status === "reconnecting" || status === "disconnected") {
      wasDisconnectedRef.current = true;
      setDisplayStatus(status);
      setVisible(true);
    } else if (status === "connected" && wasDisconnectedRef.current) {
      // Show "connected" briefly, then fade out
      setDisplayStatus("connected");
      setVisible(true);
      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
        wasDisconnectedRef.current = false;
      }, 2000);
    } else {
      // Initial "connecting" or steady-state "connected" — don't show banner
      setVisible(false);
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [status]);

  if (!visible) return null;

  const bannerClass =
    displayStatus === "reconnecting"
      ? styles.reconnecting
      : displayStatus === "disconnected"
        ? styles.disconnected
        : styles.connected;

  return (
    <div
      className={`${styles.banner} ${bannerClass}`}
      role="status"
      aria-live="polite"
    >
      {displayStatus === "reconnecting" && (
        <>
          <div className={styles.spinner} />
          <span>Reconnecting…</span>
        </>
      )}
      {displayStatus === "disconnected" && (
        <>
          <span>Connection lost</span>
          {onRetry && (
            <button className={styles.retryButton} onClick={onRetry}>
              Retry
            </button>
          )}
        </>
      )}
      {displayStatus === "connected" && <span>Connected</span>}
    </div>
  );
}
