"use client";

import SoundEffects from "@/app/components/sound-effects";
import { useSearchParams } from "next/navigation";
import React, { useRef, useEffect } from "react";
import styles from "./gameroom.module.css";

// Import custom hooks
import { useAtomValue, useSetAtom } from "jotai";
import Progress from "../loading";
import { gameRoomAtom } from "../store/gameRoom";
import CountdownOverlay from "./components/CountdownOverlay";
import RoomHeader from "./components/RoomHeader";
import UnifiedMessages from "./components/UnifiedMessages";
import UnifiedInputForm from "./components/UnifiedInputForm";

// Import optimized components
import GameEffects from "./components/GameEffects";
import SlotGrid from "./components/SlotGrid";
import StatsRow from "./components/StatsRow";

import { Flex } from "@radix-ui/themes";
import Leaderboard from "./components/LeaderBoard";
import { useAnswerBubbles } from "./hooks/useAnswerBubbles";
import { useGameActions } from "./hooks/useGameActions";
import { useGameEvents } from "./hooks/useGameEvents";
import { useChatSocket } from "./hooks/useChatWs";
import {
  useAnswer,
  useGameState,
  useRecentAnswers,
} from "./hooks/useGameState";
import { 
  UnifiedMessage,
  addUnifiedMessageAtom
} from "./store/gameAtoms";

export default function GameroomPage() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name");
  const gameroom = useAtomValue(gameRoomAtom);
  const { addAnswerBubble, bubbles, removeBubble } = useAnswerBubbles();

  // Global state hooks
  const {
    loading,
    roundName,
    roundNumber,
    isRoundBreak,
    timeRemaining,
    showCountDown,
    updateGameState,
  } = useGameState();
  const { clearAnswer, answer } = useAnswer();
  const { recentAnswers, setRecentAnswers } = useRecentAnswers();

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
      setRecentAnswers((prev) =>
        [...prev, { id: Math.random().toString(), text: message }].slice(0, 10)
      );
      
      // Add to unified messages as answer attempt (visible to all)
      // This will be handled by backend cross-namespace emission
    } else {
      // Chat message logic
      sendChatMessage(message);
    }
  };

  const handleSoundsLoaded = () => {
    updateGameState({ soundsLoaded: true });
  };

  return (
    <>
      {loading && <Progress />}
      {!loading && (
        <div className={styles.container}>
          <CountdownOverlay show={showCountDown} value={timeRemaining} />

          <GameEffects animationState={{}} />

          <div
            ref={mainRef}
            className={`
              ${styles.main}
            `}
          >
            <RoomHeader
              roundName={roundName}
              roomName={name!}
              roundNumber={roundNumber}
              totalRounds={10}
            />

            <SoundEffects onLoad={handleSoundsLoaded} />

            <StatsRow nameFlash={false} />

            <div className={styles.contentRow}>
              <Flex direction="column" gap="3">
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
                <div className={styles.answerRow}>
                  <UnifiedInputForm
                    onSubmit={handleUnifiedSubmit}
                    bubbles={bubbles}
                    onBubbleComplete={removeBubble}
                    recentAnswers={recentAnswers}
                  />
                </div>
              </Flex>
              <UnifiedMessages />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
