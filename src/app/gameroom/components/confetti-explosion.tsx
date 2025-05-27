"use client";

import type React from "react";

import { useEffect, useRef, useState } from "react";
import styles from "./confetti.module.css";

// Update the ConfettiProps type to include playerColor
type ConfettiProps = {
  duration?: number;
  particleCount?: number;
  colors?: string[];
  isBonus?: boolean;
  x?: number;
  y?: number;
  centered?: boolean;
  playerColor?: string; // Add player color prop
};

type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  speedX: number;
  speedY: number;
  gravity: number;
  opacity: number;
};

// Update the component parameters to include playerColor
export default function ConfettiExplosion({
  duration = 5000,
  particleCount = 150,
  colors = ["#ff00aa", "#00ddff", "#b700ff", "#00ff66", "#ffcc00", "#ff3366"],
  isBonus = false,
  x,
  y,
  centered = false,
  playerColor,
}: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [active, setActive] = useState(true);
  const startTimeRef = useRef<number>(0);

  // Extract colors from player's color scheme if provided
  const extractColorsFromGradient = (gradientString: string): string[] => {
    const colorRegex = /#[0-9a-f]{3,6}|rgba?$$[^)]+$$/gi;
    const matches = gradientString.match(colorRegex);
    return matches || [];
  };

  // Use different colors and more particles for bonus slots
  const bonusColors = [
    "#ffd700",
    "#ffcc00",
    "#ff9900",
    "#ff6600",
    "#ff3300",
    "#ff00ff",
    "#cc00ff",
    "#9900ff",
  ];

  // Determine the final colors to use
  let finalColors = colors;
  if (playerColor) {
    // Extract colors from player's gradient
    const extractedColors = extractColorsFromGradient(playerColor);
    if (extractedColors.length > 0) {
      // If we have player colors, use them with some bonus colors for variety
      finalColors = isBonus
        ? [...extractedColors, ...bonusColors.slice(0, 3)]
        : extractedColors;
    }
  } else {
    // Fall back to default colors
    finalColors = isBonus ? bonusColors : colors;
  }

  const finalParticleCount = isBonus ? particleCount * 1.5 : particleCount;

  // Initialize particles
  useEffect(() => {
    if (typeof window === "undefined") return;

    const newParticles: Particle[] = [];
    const particleCount = finalParticleCount;

    for (let i = 0; i < particleCount; i++) {
      // Random angle and distance
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 100;

      // Calculate end position
      const endX = Math.cos(angle) * distance;
      const endY = Math.sin(angle) * distance;

      newParticles.push({
        id: i,
        x: endX,
        y: endY,
        size: isBonus ? 5 + Math.random() * 20 : 5 + Math.random() * 15, // Larger particles for bonus
        color: finalColors[Math.floor(Math.random() * finalColors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        speedX: (Math.random() - 0.5) * (isBonus ? 30 : 20), // Faster for bonus
        speedY: -5 - Math.random() * (isBonus ? 15 : 10), // Initial upward velocity, stronger for bonus
        gravity: 0.2 + Math.random() * 0.2,
        opacity: 1,
      });
    }

    setParticles(newParticles);
    setActive(true);

    // Set a timeout to remove the confetti after duration
    const timer = setTimeout(() => {
      setActive(false);
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [finalParticleCount, finalColors, duration, isBonus]);

  // Animation loop
  useEffect(() => {
    if (!active) return;

    let animationFrameId: number;
    const lastTime = 0;

    const animate = (time: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = time;
      }

      const elapsed = time - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Only update state if we're still active
      if (active) {
        setParticles((prevParticles) =>
          prevParticles.map((particle) => {
            // Apply gravity and movement
            const newY = particle.y + particle.speedY;
            const newX = particle.x + particle.speedX;

            // Update speed with gravity
            const newSpeedY = particle.speedY + particle.gravity;

            // Fade out as time progresses
            const newOpacity = particle.opacity * (1 - progress * 0.5);

            return {
              ...particle,
              y: newY,
              x: newX,
              speedY: newSpeedY,
              rotation: particle.rotation + particle.rotationSpeed,
              opacity: newOpacity,
            };
          })
        );

        // Continue animation if we're still active
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [active, duration]);

  if (!active) return null;

  // Determine the container style based on whether it should be centered or positioned
  const containerStyle: React.CSSProperties = centered
    ? { position: "fixed", top: "0", left: "0", width: "100%", height: "100%" }
    : {
        position: "absolute",
        top: `${y || 0}px`,
        left: `${x || 0}px`,
        transform: "translate(-50%, -50%)",
      };

  return (
    <div className={styles.confettiContainer} style={containerStyle}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`${styles.confettiParticle} ${
            isBonus ? styles.bonusConfetti : ""
          }`}
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size * 0.4}px`,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
            opacity: particle.opacity,
          }}
        />
      ))}
    </div>
  );
}
