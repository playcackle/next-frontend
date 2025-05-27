"use client";

import type React from "react";

import { useEffect, useState } from "react";
import styles from "./particle.module.css";

type ParticleProps = {
  x: number;
  y: number;
  isBonus?: boolean;
};

export default function ParticleExplosion({
  x,
  y,
  isBonus = false,
}: ParticleProps) {
  const [particles, setParticles] = useState<
    { id: number; x: number; y: number }[]
  >([]);

  useEffect(() => {
    // Create particles
    const newParticles = [];
    const particleCount = 30; // Number of particles

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
      });
    }

    setParticles(newParticles);

    // Clean up particles after animation
    const timer = setTimeout(() => {
      setParticles([]);
    }, 1000);

    return () => clearTimeout(timer);
  }, [x, y]);

  return (
    <div className={styles.particleContainer}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`${styles.particle} ${
            isBonus ? styles.particlePurple : ""
          }`}
          style={
            {
              left: `${x}px`,
              top: `${y}px`,
              "--x": `${particle.x}px`,
              "--y": `${particle.y}px`,
            } as React.CSSProperties
          }
        ></div>
      ))}
    </div>
  );
}
