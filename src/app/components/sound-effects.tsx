"use client";

import { useCallback, useEffect, useRef } from "react";

type SoundEffectProps = {
  onLoad?: () => void;
};

// Sound types
export type SoundType =
  | "correct"
  | "bonus"
  | "success1"
  | "success2"
  | "success3"
  | "timeUp";

// Audio context singleton to prevent multiple instances
let globalAudioContext: AudioContext | null = null;

const getOrCreateAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;

  try {
    if (!globalAudioContext || globalAudioContext.state === "closed") {
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        globalAudioContext = new AudioContext();
        console.log("Audio context created successfully");
      } else {
        console.error("Web Audio API not supported in this browser");
        return null;
      }
    }
    return globalAudioContext;
  } catch (e) {
    console.error("Error creating audio context:", e);
    return null;
  }
};

// Sound generation functions (memoized outside component to prevent recreation)
const createSoundGenerators = () => {
  const playCelebratoryCorrectSound = () => {
    try {
      const context = getOrCreateAudioContext();
      if (!context) return;

      // Create oscillator for the main tone
      const oscillator1 = context.createOscillator();
      oscillator1.type = "sine";
      oscillator1.frequency.setValueAtTime(440, context.currentTime);
      oscillator1.frequency.exponentialRampToValueAtTime(
        880,
        context.currentTime + 0.15
      );
      oscillator1.frequency.exponentialRampToValueAtTime(
        1320,
        context.currentTime + 0.3
      );

      // Create a second oscillator for harmony
      const oscillator2 = context.createOscillator();
      oscillator2.type = "triangle";
      oscillator2.frequency.setValueAtTime(554.37, context.currentTime);
      oscillator2.frequency.exponentialRampToValueAtTime(
        1108.73,
        context.currentTime + 0.3
      );

      // Create gain nodes for volume control
      const gainNode1 = context.createGain();
      gainNode1.gain.setValueAtTime(0.3, context.currentTime);
      gainNode1.gain.exponentialRampToValueAtTime(
        0.01,
        context.currentTime + 0.4
      );

      const gainNode2 = context.createGain();
      gainNode2.gain.setValueAtTime(0.2, context.currentTime);
      gainNode2.gain.exponentialRampToValueAtTime(
        0.01,
        context.currentTime + 0.4
      );

      // Add delay effect
      const delay = context.createDelay(0.5);
      delay.delayTime.value = 0.1;

      const delayGain = context.createGain();
      delayGain.gain.value = 0.2;

      // Connect nodes
      oscillator1.connect(gainNode1);
      oscillator2.connect(gainNode2);
      gainNode1.connect(context.destination);
      gainNode2.connect(context.destination);
      gainNode1.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(context.destination);

      // Start and stop
      oscillator1.start();
      oscillator2.start();
      oscillator1.stop(context.currentTime + 0.5);
      oscillator2.stop(context.currentTime + 0.5);

      console.log("Played celebratory correct sound effect");
    } catch (e) {
      console.error("Error playing sound effect:", e);
    }
  };

  const playEpicBonusSound = () => {
    try {
      const context = getOrCreateAudioContext();
      if (!context) return;

      // Create multiple oscillators for a rich sound
      const oscillator1 = context.createOscillator();
      oscillator1.type = "sawtooth";
      oscillator1.frequency.setValueAtTime(440, context.currentTime);
      oscillator1.frequency.exponentialRampToValueAtTime(
        880,
        context.currentTime + 0.1
      );
      oscillator1.frequency.exponentialRampToValueAtTime(
        1320,
        context.currentTime + 0.2
      );
      oscillator1.frequency.exponentialRampToValueAtTime(
        1760,
        context.currentTime + 0.3
      );

      const oscillator2 = context.createOscillator();
      oscillator2.type = "square";
      oscillator2.frequency.setValueAtTime(554.37, context.currentTime);
      oscillator2.frequency.exponentialRampToValueAtTime(
        1108.73,
        context.currentTime + 0.3
      );

      const oscillator3 = context.createOscillator();
      oscillator3.type = "sine";
      oscillator3.frequency.setValueAtTime(220, context.currentTime);
      oscillator3.frequency.exponentialRampToValueAtTime(
        440,
        context.currentTime + 0.4
      );

      const oscillator4 = context.createOscillator();
      oscillator4.type = "sine";
      oscillator4.frequency.setValueAtTime(1760, context.currentTime);
      oscillator4.frequency.exponentialRampToValueAtTime(
        2200,
        context.currentTime + 0.2
      );
      oscillator4.frequency.exponentialRampToValueAtTime(
        2640,
        context.currentTime + 0.4
      );

      // Create gain nodes
      const gainNode1 = context.createGain();
      gainNode1.gain.setValueAtTime(0.25, context.currentTime);
      gainNode1.gain.exponentialRampToValueAtTime(
        0.01,
        context.currentTime + 0.7
      );

      const gainNode2 = context.createGain();
      gainNode2.gain.setValueAtTime(0.15, context.currentTime);
      gainNode2.gain.exponentialRampToValueAtTime(
        0.01,
        context.currentTime + 0.7
      );

      const gainNode3 = context.createGain();
      gainNode3.gain.setValueAtTime(0.2, context.currentTime);
      gainNode3.gain.exponentialRampToValueAtTime(
        0.01,
        context.currentTime + 0.6
      );

      const gainNode4 = context.createGain();
      gainNode4.gain.setValueAtTime(0.1, context.currentTime);
      gainNode4.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.1);
      gainNode4.gain.exponentialRampToValueAtTime(
        0.01,
        context.currentTime + 0.5
      );

      // Create effects
      const delay = context.createDelay(1.0);
      delay.delayTime.value = 0.2;

      const delayGain = context.createGain();
      delayGain.gain.value = 0.3;

      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, context.currentTime);
      filter.frequency.exponentialRampToValueAtTime(
        5000,
        context.currentTime + 0.3
      );
      filter.Q.value = 5;

      // Connect nodes
      oscillator1.connect(gainNode1);
      oscillator2.connect(gainNode2);
      oscillator3.connect(gainNode3);
      oscillator4.connect(gainNode4);

      gainNode1.connect(filter);
      gainNode2.connect(filter);
      gainNode3.connect(context.destination);
      gainNode4.connect(context.destination);

      filter.connect(context.destination);
      filter.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(context.destination);

      // Start and stop
      oscillator1.start();
      oscillator2.start();
      oscillator3.start();
      oscillator4.start(context.currentTime + 0.1);

      oscillator1.stop(context.currentTime + 0.8);
      oscillator2.stop(context.currentTime + 0.8);
      oscillator3.stop(context.currentTime + 0.7);
      oscillator4.stop(context.currentTime + 0.6);

      console.log("Played epic bonus sound effect");
    } catch (e) {
      console.error("Error playing bonus sound effect:", e);
    }
  };

  const playCelebratorySuccess1Sound = () => {
    try {
      const context = getOrCreateAudioContext();
      if (!context) return;

      const oscillator = context.createOscillator();
      oscillator.type = "square";

      const now = context.currentTime;
      oscillator.frequency.setValueAtTime(523.25, now); // C5
      oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, now + 0.2); // G5
      oscillator.frequency.setValueAtTime(1046.5, now + 0.3); // C6
      oscillator.frequency.setValueAtTime(1046.5, now + 0.45); // C6
      oscillator.frequency.setValueAtTime(1174.66, now + 0.6); // D6

      const oscillator2 = context.createOscillator();
      oscillator2.type = "triangle";
      oscillator2.frequency.setValueAtTime(261.63, now); // C4
      oscillator2.frequency.setValueAtTime(329.63, now + 0.1); // E4
      oscillator2.frequency.setValueAtTime(392.0, now + 0.2); // G4
      oscillator2.frequency.setValueAtTime(523.25, now + 0.3); // C5
      oscillator2.frequency.setValueAtTime(523.25, now + 0.45); // C5
      oscillator2.frequency.setValueAtTime(587.33, now + 0.6); // D5

      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(0.3, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        context.currentTime + 0.8
      );

      const gainNode2 = context.createGain();
      gainNode2.gain.setValueAtTime(0.2, context.currentTime);
      gainNode2.gain.exponentialRampToValueAtTime(
        0.01,
        context.currentTime + 0.8
      );

      oscillator.connect(gainNode);
      oscillator2.connect(gainNode2);
      gainNode.connect(context.destination);
      gainNode2.connect(context.destination);

      oscillator.start();
      oscillator2.start();
      oscillator.stop(context.currentTime + 0.8);
      oscillator2.stop(context.currentTime + 0.8);

      console.log("Played celebratory success1 sound effect");
    } catch (e) {
      console.error("Error playing success1 sound effect:", e);
    }
  };

  const playCelebratorySuccess2Sound = () => {
    try {
      const context = getOrCreateAudioContext();
      if (!context) return;

      const oscillator = context.createOscillator();
      oscillator.type = "square";

      const now = context.currentTime;
      oscillator.frequency.setValueAtTime(523.25, now); // C5
      oscillator.frequency.setValueAtTime(659.25, now + 0.08); // E5
      oscillator.frequency.setValueAtTime(783.99, now + 0.16); // G5
      oscillator.frequency.setValueAtTime(1046.5, now + 0.24); // C6
      oscillator.frequency.setValueAtTime(783.99, now + 0.32); // G5
      oscillator.frequency.setValueAtTime(1046.5, now + 0.4); // C6
      oscillator.frequency.setValueAtTime(1318.51, now + 0.48); // E6

      const oscillator2 = context.createOscillator();
      oscillator2.type = "triangle";
      oscillator2.frequency.setValueAtTime(261.63, now); // C4
      oscillator2.frequency.setValueAtTime(261.63, now + 0.24); // C4
      oscillator2.frequency.setValueAtTime(261.63, now + 0.48); // C4

      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

      const gainNode2 = context.createGain();
      gainNode2.gain.setValueAtTime(0.2, now);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

      oscillator.connect(gainNode);
      oscillator2.connect(gainNode2);
      gainNode.connect(context.destination);
      gainNode2.connect(context.destination);

      oscillator.start();
      oscillator2.start();
      oscillator.stop(context.currentTime + 0.7);
      oscillator2.stop(context.currentTime + 0.7);

      console.log("Played celebratory success2 sound effect");
    } catch (e) {
      console.error("Error playing success2 sound effect:", e);
    }
  };

  const playCelebratorySuccess3Sound = () => {
    try {
      const context = getOrCreateAudioContext();
      if (!context) return;

      const oscillator = context.createOscillator();
      oscillator.type = "sine";

      oscillator.frequency.setValueAtTime(440, context.currentTime); // A4
      oscillator.frequency.exponentialRampToValueAtTime(
        880,
        context.currentTime + 0.1
      ); // A5
      oscillator.frequency.exponentialRampToValueAtTime(
        659.25,
        context.currentTime + 0.2
      ); // E5
      oscillator.frequency.exponentialRampToValueAtTime(
        880,
        context.currentTime + 0.3
      ); // A5
      oscillator.frequency.exponentialRampToValueAtTime(
        1108.73,
        context.currentTime + 0.4
      ); // C#6

      const oscillator2 = context.createOscillator();
      oscillator2.type = "triangle";
      oscillator2.frequency.setValueAtTime(220, context.currentTime); // A3
      oscillator2.frequency.exponentialRampToValueAtTime(
        440,
        context.currentTime + 0.2
      ); // A4
      oscillator2.frequency.exponentialRampToValueAtTime(
        554.37,
        context.currentTime + 0.4
      ); // C#5

      // Add vibrato
      const lfo = context.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 12;

      const lfoGain = context.createGain();
      lfoGain.gain.value = 15;

      lfo.connect(lfoGain);
      lfoGain.connect(oscillator.frequency);

      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(0.25, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        context.currentTime + 0.6
      );

      const gainNode2 = context.createGain();
      gainNode2.gain.setValueAtTime(0.15, context.currentTime);
      gainNode2.gain.exponentialRampToValueAtTime(
        0.01,
        context.currentTime + 0.6
      );

      const delay = context.createDelay(0.5);
      delay.delayTime.value = 0.1;

      const delayGain = context.createGain();
      delayGain.gain.value = 0.15;

      oscillator.connect(gainNode);
      oscillator2.connect(gainNode2);
      gainNode.connect(context.destination);
      gainNode2.connect(context.destination);
      gainNode.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(context.destination);

      oscillator.start();
      oscillator2.start();
      lfo.start();

      oscillator.stop(context.currentTime + 0.6);
      oscillator2.stop(context.currentTime + 0.6);
      lfo.stop(context.currentTime + 0.6);

      console.log("Played celebratory success3 sound effect");
    } catch (e) {
      console.error("Error playing success3 sound effect:", e);
    }
  };

  const playTimeUpSound = () => {
    try {
      const context = getOrCreateAudioContext();
      if (!context) return;

      const oscillator = context.createOscillator();
      oscillator.type = "square";

      const now = context.currentTime;
      oscillator.frequency.setValueAtTime(880, now); // A5
      oscillator.frequency.setValueAtTime(440, now + 0.2); // A4
      oscillator.frequency.setValueAtTime(880, now + 0.4); // A5
      oscillator.frequency.setValueAtTime(440, now + 0.6); // A4

      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(0.2, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        context.currentTime + 0.8
      );

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start();
      oscillator.stop(context.currentTime + 0.8);

      console.log("Played time up sound effect");
    } catch (e) {
      console.error("Error playing time up sound effect:", e);
    }
  };

  return {
    correct: playCelebratoryCorrectSound,
    bonus: playEpicBonusSound,
    success1: playCelebratorySuccess1Sound,
    success2: playCelebratorySuccess2Sound,
    success3: playCelebratorySuccess3Sound,
    timeUp: playTimeUpSound,
  };
};

