"use client";

import { useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";
import {
  chatConnectionStatusAtom,
  connectionStatusAtom,
  type ConnectionStatus,
} from "../store/gameAtoms";
import styles from "./ConnectionBanner.module.css";

// Higher rank = worse; banner shows the worst active status
const STATUS_RANK: Record<ConnectionStatus, number> = {
  connected: 0,
  connecting: 0,
  reconnecting: 1,
  disconnected: 2,
  error: 2,
};

interface ConnectionBannerProps {
  onRetry?: () => void;
  onChatRetry?: () => void;
}

export default function ConnectionBanner({
  onRetry,
  onChatRetry,
}: ConnectionBannerProps) {
  const gameStatus = useAtomValue(connectionStatusAtom);
  const chatStatus = useAtomValue(chatConnectionStatusAtom);

  const status: ConnectionStatus =
    STATUS_RANK[gameStatus] >= STATUS_RANK[chatStatus]
      ? gameStatus
      : chatStatus;

  const isChatOnly = STATUS_RANK[chatStatus] > STATUS_RANK[gameStatus];

  const [visible, setVisible] = useState(false);
  const [displayStatus, setDisplayStatus] = useState<ConnectionStatus>(status);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const bannerWasShownRef = useRef(false);

  useEffect(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (status === "reconnecting" || status === "disconnected") {
      setDisplayStatus(status);
      bannerWasShownRef.current = true;
      setVisible(true);
    } else if (status === "connected") {
      if (bannerWasShownRef.current) {
        setDisplayStatus("connected");
        setVisible(true);
        hideTimerRef.current = setTimeout(() => {
          setVisible(false);
          bannerWasShownRef.current = false;
          hideTimerRef.current = null;
        }, 500);
      } else {
        setVisible(false);
      }
    } else {
      setVisible(false);
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
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

  const retryHandler = isChatOnly ? onChatRetry : onRetry;

  return (
    <div
      className={`${styles.banner} ${bannerClass}`}
      role="status"
      aria-live="polite"
    >
      {displayStatus === "reconnecting" && (
        <>
          <div className={styles.spinner} />
          <span>{isChatOnly ? "Chat reconnecting…" : "Reconnecting…"}</span>
        </>
      )}
      {displayStatus === "disconnected" && (
        <>
          <span>{isChatOnly ? "Chat connection lost" : "Connection lost"}</span>
          {retryHandler && (
            <button className={styles.retryButton} onClick={retryHandler}>
              Retry
            </button>
          )}
        </>
      )}
      {displayStatus === "connected" && <span>Connected</span>}
    </div>
  );
}
