
import { useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  connectionStatusAtom,
  type ConnectionStatus,
} from "../store/gameAtoms";
import styles from "./ConnectionBanner.module.css";

interface ConnectionBannerProps {
  onRetry?: () => void;
}

export default function ConnectionBanner({ onRetry }: ConnectionBannerProps) {
  const status = useAtomValue(connectionStatusAtom);

  const [visible, setVisible] = useState(false);
  const [displayStatus, setDisplayStatus] = useState<ConnectionStatus>(status);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
        }, 2000);
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

  if (typeof document === "undefined") return null;

  // Portal to <body> so the banner escapes the <main> stacking context
  // (main has z-index: 5), otherwise the header (z-index: 1500) paints over
  // it and the banner becomes invisible and unclickable.
  return createPortal(
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
    </div>,
    document.body,
  );
}
