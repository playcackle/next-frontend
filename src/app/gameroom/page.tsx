"use client";

import SoundEffects from "@/components/sound-effects";
import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./gameroom.module.css";

// Import custom hooks
import { useUser } from "@/hooks/useUser";
import { useAtomValue, useSetAtom } from "jotai";
import Link from "next/link";
import Progress from "../loading";
import { gameRoomAtom } from "../store/gameRoom";
import CountdownOverlay from "./components/CountdownOverlay";
import UnifiedInputForm from "./components/UnifiedInputForm";
import UnifiedMessages from "./components/UnifiedMessages";

// Import optimized components
import ConnectionBanner from "./components/ConnectionBanner";
import SlotGrid from "./components/SlotGrid";
import StatsRow from "./components/StatsRow";

import { setSentryGameContext } from "@/lib/sentry";
import { Flex } from "@radix-ui/themes";
import AnswerReveal from "./components/AnswerReveal";
import Leaderboard from "./components/LeaderBoard";
import OptInPanel from "./components/OptInPanel";
import PostgameShowcase from "./components/PostgameShowcase";
import WaitingPanel from "./components/WaitingPanel";
import { useAnswerBubbles } from "./hooks/useAnswerBubbles";
import { useChatSocket } from "./hooks/useChatWs";
import { useGameActions } from "./hooks/useGameActions";
import { useGameEvents } from "./hooks/useGameEvents";
import {
  chatConnectionStatusAtom,
  currentUserIdAtom,
  isRoundBreakAtom,
  loadingAtom,
  lobbyStatusAtom,
  minPlayersNeededAtom,
  playerCountAtom,
  scoresAtom,
  showCountDownAtom,
  timeRemainingAtom,
  updateGameStateAtom,
} from "./store/gameAtoms";

function NoGameroom() {
  return (
    <div
      className={styles.container}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <p style={{ marginBottom: "1rem" }}>No gameroom selected.</p>
        <Link href="/gamerooms" className={styles.backLink}>
          Browse gamerooms
        </Link>
      </div>
    </div>
  );
}

