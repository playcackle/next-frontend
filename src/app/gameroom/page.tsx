"use client";

import SoundEffects from "@/app/components/sound-effects";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useRef } from "react";
import styles from "./gameroom.module.css";

// Import custom hooks
import { useAtomValue, useSetAtom } from "jotai";
import Progress from "../loading";
import { gameRoomAtom } from "../store/gameRoom";
import CountdownOverlay from "./components/CountdownOverlay";
import RoomHeader from "./components/RoomHeader";
import UnifiedInputForm from "./components/UnifiedInputForm";
import UnifiedMessages from "./components/UnifiedMessages";

// Import optimized components
import GameEffects from "./components/GameEffects";
import SlotGrid from "./components/SlotGrid";
import StatsRow from "./components/StatsRow";

import { Flex } from "@radix-ui/themes";
import AnswerReveal from "./components/AnswerReveal";
import Leaderboard from "./components/LeaderBoard";
import { useAnswerBubbles } from "./hooks/useAnswerBubbles";
import { useChatSocket } from "./hooks/useChatWs";
import { useGameActions } from "./hooks/useGameActions";
import { useGameEvents } from "./hooks/useGameEvents";
import { useGameState } from "./hooks/useGameState";
import { addUnifiedMessageAtom, animationStateAtom } from "./store/gameAtoms";

export default function GameroomPage() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name");
  const gameroom = useAtomValue(gameRoomAtom);
  const { addAnswerBubble, bubbles, removeBubble } = useAnswerBubbles();

  // Global state hooks
  const {
    loading,
    isRoundBreak,
    timeRemaining,
    showCountDown,
    updateGameState,
    scores,
  } = useGameState();

  // Unified message system
  const addUnifiedMessage = useSetAtom(addUnifiedMessageAtom);

  // Refs
  const mainRef = useRef<HTMLDivElement>(null);

  // Custom hooks
  const { submitAnswer } = useGameActions();

  if (!gameroom) {
    return <div>Loading gameroom...</div>;
  }

  // WebSocket connections
  const { sendEvent } = useGameEvents(gameroom.game_ws_url, gameroom.token);

  // Chat socket connection
  function getBaseWsUrl(url: string) {
    return url.replace(/\/(game|chat)$/, "");
  }
  const baseWsUrl = getBaseWsUrl(gameroom.game_ws_url);
  const { sendMessage: sendChatMessage } = useChatSocket(
    baseWsUrl,
    gameroom.token
  );

  // Unified submission handler
  const handleUnifiedSubmit = (message: string, isAnswer: boolean) => {
    if (isAnswer) {
      // Answer submission logic
      addAnswerBubble(message);
      submitAnswer(message, sendEvent);

      // Add to unified messages as answer attempt (visible to all)
      // This will be handled by backend cross-namespace emission
    } else {
      // Chat message logic
      sendChatMessage(message);
    }
  };

  const handleSoundsLoaded = useRef(false);

  const onSoundsLoaded = useCallback(() => {
    if (!handleSoundsLoaded.current) {
      handleSoundsLoaded.current = true;
      updateGameState({ soundsLoaded: true });
    }
  }, [updateGameState]);

  return (
    <>
      {loading && <Progress />}
      {!loading && (
        <div className={styles.container}>
          <CountdownOverlay show={showCountDown} value={timeRemaining} />

          <GameEffects animationState={animationStateAtom} />

          <div
            ref={mainRef}
            className={`
              ${styles.main}
            `}
          >
            <RoomHeader roomName={name!} />

            <SoundEffects onLoad={onSoundsLoaded} />

            <StatsRow nameFlash={false} />

            <div className={styles.contentRow}>
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
              {isRoundBreak ? (
                <Leaderboard />
              ) : (
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
              )}

              {!isRoundBreak && (
                <div className={styles.leaderboardTile}>
                  <h3 className={styles.statsTitle}>Leaderboard</h3>
                  <div className={styles.ingameLeaderboard}>
                    {scores.slice(0, 10).map((player, index) => (
                      <div
                        key={player.player_id}
                        className={`${styles.leaderboardPlayer} ${
                          player.display_name === "You" && false
                            ? styles.nameFlash
                            : ""
                        }`}
                      >
                        <div className={styles.playerRank}>{index + 1}</div>
                        <div className={styles.playerName}>
                          {player.display_name}
                        </div>
                        <div className={styles.playerScore}>{player.score}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {isRoundBreak && <AnswerReveal />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
