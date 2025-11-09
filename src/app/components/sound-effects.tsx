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

const getOrCreateAudioContext = async (): Promise<AudioContext | null> => {
  if (typeof window === "undefined") return null;

  try {
    if (!globalAudioContext || globalAudioContext.state === "closed") {
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        globalAudioContext = new AudioContext();
      } else {
        console.error("Web Audio API not supported in this browser");
        return null;
      }
    }

    // Resume the audio context if it's suspended (browser autoplay policy)
    if (globalAudioContext.state === "suspended") {
      try {
        await globalAudioContext.resume();
        console.log("AudioContext resumed successfully");
      } catch (e) {
        console.warn("Could not resume audio context:", e);
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
  const playCelebratoryCorrectSound = async () => {
    try {
      const context = await getOrCreateAudioContext();
      if (!context) return;

      const now = context.currentTime;

      // Generic correct sound - simple D minor arpeggio
      // D4 → A4 → D5 (power fifth interval, very synthwave)
      const osc1 = context.createOscillator();
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(293.66, now); // D4
      osc1.frequency.exponentialRampToValueAtTime(440, now + 0.2); // A4
      osc1.frequency.exponentialRampToValueAtTime(587.33, now + 0.4); // D5

      const osc2 = context.createOscillator();
      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(295.73, now); // D4 +12 cents
      osc2.frequency.exponentialRampToValueAtTime(442.90, now + 0.2); // A4
      osc2.frequency.exponentialRampToValueAtTime(591.11, now + 0.4); // D5

      // Filter
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 5;
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.exponentialRampToValueAtTime(3500, now + 0.4);

      // Gain
      const gain1 = context.createGain();
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      const gain2 = context.createGain();
      gain2.gain.setValueAtTime(0.20, now);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      // Connect
      osc1.connect(gain1);
      osc2.connect(gain2);
      gain1.connect(filter);
      gain2.connect(filter);
      filter.connect(context.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);

      console.log("Played generic correct sound");
    } catch (e) {
      console.error("Error playing sound effect:", e);
    }
  };

  const playEpicBonusSound = async () => {
    try {
      const context = await getOrCreateAudioContext();
      if (!context) return;

      const now = context.currentTime;

      // "Synthwave Glory" - D4 → F4 → A4 → D5 → F5 → A5 (epic double octave climb)
      // Opening gated reverb hit
      const hitOsc = context.createOscillator();
      hitOsc.type = "sawtooth";
      hitOsc.frequency.value = 293.66; // D4

      const hitGain = context.createGain();
      hitGain.gain.setValueAtTime(0.4, now);
      hitGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      hitOsc.connect(hitGain);
      hitGain.connect(context.destination);
      hitOsc.start(now);
      hitOsc.stop(now + 0.08);

      // Main progression - Wide sawtooth pads with chorus
      const lead1 = context.createOscillator();
      lead1.type = "sawtooth";
      lead1.frequency.setValueAtTime(293.66, now + 0.05); // D4
      lead1.frequency.exponentialRampToValueAtTime(349.23, now + 0.2); // F4
      lead1.frequency.exponentialRampToValueAtTime(440, now + 0.4); // A4
      lead1.frequency.exponentialRampToValueAtTime(587.33, now + 0.6); // D5
      lead1.frequency.exponentialRampToValueAtTime(698.46, now + 0.75); // F5
      lead1.frequency.exponentialRampToValueAtTime(880, now + 0.95); // A5

      const lead2 = context.createOscillator();
      lead2.type = "sawtooth";
      lead2.frequency.setValueAtTime(295.73, now + 0.05); // D4 +12 cents
      lead2.frequency.exponentialRampToValueAtTime(351.65, now + 0.2); // F4
      lead2.frequency.exponentialRampToValueAtTime(442.90, now + 0.4); // A4
      lead2.frequency.exponentialRampToValueAtTime(591.11, now + 0.6); // D5
      lead2.frequency.exponentialRampToValueAtTime(703.34, now + 0.75); // F5
      lead2.frequency.exponentialRampToValueAtTime(886.36, now + 0.95); // A5

      // Bright square wave top layer
      const top = context.createOscillator();
      top.type = "square";
      top.frequency.setValueAtTime(587.33, now + 0.05); // D5
      top.frequency.exponentialRampToValueAtTime(698.46, now + 0.2); // F5
      top.frequency.exponentialRampToValueAtTime(880, now + 0.4); // A5
      top.frequency.exponentialRampToValueAtTime(1174.66, now + 0.6); // D6
      top.frequency.exponentialRampToValueAtTime(1396.91, now + 0.75); // F6
      top.frequency.exponentialRampToValueAtTime(1760, now + 0.95); // A6

      // Sub bass pulse on D
      const subBass = context.createOscillator();
      subBass.type = "sine";
      subBass.frequency.value = 146.83; // D3

      // 808-style synth kick simulation
      const kick = context.createOscillator();
      kick.type = "sine";
      kick.frequency.setValueAtTime(150, now + 0.05);
      kick.frequency.exponentialRampToValueAtTime(50, now + 0.15);

      const kickGain = context.createGain();
      kickGain.gain.setValueAtTime(0.5, now + 0.05);
      kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      kick.connect(kickGain);
      kickGain.connect(context.destination);
      kick.start(now + 0.05);
      kick.stop(now + 0.25);

      // Snare with reverb at peak
      const snare = context.createBufferSource();
      const snareBuffer = context.createBuffer(1, context.sampleRate * 0.1, context.sampleRate);
      const snareData = snareBuffer.getChannelData(0);
      for (let i = 0; i < snareBuffer.length; i++) {
        snareData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (snareBuffer.length / 4));
      }
      snare.buffer = snareBuffer;

      const snareGain = context.createGain();
      snareGain.gain.value = 0.3;

      snare.connect(snareGain);
      snareGain.connect(context.destination);
      snare.start(now + 0.95);

      // Low-pass filter sweep (800Hz → 8000Hz)
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 7;
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(8000, now + 0.8);

      // Gain envelopes
      const leadGain1 = context.createGain();
      leadGain1.gain.setValueAtTime(0.30, now + 0.05);
      leadGain1.gain.exponentialRampToValueAtTime(0.01, now + 1.1);

      const leadGain2 = context.createGain();
      leadGain2.gain.setValueAtTime(0.25, now + 0.05);
      leadGain2.gain.exponentialRampToValueAtTime(0.01, now + 1.1);

      const topGain = context.createGain();
      topGain.gain.setValueAtTime(0.20, now + 0.05);
      topGain.gain.exponentialRampToValueAtTime(0.01, now + 1.1);

      const bassGain = context.createGain();
      bassGain.gain.setValueAtTime(0.25, now + 0.05);
      bassGain.gain.exponentialRampToValueAtTime(0.01, now + 1.1);

      // Heavy chorus/ensemble - multiple delays
      const delay1 = context.createDelay(0.5);
      delay1.delayTime.value = 0.02;
      const delay2 = context.createDelay(0.5);
      delay2.delayTime.value = 0.035;
      const delay3 = context.createDelay(1.0);
      delay3.delayTime.value = 0.2;

      const delayGain1 = context.createGain();
      delayGain1.gain.value = 0.15;
      const delayGain2 = context.createGain();
      delayGain2.gain.value = 0.12;
      const reverbGain = context.createGain();
      reverbGain.gain.value = 0.25;

      // Connect everything
      lead1.connect(leadGain1);
      lead2.connect(leadGain2);
      top.connect(topGain);
      subBass.connect(bassGain);

      leadGain1.connect(filter);
      leadGain2.connect(filter);
      topGain.connect(filter);

      filter.connect(context.destination);
      filter.connect(delay1);
      filter.connect(delay2);
      delay1.connect(delayGain1);
      delay2.connect(delayGain2);
      delayGain1.connect(context.destination);
      delayGain2.connect(context.destination);

      filter.connect(delay3);
      delay3.connect(reverbGain);
      reverbGain.connect(context.destination);

      bassGain.connect(context.destination);

      // Start oscillators
      lead1.start(now + 0.05);
      lead2.start(now + 0.05);
      top.start(now + 0.05);
      subBass.start(now + 0.05);

      lead1.stop(now + 1.1);
      lead2.stop(now + 1.1);
      top.stop(now + 1.1);
      subBass.stop(now + 1.1);

      console.log("Played Synthwave Glory (bonus)");
    } catch (e) {
      console.error("Error playing bonus sound effect:", e);
    }
  };

  const playCelebratorySuccess1Sound = async () => {
    try {
      const context = await getOrCreateAudioContext();
      if (!context) return;

      const now = context.currentTime;

      // "Dreamwave Ascent" - D4 → F4 → A4 → D5
      // Main sawtooth oscillator
      const osc1 = context.createOscillator();
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(293.66, now); // D4
      osc1.frequency.exponentialRampToValueAtTime(349.23, now + 0.15); // F4
      osc1.frequency.exponentialRampToValueAtTime(440, now + 0.35); // A4
      osc1.frequency.exponentialRampToValueAtTime(587.33, now + 0.55); // D5

      // Detuned sawtooth for chorus effect (+7 cents)
      const osc2 = context.createOscillator();
      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(295.73, now); // D4 +7 cents
      osc2.frequency.exponentialRampToValueAtTime(351.65, now + 0.15); // F4 +7 cents
      osc2.frequency.exponentialRampToValueAtTime(442.90, now + 0.35); // A4 +7 cents
      osc2.frequency.exponentialRampToValueAtTime(591.11, now + 0.55); // D5 +7 cents

      // Low-pass filter with opening sweep
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 5;
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(4000, now + 0.5);

      // Main gain envelope
      const gain1 = context.createGain();
      gain1.gain.setValueAtTime(0.28, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

      const gain2 = context.createGain();
      gain2.gain.setValueAtTime(0.22, now);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

      // Reverb (using delay as simple reverb)
      const delay = context.createDelay(0.3);
      delay.delayTime.value = 0.08;
      const delayGain = context.createGain();
      delayGain.gain.value = 0.15;

      // Connect: osc → gain → filter → destination + reverb
      osc1.connect(gain1);
      osc2.connect(gain2);
      gain1.connect(filter);
      gain2.connect(filter);
      filter.connect(context.destination);
      filter.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(context.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.7);
      osc2.stop(now + 0.7);

      console.log("Played Dreamwave Ascent (success1)");
    } catch (e) {
      console.error("Error playing success1 sound effect:", e);
    }
  };

  const playCelebratorySuccess2Sound = async () => {
    try {
      const context = await getOrCreateAudioContext();
      if (!context) return;

      const now = context.currentTime;

      // "Neon Pulse" - A4 → G4 → F4 → D4 (descending resolution)
      // Square wave with PWM effect (two detuned square waves)
      const osc1 = context.createOscillator();
      osc1.type = "square";
      osc1.frequency.setValueAtTime(440, now); // A4
      osc1.frequency.exponentialRampToValueAtTime(392, now + 0.15); // G4
      osc1.frequency.exponentialRampToValueAtTime(349.23, now + 0.35); // F4
      osc1.frequency.exponentialRampToValueAtTime(293.66, now + 0.55); // D4

      // Slightly detuned square for PWM effect
      const osc2 = context.createOscillator();
      osc2.type = "square";
      osc2.frequency.setValueAtTime(442.90, now); // A4 +12 cents
      osc2.frequency.exponentialRampToValueAtTime(394.74, now + 0.15); // G4 +12 cents
      osc2.frequency.exponentialRampToValueAtTime(351.65, now + 0.35); // F4 +12 cents
      osc2.frequency.exponentialRampToValueAtTime(295.73, now + 0.55); // D4 +12 cents

      // Sine sub-bass for warmth
      const subBass = context.createOscillator();
      subBass.type = "sine";
      subBass.frequency.setValueAtTime(220, now); // A3
      subBass.frequency.exponentialRampToValueAtTime(196, now + 0.15); // G3
      subBass.frequency.exponentialRampToValueAtTime(174.61, now + 0.35); // F3
      subBass.frequency.exponentialRampToValueAtTime(146.83, now + 0.55); // D3

      // Filter with moderate resonance
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 6;
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(3500, now + 0.4);

      // Gain envelopes - punchier, shorter decay
      const gain1 = context.createGain();
      gain1.gain.setValueAtTime(0.30, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      const gain2 = context.createGain();
      gain2.gain.setValueAtTime(0.25, now);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      const subGain = context.createGain();
      subGain.gain.setValueAtTime(0.22, now);
      subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      // Connect
      osc1.connect(gain1);
      osc2.connect(gain2);
      subBass.connect(subGain);
      gain1.connect(filter);
      gain2.connect(filter);
      filter.connect(context.destination);
      subGain.connect(context.destination);

      osc1.start(now);
      osc2.start(now);
      subBass.start(now);
      osc1.stop(now + 0.65);
      osc2.stop(now + 0.65);
      subBass.stop(now + 0.65);

      console.log("Played Neon Pulse (success2)");
    } catch (e) {
      console.error("Error playing success2 sound effect:", e);
    }
  };

  const playCelebratorySuccess3Sound = async () => {
    try {
      const context = await getOrCreateAudioContext();
      if (!context) return;

      const now = context.currentTime;

      // "Sunset Drive" - F4 → A4 → C5 (suspended, optimistic feel)
      // Sawtooth + triangle blend with heavy chorus
      const osc1 = context.createOscillator();
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(349.23, now); // F4
      osc1.frequency.exponentialRampToValueAtTime(440, now + 0.2); // A4
      osc1.frequency.exponentialRampToValueAtTime(523.25, now + 0.5); // C5

      const osc2 = context.createOscillator();
      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(352.08, now); // F4 +14 cents
      osc2.frequency.exponentialRampToValueAtTime(443.63, now + 0.2); // A4 +14 cents
      osc2.frequency.exponentialRampToValueAtTime(527.18, now + 0.5); // C5 +14 cents

      const osc3 = context.createOscillator();
      osc3.type = "triangle";
      osc3.frequency.setValueAtTime(346.41, now); // F4 -14 cents
      osc3.frequency.exponentialRampToValueAtTime(436.43, now + 0.2); // A4 -14 cents
      osc3.frequency.exponentialRampToValueAtTime(519.37, now + 0.5); // C5 -14 cents

      // Sub bass
      const subBass = context.createOscillator();
      subBass.type = "sine";
      subBass.frequency.setValueAtTime(174.61, now); // F3
      subBass.frequency.exponentialRampToValueAtTime(220, now + 0.2); // A3
      subBass.frequency.exponentialRampToValueAtTime(261.63, now + 0.5); // C4

      // Slow filter sweep for dreamy feel
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 7;
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(3000, now + 0.6);

      // Gain envelopes - mellow and sustained
      const gain1 = context.createGain();
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

      const gain2 = context.createGain();
      gain2.gain.setValueAtTime(0.20, now);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

      const gain3 = context.createGain();
      gain3.gain.setValueAtTime(0.18, now);
      gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

      const subGain = context.createGain();
      subGain.gain.setValueAtTime(0.20, now);
      subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

      // Long reverb for spaciousness
      const delay1 = context.createDelay(0.5);
      delay1.delayTime.value = 0.12;
      const delay2 = context.createDelay(0.5);
      delay2.delayTime.value = 0.19;
      const reverbGain = context.createGain();
      reverbGain.gain.value = 0.20;

      // Connect
      osc1.connect(gain1);
      osc2.connect(gain2);
      osc3.connect(gain3);
      subBass.connect(subGain);

      gain1.connect(filter);
      gain2.connect(filter);
      gain3.connect(filter);

      filter.connect(context.destination);
      filter.connect(delay1);
      delay1.connect(delay2);
      delay2.connect(reverbGain);
      reverbGain.connect(context.destination);

      subGain.connect(context.destination);

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);
      subBass.start(now);
      osc1.stop(now + 0.7);
      osc2.stop(now + 0.7);
      osc3.stop(now + 0.7);
      subBass.stop(now + 0.7);

      console.log("Played Sunset Drive (success3)");
    } catch (e) {
      console.error("Error playing success3 sound effect:", e);
    }
  };

  const playTimeUpSound = async () => {
    try {
      const context = await getOrCreateAudioContext();
      if (!context) return;

      const now = context.currentTime;

      // "Midnight Warning" - A4 ↔ Bb4 alternating (tense half-step)
      // Three quick pulses with decreasing volume
      const osc = context.createOscillator();
      osc.type = "square";

      // Pulse pattern: A4, Bb4, A4, Bb4, A4, Bb4
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.setValueAtTime(466.16, now + 0.12); // Bb4
      osc.frequency.setValueAtTime(440, now + 0.24); // A4
      osc.frequency.setValueAtTime(466.16, now + 0.36); // Bb4
      osc.frequency.setValueAtTime(440, now + 0.48); // A4
      osc.frequency.setValueAtTime(466.16, now + 0.60); // Bb4

      // Low D drone for ominous feel
      const drone = context.createOscillator();
      drone.type = "sine";
      drone.frequency.value = 146.83; // D3

      // Decreasing gain envelope for urgency
      const oscGain = context.createGain();
      oscGain.gain.setValueAtTime(0.35, now);
      oscGain.gain.setValueAtTime(0.30, now + 0.12);
      oscGain.gain.setValueAtTime(0.25, now + 0.24);
      oscGain.gain.setValueAtTime(0.20, now + 0.36);
      oscGain.gain.setValueAtTime(0.15, now + 0.48);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.75);

      const droneGain = context.createGain();
      droneGain.gain.setValueAtTime(0.20, now);
      droneGain.gain.exponentialRampToValueAtTime(0.01, now + 0.75);

      // Slight distortion for aggressive feel
      const distortion = context.createGain();
      distortion.gain.value = 1.2;

      // Connect - dry, immediate sound (no reverb)
      osc.connect(oscGain);
      oscGain.connect(distortion);
      distortion.connect(context.destination);

      drone.connect(droneGain);
      droneGain.connect(context.destination);

      osc.start(now);
      drone.start(now);
      osc.stop(now + 0.75);
      drone.stop(now + 0.75);

      console.log("Played Midnight Warning (timeUp)");
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
  console.log("SoundEffects component mounted");

  // Memoized sound effect function to prevent recreation
  const playSoundEffect = useCallback((type: SoundType) => {
    console.log(`playSoundEffect called with type: ${type}`);
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
    console.log("SoundEffects useEffect running");

    const handleUserInteraction = async () => {
      try {
        const context = await getOrCreateAudioContext();
        if (context && context.state === "running") {
          console.log("AudioContext ready after user interaction");
          // Remove listeners once activated
          document.removeEventListener("click", handleUserInteraction);
          document.removeEventListener("keydown", handleUserInteraction);
        }
      } catch (e) {
        console.error("Error resuming AudioContext on user interaction:", e);
      }
    };

    try {
      if (typeof window !== "undefined") {
        console.log("Exposing playSoundEffect to window");
        // Expose the sound effect function globally
        (window as any).playSoundEffect = playSoundEffect;

        // Add user interaction listeners to resume AudioContext
        document.addEventListener("click", handleUserInteraction);
        document.addEventListener("keydown", handleUserInteraction);

        console.log("SoundEffects initialized, calling onLoad");
        onLoad?.();
      }
    } catch (e) {
      console.error("Error initializing Web Audio API:", e);
    }

    // Cleanup function
    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).playSoundEffect;
        document.removeEventListener("click", handleUserInteraction);
        document.removeEventListener("keydown", handleUserInteraction);
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
