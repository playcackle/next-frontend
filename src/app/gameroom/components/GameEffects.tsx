import { useAnimationState } from "../hooks/useGameState";
import ConfettiExplosion from "./confetti-explosion";
import ParticleExplosion from "./particle-explosion";

interface GameEffectsProps {
  animationState: any; // Replace with proper type
}

export default function GameEffects({ animationState }: GameEffectsProps) {
  const { showConfetti, confettiPosition } = useAnimationState();

  return (
    <>
      {showConfetti && confettiPosition && (
        <ConfettiExplosion
          isBonus={animationState.isBonus}
          x={confettiPosition.x}
          y={confettiPosition.y}
          centered={false}
          playerColor={"--neon-blue"}
        />
      )}

      {animationState.particlePosition && (
        <ParticleExplosion
          x={animationState.particlePosition.x}
          y={animationState.particlePosition.y}
          isBonus={animationState.isBonus}
        />
      )}

      {animationState.showGlitter && <div className="glitterOverlay"></div>}
    </>
  );
}
