"use client";

import SoundEffects from "@/app/components/sound-effects";
import { useSearchParams } from "next/navigation";
import React, { useRef } from "react";
import styles from "./gameroom.module.css";

// Import custom hooks
import { useAtomValue } from "jotai";
import Progress from "../loading";
import { gameRoomAtom } from "../store/gameRoom";
import ChatContainer from "./chat-container";
import CountdownOverlay from "./components/CountdownOverlay";
import RoomHeader from "./components/RoomHeader";

// Import optimized components
import AnswerForm from "./components/AnswerForm";
import GameEffects from "./components/GameEffects";
import SlotGrid from "./components/SlotGrid";
import StatsRow from "./components/StatsRow";

import { Flex } from "@radix-ui/themes";
import Leaderboard from "./components/LeaderBoard";
import { useAnswerBubbles } from "./hooks/useAnswerBubbles";
import { useGameActions } from "./hooks/useGameActions";
import { useGameEvents } from "./hooks/useGameEvents";
import {
  useAnswer,
  useGameState,
  useRecentAnswers,
} from "./hooks/useGameState";

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

  // Refs
  const mainRef = useRef<HTMLDivElement>(null);

  // Custom hooks
  const { submitAnswer } = useGameActions();

  if (!gameroom) {
    return <div>Loading gameroom...</div>;
  }

  // Game events handling
  const { sendEvent } = useGameEvents(gameroom.game_ws_url, gameroom.token);

  const handleSubmitAnswer = (e: React.FormEvent) => {
    addAnswerBubble(answer);
    e.preventDefault();
    submitAnswer(answer, sendEvent);
    clearAnswer();
    setRecentAnswers((prev) =>
      [...prev, { id: Math.random().toString(), text: answer }].slice(0, 10)
    );
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
                  <AnswerForm
                    onSubmit={handleSubmitAnswer}
                    bubbles={bubbles}
                    onBubbleComplete={removeBubble}
                    recentAnswers={recentAnswers}
                  />
                </div>
              </Flex>
              <ChatContainer />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
