"use client";

import SoundEffects from "@/app/components/sound-effects";
import { useSearchParams } from "next/navigation";
import React, { useRef, useState, useEffect } from "react";
import ConfettiExplosion from "./confetti-explosion";
import styles from "./gameroom.module.css";
import ParticleExplosion from "./particle-explosion";

// Import custom hooks
import { useAnimations } from "./hooks/useAnimations";
import { usePlayers } from "./hooks/usePlayers";

// Import components
import { useAtomValue } from "jotai";
import { gameRoomAtom } from "../store/lobby";
import ChatContainer from "./chat-container";
import AnswerForm from "./components/AnswerForm";
import CountdownOverlay from "./components/CountdownOverlay";
import RoomHeader from "./components/RoomHeader";
import SlotGrid from "./components/SlotGrid";
import StatsRow from "./components/StatsRow";
import { useGameSocket } from "./hooks/useGameWs";
import { GameEvent } from "./types";

export default function GameroomPage() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name");
  const [answer, setAnswer] = useState<string>("");
  const gameroom = useAtomValue(gameRoomAtom);

  if (!gameroom) {
    return <div>Loading gameroom...</div>;
  }

  const gameRoomWs = useGameSocket(gameroom.game_ws_url, gameroom.token);

  // Refs
  const mainRef = useRef<HTMLDivElement>(null);

  // Custom hooks
  const { players: initialPlayers, getCurrentPlayer } = usePlayers();
  const { animationState, triggerCorrectAnimations } = useAnimations();

  // State for sound loading
  const [soundsLoaded, setSoundsLoaded] = React.useState(false);
  const [showConfetti, setShowConfetti] = React.useState(false);

  // Add a new state for confetti position
  const [confettiPosition, setConfettiPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [activePlayers, setActivePlayers] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(45);
  const [players, setPlayers] = useState<any[]>([]); // Replace any with Player type if available
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!gameRoomWs) return;
    // Listen for lobby_tick to update activePlayers and timeRemaining
    gameRoomWs.onEvent("lobby_tick", (data) => {
      console.log("[Game WS] lobby_tick event received:", data);
      setActivePlayers(data.player_count);
      setTimeRemaining(data.time_remaining_seconds ?? 0);
    });
    // Listen for round_over_timeout to update leaderboard
    gameRoomWs.onEvent("round_over_timeout", (data) => {
      setPlayers(data.player_scores);
    });
    // Listen for round_over_all_snapped to update leaderboard
    gameRoomWs.onEvent("round_over_all_snapped", (data) => {
      setPlayers(data.player_scores);
    });
    // Listen for game_over to update leaderboard
    gameRoomWs.onEvent("game_over", (data) => {
      setPlayers(data.final_scores);
    });
    // Listen for submission feedback
    gameRoomWs.onEvent("submission_feedback", (data) => {
      console.log("[Game WS] Submission feedback:", data);
      setIsSubmitting(false);
      if (data.status === "correct") {
        // Trigger animations for correct answer
        triggerCorrectAnimations(parseInt(data.slot_id!), null, mainRef);
        // Play success sound
        if (typeof window !== 'undefined' && 'playFallbackAudio' in window) {
          (window as any).playFallbackAudio();
        }
      }
    });
  }, [gameRoomWs, triggerCorrectAnimations]);

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isSubmitting || !gameRoomWs) return;
    setIsSubmitting(true);
    gameRoomWs.sendEvent("submit_answer", answer);
    setAnswer(""); // Clear the input after submission
  };

  return (
    <div className={styles.container}>
      {/* Countdown overlay */}
      <CountdownOverlay show={false} value={2} />

      {/* Confetti explosion */}
      {true && confettiPosition && (
        <ConfettiExplosion
          isBonus={animationState.isBonus}
          x={confettiPosition.x}
          y={confettiPosition.y}
          centered={false}
          playerColor={"--neon-blue"} // Add player color
        />
      )}

      <main
        ref={mainRef}
        className={`
          ${styles.main}
          ${animationState.screenShake ? styles.screenShake : ""}
          ${animationState.colorFlash ? styles.colorFlash : ""}
          ${animationState.zoomEffect ? styles.zoomEffect : ""}
          ${animationState.rotateEffect ? styles.rotateEffect : ""}
        `}
      >
        {/* Room title */}
        <RoomHeader name={name!} roundNumber={1} />

        {/* Sound effects */}
        <SoundEffects onLoad={() => setSoundsLoaded(true)} />

        {/* Glitter overlay */}
        {animationState.showGlitter && (
          <div className={styles.glitterOverlay}></div>
        )}

        {/* Particle explosion */}
        {animationState.particlePosition && (
          <ParticleExplosion
            x={animationState.particlePosition.x}
            y={animationState.particlePosition.y}
            isBonus={animationState.isBonus}
          />
        )}

        {/* First row: Stats tiles */}
        <StatsRow
          activePlayers={activePlayers}
          isIntermission={false}
          timeRemaining={timeRemaining}
          intermissionTimeRemaining={90}
          players={players}
          nameFlash={animationState.nameFlash}
        />

        {/* Second row: Slots grid and chat */}
        <div className={styles.contentRow}>
          <SlotGrid
            slots={[]}
            bonusSlots={[]}
            animatingTile={animationState.animatingTile}
            timeExpired={false}
            isIntermission={false}
          />
          <ChatContainer />
        </div>

        {/* Third row: Answer input and feedback */}
        <div className={styles.answerRow}>
          <AnswerForm
            answer={answer}
            setAnswer={setAnswer}
            timeExpired={false}
            isIntermission={false}
            intermissionTimeRemaining={10}
            onSubmit={handleSubmitAnswer}
          />
        </div>
      </main>
    </div>
  );
}
