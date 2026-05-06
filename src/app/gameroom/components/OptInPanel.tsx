"use client";

import { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Gamepad2, LogOut } from "lucide-react";
import { playAgainStateAtom, timeRemainingAtom, updatePlayAgainStateAtom } from "../store/gameAtoms";
import { formatTime } from "../utils";
import styles from "./OptInPanel.module.css";

interface OptInPanelProps {
  onPlayAgainResponse?: (wantToPlay: boolean) => void;
  disabled?: boolean;
  currentUserId?: string | null;
}

/**
 * OptInPanel - displays the "Rematch?" prompt during post-game showcase.
 *
 * Shows:
 * - Player circles indicating who's in (green = confirmed, gray = pending, pink = out)
 * - In/Out buttons with Lucide icons
 * - Live count and timeout
 */
export default function OptInPanel({ onPlayAgainResponse, disabled = false, currentUserId }: OptInPanelProps) {
  const playAgainState = useAtomValue(playAgainStateAtom);
  const updatePlayAgainState = useSetAtom(updatePlayAgainStateAtom);
  const timeRemaining = useAtomValue(timeRemainingAtom);

  const { confirmedCount, neededToStart, userResponse, playersWaiting, playerResponses } = playAgainState;

  // Use playersWaiting for the total count (players needed to play)
  const totalPlayers = playersWaiting > 0 ? playersWaiting : 1;
  const confirmedPlayers = confirmedCount > 0 ? confirmedCount : 0;

  // Determine user status
  const userStatus = userResponse === "yes" ? "in" : userResponse === "no" ? "out" : "pending";

  // Build player circles from playerResponses data
  // If we have individual response data, use it; otherwise fall back to placeholder circles
  const otherPlayerResponses = Object.entries(playerResponses).filter(([pid]) => pid !== currentUserId);
  const otherPlayersCount = totalPlayers - 1;
  const respondedCount = otherPlayerResponses.length;

  // Create player circles data (user's circle is first)
  const playerCircles = [
    { status: userStatus, isUser: true, displayName: "You" },
    ...Object.entries(playerResponses)
      .filter(([pid]) => pid !== currentUserId)
      .map(([pid, data]) => ({
        status: data.response as "in" | "out" | "pending",
        isUser: false,
        displayName: data.displayName,
      })),
    // Fill remaining circles as pending if we have fewer responses than expected
    ...Array(Math.max(0, otherPlayersCount - respondedCount)).fill(null).map(() => ({
      status: "pending" as const,
      isUser: false,
      displayName: "?",
    })),
  ];

  const handleResponse = useCallback((wantToPlay: boolean) => {
    // Update local state immediately
    updatePlayAgainState({ userResponse: wantToPlay ? "yes" : "no" });
    // Also send to server
    onPlayAgainResponse?.(wantToPlay);
  }, [onPlayAgainResponse, updatePlayAgainState]);

  const progressPercentage = totalPlayers > 0
    ? Math.round((confirmedPlayers / totalPlayers) * 100)
    : 0;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 className={styles.title}>Rematch?</h2>
        
        <p className={styles.subtitle}>
          Keep the game going with the same crew!
        </p>

        {/* Player circles */}
        <div className={styles.playerIndicators}>
          {playerCircles.map((player, index) => (
            <div
              key={index}
              className={`${styles.playerCircle} ${
                player.status === "in" ? styles.in :
                player.status === "out" ? styles.out :
                styles.pending
              }`}
              title={player.displayName}
            />
          ))}
        </div>

        <div className={styles.buttonGroup}>
          <button 
            className={`${styles.button} ${styles.yesButton} ${userResponse === "yes" ? styles.selected : ""}`}
            onClick={() => handleResponse(true)}
            disabled={disabled || userResponse !== null}
          >
            <Gamepad2 size={24} />
            <span>In</span>
          </button>
          
          <button 
            className={`${styles.button} ${styles.noButton} ${userResponse === "no" ? styles.selected : ""}`}
            onClick={() => handleResponse(false)}
            disabled={disabled || userResponse !== null}
          >
            <LogOut size={24} />
            <span>Out</span>
          </button>
        </div>

        <div className={styles.statusContainer}>
          <p className={styles.optInCount}>
            {confirmedPlayers} / {totalPlayers} opted in
          </p>

          <p className={styles.playersNeeded}>
            {neededToStart > 0 
              ? `${neededToStart} more needed to start` 
              : "Ready to play!"}
          </p>

          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {userResponse ? (
            <p className={styles.responseStatus}>
              {userResponse === "yes"
                ? "You're in! Waiting for others..."
                : "See you next time!"}
            </p>
          ) : (
            <p className={styles.timeout}>
              Auto-closing in {formatTime(timeRemaining)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