export default function GameroomPage() {
  const gameroom = useAtomValue(gameRoomAtom);
  const { addAnswerBubble, bubbles, removeBubble } = useAnswerBubbles();
  const { user } = useUser();
  const setCurrentUserId = useSetAtom(currentUserIdAtom);

  // Use atomic selectors for optimal performance
  const loading = useAtomValue(loadingAtom);
  const isRoundBreak = useAtomValue(isRoundBreakAtom);
  const timeRemaining = useAtomValue(timeRemainingAtom);
  const showCountDown = useAtomValue(showCountDownAtom);
  const scores = useAtomValue(scoresAtom);
  const lobbyStatus = useAtomValue(lobbyStatusAtom);
  const minPlayersNeeded = useAtomValue(minPlayersNeededAtom);
  const playerCount = useAtomValue(playerCountAtom);

  const isWaiting =
    lobbyStatus === "WAITING" || lobbyStatus === "STARTING_SOON";
  const isShowcase = lobbyStatus === "POST_GAME_SHOWCASE";
  const missingPlayers = Math.max(0, minPlayersNeeded - playerCount);

  // Granular atom subscription — avoids full-state re-render on every game tick
  const updateGameState = useSetAtom(updateGameStateAtom);

  // Refs
  const mainRef = useRef<HTMLDivElement>(null);
  const previousPositionsRef = useRef<Map<string, number>>(new Map());
  const [playerAnimations, setPlayerAnimations] = useState<
    Map<string, "up" | "down" | "none">
  >(new Map());

  useEffect(() => {
    const newAnimations = new Map<string, "up" | "down" | "none">();

    scores.slice(0, 10).forEach((player, currentIndex) => {
      const previousRank = previousPositionsRef.current.get(player.player_id);

      if (previousRank !== undefined && previousRank !== currentIndex) {
        // Player moved positions
        if (currentIndex < previousRank) {
          newAnimations.set(player.player_id, "up");
        } else {
          newAnimations.set(player.player_id, "down");
        }
      }
    });

    if (newAnimations.size > 0) {
      setPlayerAnimations(newAnimations);

      // Clear animations after they complete
      setTimeout(() => {
        setPlayerAnimations(new Map());
      }, 600);
    }

    // Update previous positions
    const newPositions = new Map<string, number>();
    scores.slice(0, 10).forEach((player, index) => {
      newPositions.set(player.player_id, index);
    });
    previousPositionsRef.current = newPositions;
  }, [scores]);

  useEffect(() => {
    if (gameroom?.game_ws_url) {
      const phase = isRoundBreak ? "round_break" : "answering";
      setSentryGameContext(gameroom.game_ws_url, phase);
    }
  }, [gameroom?.game_ws_url, isRoundBreak]);

  useEffect(() => {
    setCurrentUserId(user?.id ?? null);
  }, [user?.id, setCurrentUserId]);

  // WebSocket connections — must be called unconditionally before any conditional return
  const { sendEvent, reconnect: reconnectGame } = useGameEvents(
    gameroom?.game_ws_url ?? "",
    gameroom?.token ?? "",
  );

  // Custom hooks
  const { submitAnswer, sendPlayAgainResponse } = useGameActions();

  // Handle play again response from OptInPanel
  const handlePlayAgainResponse = (wantToPlay: boolean) => {
    if (sendEvent) {
      sendPlayAgainResponse(wantToPlay, sendEvent);
    }
  };

  // Chat socket connection
  const baseWsUrl = (gameroom?.game_ws_url ?? "").replace(/\/(game|chat)$/, "");
  const {
    sendMessage: sendChatMessage,
    connectionStatus: chatConnectionStatus,
    reconnect: reconnectChat,
  } = useChatSocket(baseWsUrl, gameroom?.token ?? "");

  const setChatConnectionStatus = useSetAtom(chatConnectionStatusAtom);
  useEffect(() => {
    setChatConnectionStatus(chatConnectionStatus);
  }, [chatConnectionStatus, setChatConnectionStatus]);

  // Unified submission handler — returns false if the message could not be sent
  const handleUnifiedSubmit = (message: string, isAnswer: boolean): boolean => {
    if (isAnswer) {
      addAnswerBubble(message);
      submitAnswer(message, sendEvent);
      return true;
    }
    return sendChatMessage(message);
  };

  const handleSoundsLoaded = useRef(false);

  const onSoundsLoaded = useCallback(() => {
    if (!handleSoundsLoaded.current) {
      handleSoundsLoaded.current = true;
      updateGameState({ soundsLoaded: true });
    }
  }, [updateGameState]);

  if (!gameroom) {
    return <NoGameroom />;
  }

  return (
    <>
      <ConnectionBanner onRetry={reconnectGame} onChatRetry={reconnectChat} />
      {loading && <Progress />}
      {!loading && (
        <div className={styles.container}>
          <CountdownOverlay show={showCountDown} value={timeRemaining} />

          <div
            ref={mainRef}
            className={styles.main}
          >
            <SoundEffects onLoad={onSoundsLoaded} />

            {!isWaiting && <StatsRow />}

            <div
              className={
                isWaiting ? styles.waitingContentRow : styles.contentRow
              }
            >
              <Flex direction="column" gap="3">
                <UnifiedMessages />
                <div className={styles.answerRow}>
                  <UnifiedInputForm
                    onSubmit={handleUnifiedSubmit}
                    bubbles={bubbles}
                    onBubbleComplete={removeBubble}
                  />
                </div>
              </Flex>
              {isWaiting ? (
                <WaitingPanel currentUserId={user?.id ?? null} />
              ) : (
                <>
                  {isShowcase && (
                    <>
                      <PostgameShowcase />
                      <OptInPanel onPlayAgainResponse={handlePlayAgainResponse} currentUserId={user?.id} />
                    </>
                  )}
                  {isRoundBreak && <AnswerReveal />}
                  {isRoundBreak || isShowcase ? (
                    <Leaderboard />
                  ) : (
                    <div className={styles.slotColumnWrapper}>
                      <div
                        className={styles.slotContainer}
                        style={
                          {
                            "--room-color": "var(--neon-pink)",
                          } as React.CSSProperties
                        }
                      >
                        <SlotGrid />
                      </div>
                    </div>
                  )}
                </>
              )}
              {!isWaiting && !isRoundBreak && !isShowcase && (
                <div className={styles.leaderboardTile}>
                  <h3 className={styles.statsTitle}>Leaderboard</h3>
                  <div className={styles.ingameLeaderboard}>
                    {scores.slice(0, 10).map((player, index) => {
                      const animation =
                        playerAnimations.get(player.player_id) || "none";

                      return (
                        <div
                          key={player.player_id}
                          className={`${styles.leaderboardPlayer} ${
                            animation === "up"
                              ? styles.rankUp
                              : animation === "down"
                                ? styles.rankDown
                                : ""
                          }`}
                        >
                          <div className={styles.playerRank}>{index + 1}</div>
                          <div className={styles.playerName}>
                            {player.display_name}
                          </div>
                          <div className={styles.playerScore}>
                            {player.score}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