// Create sound generators once outside component
const soundGenerators = createSoundGenerators();

export default function SoundEffects({ onLoad }: SoundEffectProps) {
  const isInitializedRef = useRef(false);

  // Memoized sound effect function to prevent recreation
  const playSoundEffect = useCallback((type: SoundType) => {
    const generator = soundGenerators[type];
    if (generator) {
      generator();
    } else {
      console.warn(`Unknown sound type: ${type}`);
      soundGenerators.correct(); // Fallback
    }
  }, []);

  // Initialize audio context and expose global function
  useEffect(() => {
    if (isInitializedRef.current) return;

    try {
      if (typeof window !== "undefined") {
        // Initialize audio context
        const context = getOrCreateAudioContext();
        if (context) {
          // Expose the sound effect function globally
          (window as any).playSoundEffect = playSoundEffect;

          isInitializedRef.current = true;
          onLoad?.();
        }
      }
    } catch (e) {
      console.error("Error initializing Web Audio API:", e);
    }

    // Cleanup function
    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).playSoundEffect;
      }
    };
  }, [playSoundEffect, onLoad]);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (globalAudioContext && globalAudioContext.state !== "closed") {
        try {
          globalAudioContext.close();
          globalAudioContext = null;
        } catch (e) {
          console.error("Error closing audio context:", e);
        }
      }
    };
  }, []);

  return null;
}
