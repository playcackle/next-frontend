"use client";

import SoundEffects from "@/app/components/sound-effects";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import ConfettiExplosion from "./confetti-explosion";
import styles from "./gameroom.module.css";
import ParticleExplosion from "./particle-explosion";

// Import custom hooks
import { useAnimations } from "./hooks/useAnimations";
import { usePlayers } from "./hooks/usePlayers";

// Import components
import { useAtomValue } from "jotai";
import { gameRoomAtom } from "../store/lobby";
import AnswerForm from "./components/AnswerForm";
import CountdownOverlay from "./components/CountdownOverlay";
import RoomHeader from "./components/RoomHeader";
import SlotGrid from "./components/SlotGrid";
import StatsRow from "./components/StatsRow";

export default function GameroomPage() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name");
  const [answer, setAnswer] = useState<string>("");
  const gameroom = useAtomValue(gameRoomAtom);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(gameroom?.game_ws_url!);

    ws.current.onopen = () => {
      console.log("✅ WebSocket connected");
    };

    ws.current.onmessage = (event) => {
      try {
        const data = event.data;
        debugger;
        console.log("🎮 Received:", data);
      } catch (err) {
        console.error("❌ Failed to parse message:", err);
      }
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.current.onclose = () => {
      console.log("❎ WebSocket disconnected");
    };

    return () => {
      ws.current?.close();
    };
  }, [gameroom]);

  // Refs
  const mainRef = useRef<HTMLDivElement>(null);

  // Custom hooks

  const { players, getCurrentPlayer } = usePlayers();

  const { animationState, triggerCorrectAnimations } = useAnimations();

  // State for sound loading
  const [soundsLoaded, setSoundsLoaded] = React.useState(false);
  const [showConfetti, setShowConfetti] = React.useState(false);

  // Add a new state for confetti position
  const [confettiPosition, setConfettiPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

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
          playerColor={getCurrentPlayer().color} // Add player color
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
          activePlayers={1}
          isIntermission={false}
          timeRemaining={45}
          intermissionTimeRemaining={90}
          players={players}
          nameFlash={animationState.nameFlash}
        />

        {/* Second row: Questions grid and chat */}
        <div className={styles.contentRow}>
          <SlotGrid
            slots={[]}
            bonusSlots={[]}
            animatingTile={animationState.animatingTile}
            timeExpired={false}
            isIntermission={false}
          />
        </div>

        {/* Third row: Answer input and feedback */}
        <div className={styles.answerRow}>
          <AnswerForm
            answer={answer}
            setAnswer={setAnswer}
            timeExpired={false}
            isIntermission={false}
            intermissionTimeRemaining={10}
            onSubmit={() => console.log()}
          />
        </div>
      </main>
    </div>
  );
}
