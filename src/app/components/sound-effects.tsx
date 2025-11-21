"use client";

import { useCallback, useEffect } from "react";

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

      // "PIXEL PERFECT" - Classic 8-bit coin/collect: G5 → C6 (perfect fourth jump)
      // Instant square wave blip
      const blip1 = context.createOscillator();
      blip1.type = "square";
      blip1.frequency.value = 783.99; // G5
      const blip1Gain = context.createGain();
      blip1Gain.gain.setValueAtTime(0.4, now);
      blip1Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      blip1.connect(blip1Gain);
      blip1Gain.connect(context.destination);
      blip1.start(now);
      blip1.stop(now + 0.08);

      // Second higher blip
      const blip2 = context.createOscillator();
      blip2.type = "square";
      blip2.frequency.value = 1046.5; // C6
      const blip2Gain = context.createGain();
      blip2Gain.gain.setValueAtTime(0.45, now + 0.06);
      blip2Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
      blip2.connect(blip2Gain);
      blip2Gain.connect(context.destination);
      blip2.start(now + 0.06);
      blip2.stop(now + 0.16);

      // Triangle wave for retro warmth
      const tri = context.createOscillator();
      tri.type = "triangle";
      tri.frequency.setValueAtTime(783.99, now);
      tri.frequency.exponentialRampToValueAtTime(1046.5, now + 0.08);
      const triGain = context.createGain();
      triGain.gain.setValueAtTime(0.25, now);
      triGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      tri.connect(triGain);
      triGain.connect(context.destination);
      tri.start(now);
      tri.stop(now + 0.18);

      // Sub bass punch
      const sub = context.createOscillator();
      sub.type = "sine";
      sub.frequency.value = 196.0; // G3
      const subGain = context.createGain();
      subGain.gain.setValueAtTime(0.3, now);
      subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      sub.connect(subGain);
      subGain.connect(context.destination);
      sub.start(now);
      sub.stop(now + 0.12);

      console.log("Played PIXEL PERFECT (correct)");
    } catch (e) {
      console.error("Error playing sound effect:", e);
    }
  };

  const playEpicBonusSound = async () => {
    try {
      const context = await getOrCreateAudioContext();
      if (!context) return;

      const now = context.currentTime;

      // "JACKPOT CASCADE" - Epic arcade bonus like Maelstrom power-ups
      // Explosive start with noise burst
      const noiseBuffer = context.createBuffer(
        1,
        context.sampleRate * 0.04,
        context.sampleRate
      );
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        noiseData[i] =
          (Math.random() * 2 - 1) * Math.exp(-i / (noiseBuffer.length / 2));
      }
      const noise = context.createBufferSource();
      noise.buffer = noiseBuffer;
      const noiseGain = context.createGain();
      noiseGain.gain.value = 0.4;
      noise.connect(noiseGain);
      noiseGain.connect(context.destination);
      noise.start(now);

      // Rapid ascending arpeggio cascade: C5 → E5 → G5 → C6 → E6 → G6 → C7
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0];
      const intervals = [0, 0.07, 0.13, 0.19, 0.25, 0.31, 0.37];

      notes.forEach((freq, i) => {
        // Square wave blips
        const blip = context.createOscillator();
        blip.type = "square";
        blip.frequency.value = freq;
        const blipGain = context.createGain();
        blipGain.gain.setValueAtTime(0.35, now + intervals[i]);
        blipGain.gain.exponentialRampToValueAtTime(
          0.01,
          now + intervals[i] + 0.12
        );
        blip.connect(blipGain);
        blipGain.connect(context.destination);
        blip.start(now + intervals[i]);
        blip.stop(now + intervals[i] + 0.12);

        // Triangle harmonics
        const tri = context.createOscillator();
        tri.type = "triangle";
        tri.frequency.value = freq * 0.5; // Octave down
        const triGain = context.createGain();
        triGain.gain.setValueAtTime(0.2, now + intervals[i]);
        triGain.gain.exponentialRampToValueAtTime(
          0.01,
          now + intervals[i] + 0.12
        );
        tri.connect(triGain);
        triGain.connect(context.destination);
        tri.start(now + intervals[i]);
        tri.stop(now + intervals[i] + 0.12);
      });

      // Pulsing power chord backing (C major)
      const chord1 = context.createOscillator();
      chord1.type = "square";
      chord1.frequency.value = 261.63; // C4
      const chord2 = context.createOscillator();
      chord2.type = "square";
      chord2.frequency.value = 329.63; // E4
      const chord3 = context.createOscillator();
      chord3.type = "square";
      chord3.frequency.value = 392.0; // G4

      const chordGain = context.createGain();
      // Pulsing effect
      chordGain.gain.setValueAtTime(0.25, now + 0.05);
      chordGain.gain.setValueAtTime(0.15, now + 0.12);
      chordGain.gain.setValueAtTime(0.25, now + 0.19);
      chordGain.gain.setValueAtTime(0.15, now + 0.26);
      chordGain.gain.setValueAtTime(0.25, now + 0.33);
      chordGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      chord1.connect(chordGain);
      chord2.connect(chordGain);
      chord3.connect(chordGain);
      chordGain.connect(context.destination);

      chord1.start(now + 0.05);
      chord2.start(now + 0.05);
      chord3.start(now + 0.05);
      chord1.stop(now + 0.6);
      chord2.stop(now + 0.6);
      chord3.stop(now + 0.6);

      // Massive sub bass kick
      const kick = context.createOscillator();
      kick.type = "sine";
      kick.frequency.setValueAtTime(150, now);
      kick.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      const kickGain = context.createGain();
      kickGain.gain.setValueAtTime(0.6, now);
      kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      kick.connect(kickGain);
      kickGain.connect(context.destination);
      kick.start(now);
      kick.stop(now + 0.25);

      // Second kick at climax
      const kick2 = context.createOscillator();
      kick2.type = "sine";
      kick2.frequency.setValueAtTime(150, now + 0.37);
      kick2.frequency.exponentialRampToValueAtTime(40, now + 0.52);
      const kick2Gain = context.createGain();
      kick2Gain.gain.setValueAtTime(0.55, now + 0.37);
      kick2Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      kick2.connect(kick2Gain);
      kick2Gain.connect(context.destination);
      kick2.start(now + 0.37);
      kick2.stop(now + 0.6);

      // Echo delay for depth
      const delay = context.createDelay(0.15);
      delay.delayTime.value = 0.08;
      const delayGain = context.createGain();
      delayGain.gain.value = 0.3;
      chordGain.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(context.destination);

      console.log("Played JACKPOT CASCADE (bonus)");
    } catch (e) {
      console.error("Error playing bonus sound effect:", e);
    }
  };

  const playCelebratorySuccess1Sound = async () => {
    try {
      const context = await getOrCreateAudioContext();
      if (!context) return;

      const now = context.currentTime;

      // "MEGA BLAST" - Explosive arcade hit: E5 → B5 → E6 (power fifth explosion)
      // White noise explosion burst
      const explosionBuffer = context.createBuffer(
        1,
        context.sampleRate * 0.06,
        context.sampleRate
      );
      const explosionData = explosionBuffer.getChannelData(0);
      for (let i = 0; i < explosionBuffer.length; i++) {
        explosionData[i] =
          (Math.random() * 2 - 1) *
          0.5 *
          Math.exp(-i / (explosionBuffer.length / 3));
      }
      const explosion = context.createBufferSource();
      explosion.buffer = explosionBuffer;
      const explosionGain = context.createGain();
      explosionGain.gain.value = 0.35;
      explosion.connect(explosionGain);
      explosionGain.connect(context.destination);
      explosion.start(now);

      // Rapid triple hit pattern (like SF2 perfect/combo)
      const hits = [659.25, 987.77, 1318.51]; // E5, B5, E6
      const timings = [0.02, 0.1, 0.18];

      hits.forEach((freq, i) => {
        // Primary square wave hit
        const hit = context.createOscillator();
        hit.type = "square";
        hit.frequency.value = freq;
        const hitGain = context.createGain();
        hitGain.gain.setValueAtTime(0.45, now + timings[i]);
        hitGain.gain.exponentialRampToValueAtTime(
          0.01,
          now + timings[i] + 0.12
        );
        hit.connect(hitGain);
        hitGain.connect(context.destination);
        hit.start(now + timings[i]);
        hit.stop(now + timings[i] + 0.12);

        // Saw wave for thickness
        const saw = context.createOscillator();
        saw.type = "sawtooth";
        saw.frequency.value = freq * 0.5; // Octave down
        const sawGain = context.createGain();
        sawGain.gain.setValueAtTime(0.25, now + timings[i]);
        sawGain.gain.exponentialRampToValueAtTime(
          0.01,
          now + timings[i] + 0.12
        );
        saw.connect(sawGain);
        sawGain.connect(context.destination);
        saw.start(now + timings[i]);
        saw.stop(now + timings[i] + 0.12);
      });

      // Power chord sustain (E major)
      const power1 = context.createOscillator();
      power1.type = "square";
      power1.frequency.value = 329.63; // E4
      const power2 = context.createOscillator();
      power2.type = "square";
      power2.frequency.value = 493.88; // B4

      const powerGain = context.createGain();
      powerGain.gain.setValueAtTime(0.2, now + 0.02);
      powerGain.gain.setValueAtTime(0.28, now + 0.1);
      powerGain.gain.setValueAtTime(0.32, now + 0.18);
      powerGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      power1.connect(powerGain);
      power2.connect(powerGain);
      powerGain.connect(context.destination);
      power1.start(now + 0.02);
      power2.start(now + 0.02);
      power1.stop(now + 0.4);
      power2.stop(now + 0.4);

      // Sub bass thump
      const sub = context.createOscillator();
      sub.type = "sine";
      sub.frequency.value = 164.81; // E3
      sub.frequency.exponentialRampToValueAtTime(82.41, now + 0.1); // E2
      const subGain = context.createGain();
      subGain.gain.setValueAtTime(0.5, now);
      subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      sub.connect(subGain);
      subGain.connect(context.destination);
      sub.start(now);
      sub.stop(now + 0.25);

      // Echo for arcade depth
      const delay = context.createDelay(0.12);
      delay.delayTime.value = 0.06;
      const delayGain = context.createGain();
      delayGain.gain.value = 0.25;
      powerGain.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(context.destination);

      console.log("Played MEGA BLAST (success1)");
    } catch (e) {
      console.error("Error playing success1 sound effect:", e);
    }
  };

  const playCelebratorySuccess2Sound = async () => {
    try {
      const context = await getOrCreateAudioContext();
      if (!context) return;

      const now = context.currentTime;

      // "POWER UP SURGE" - Fast arpeggiated energy burst: C5 → E5 → G5 → C6
      // Instant attack pulse
      const pulse = context.createOscillator();
      pulse.type = "square";
      pulse.frequency.value = 523.25; // C5
      const pulseGain = context.createGain();
      pulseGain.gain.setValueAtTime(0.45, now);
      pulseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
      pulse.connect(pulseGain);
      pulseGain.connect(context.destination);
      pulse.start(now);
      pulse.stop(now + 0.04);

      // Rapid fire arpeggio with super saws
      const arp1 = context.createOscillator();
      arp1.type = "sawtooth";
      arp1.frequency.setValueAtTime(523.25, now + 0.03); // C5
      arp1.frequency.setValueAtTime(659.25, now + 0.12); // E5
      arp1.frequency.setValueAtTime(783.99, now + 0.21); // G5
      arp1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.38); // C6

      const arp2 = context.createOscillator();
      arp2.type = "sawtooth";
      arp2.frequency.setValueAtTime(527.18, now + 0.03); // C5 +13 cents
      arp2.frequency.setValueAtTime(664.18, now + 0.12); // E5
      arp2.frequency.setValueAtTime(789.66, now + 0.21); // G5
      arp2.frequency.exponentialRampToValueAtTime(1053.98, now + 0.38); // C6

      const arp3 = context.createOscillator();
      arp3.type = "sawtooth";
      arp3.frequency.setValueAtTime(519.37, now + 0.03); // C5 -13 cents
      arp3.frequency.setValueAtTime(654.39, now + 0.12); // E5
      arp3.frequency.setValueAtTime(778.39, now + 0.21); // G5
      arp3.frequency.exponentialRampToValueAtTime(1039.14, now + 0.38); // C6

      // Bright PWM squares on top
      const pwm1 = context.createOscillator();
      pwm1.type = "square";
      pwm1.frequency.setValueAtTime(1046.5, now + 0.03); // C6
      pwm1.frequency.setValueAtTime(1318.51, now + 0.12); // E6
      pwm1.frequency.setValueAtTime(1567.98, now + 0.21); // G6
      pwm1.frequency.exponentialRampToValueAtTime(2093.0, now + 0.38); // C7

      const pwm2 = context.createOscillator();
      pwm2.type = "square";
      pwm2.frequency.setValueAtTime(1053.98, now + 0.03); // C6 +12 cents
      pwm2.frequency.setValueAtTime(1328.89, now + 0.12); // E6
      pwm2.frequency.setValueAtTime(1579.63, now + 0.21); // G6
      pwm2.frequency.exponentialRampToValueAtTime(2108.94, now + 0.38); // C7

      // Massive sub bass following root notes
      const sub = context.createOscillator();
      sub.type = "sine";
      sub.frequency.setValueAtTime(130.81, now + 0.03); // C3
      sub.frequency.setValueAtTime(164.81, now + 0.12); // E3
      sub.frequency.setValueAtTime(196.0, now + 0.21); // G3
      sub.frequency.exponentialRampToValueAtTime(261.63, now + 0.38); // C4

      // Aggressive resonant filter sweep
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 10;
      filter.frequency.setValueAtTime(2000, now);
      filter.frequency.exponentialRampToValueAtTime(8000, now + 0.35);

      // 8-bit coin collect blips at each note
      const blip1 = context.createOscillator();
      blip1.type = "square";
      blip1.frequency.value = 1046.5;
      const blipGain1 = context.createGain();
      blipGain1.gain.setValueAtTime(0.2, now + 0.03);
      blipGain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      blip1.connect(blipGain1);
      blipGain1.connect(context.destination);
      blip1.start(now + 0.03);
      blip1.stop(now + 0.1);

      const blip2 = context.createOscillator();
      blip2.type = "square";
      blip2.frequency.value = 1318.51;
      const blipGain2 = context.createGain();
      blipGain2.gain.setValueAtTime(0.2, now + 0.12);
      blipGain2.gain.exponentialRampToValueAtTime(0.01, now + 0.19);
      blip2.connect(blipGain2);
      blipGain2.connect(context.destination);
      blip2.start(now + 0.12);
      blip2.stop(now + 0.19);

      const blip3 = context.createOscillator();
      blip3.type = "square";
      blip3.frequency.value = 1567.98;
      const blipGain3 = context.createGain();
      blipGain3.gain.setValueAtTime(0.2, now + 0.21);
      blipGain3.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
      blip3.connect(blipGain3);
      blipGain3.connect(context.destination);
      blip3.start(now + 0.21);
      blip3.stop(now + 0.28);

      // Punchy gain envelopes
      const arpGain1 = context.createGain();
      arpGain1.gain.setValueAtTime(0.32, now + 0.03);
      arpGain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      const arpGain2 = context.createGain();
      arpGain2.gain.setValueAtTime(0.28, now + 0.03);
      arpGain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      const arpGain3 = context.createGain();
      arpGain3.gain.setValueAtTime(0.28, now + 0.03);
      arpGain3.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      const pwmGain1 = context.createGain();
      pwmGain1.gain.setValueAtTime(0.25, now + 0.03);
      pwmGain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      const pwmGain2 = context.createGain();
      pwmGain2.gain.setValueAtTime(0.22, now + 0.03);
      pwmGain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      const subGain = context.createGain();
      subGain.gain.setValueAtTime(0.38, now + 0.03);
      subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      // Ping-pong delay for stereo width
      const delay = context.createDelay(0.15);
      delay.delayTime.value = 0.06;
      const delayGain = context.createGain();
      delayGain.gain.value = 0.3;

      // Connect the circuit
      arp1.connect(arpGain1);
      arp2.connect(arpGain2);
      arp3.connect(arpGain3);
      pwm1.connect(pwmGain1);
      pwm2.connect(pwmGain2);
      sub.connect(subGain);

      arpGain1.connect(filter);
      arpGain2.connect(filter);
      arpGain3.connect(filter);
      pwmGain1.connect(filter);
      pwmGain2.connect(filter);

      filter.connect(context.destination);
      filter.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(context.destination);

      subGain.connect(context.destination);

      // Launch!
      arp1.start(now + 0.03);
      arp2.start(now + 0.03);
      arp3.start(now + 0.03);
      pwm1.start(now + 0.03);
      pwm2.start(now + 0.03);
      sub.start(now + 0.03);

      arp1.stop(now + 0.5);
      arp2.stop(now + 0.5);
      arp3.stop(now + 0.5);
      pwm1.stop(now + 0.5);
      pwm2.stop(now + 0.5);
      sub.stop(now + 0.5);

      console.log("Played POWER UP SURGE (success2)");
    } catch (e) {
      console.error("Error playing success2 sound effect:", e);
    }
  };

  const playCelebratorySuccess3Sound = async () => {
    try {
      const context = await getOrCreateAudioContext();
      if (!context) return;

      const now = context.currentTime;

      // "COMBO BLAST" - Explosive multi-hit combo sound: D5 → F5 → A5 → D6 (fast cascade)
      // Initial explosion pulse
      const explosion = context.createOscillator();
      explosion.type = "square";
      explosion.frequency.setValueAtTime(587.33, now); // D5
      const explosionGain = context.createGain();
      explosionGain.gain.setValueAtTime(0.55, now);
      explosionGain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
      explosion.connect(explosionGain);
      explosionGain.connect(context.destination);
      explosion.start(now);
      explosion.stop(now + 0.06);

      // Rapid cascade of notes (like coins multiplying)
      const note1 = context.createOscillator();
      note1.type = "square";
      note1.frequency.value = 587.33; // D5
      const note1Gain = context.createGain();
      note1Gain.gain.setValueAtTime(0.35, now + 0.05);
      note1Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      note1.connect(note1Gain);
      note1Gain.connect(context.destination);
      note1.start(now + 0.05);
      note1.stop(now + 0.15);

      const note2 = context.createOscillator();
      note2.type = "square";
      note2.frequency.value = 698.46; // F5
      const note2Gain = context.createGain();
      note2Gain.gain.setValueAtTime(0.35, now + 0.1);
      note2Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      note2.connect(note2Gain);
      note2Gain.connect(context.destination);
      note2.start(now + 0.1);
      note2.stop(now + 0.2);

      const note3 = context.createOscillator();
      note3.type = "square";
      note3.frequency.value = 880; // A5
      const note3Gain = context.createGain();
      note3Gain.gain.setValueAtTime(0.35, now + 0.15);
      note3Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      note3.connect(note3Gain);
      note3Gain.connect(context.destination);
      note3.start(now + 0.15);
      note3.stop(now + 0.25);

      const note4 = context.createOscillator();
      note4.type = "square";
      note4.frequency.value = 1174.66; // D6
      const note4Gain = context.createGain();
      note4Gain.gain.setValueAtTime(0.4, now + 0.2);
      note4Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      note4.connect(note4Gain);
      note4Gain.connect(context.destination);
      note4.start(now + 0.2);
      note4.stop(now + 0.35);

      // Power chord backing (super saws)
      const backing1 = context.createOscillator();
      backing1.type = "sawtooth";
      backing1.frequency.setValueAtTime(293.66, now + 0.03); // D4
      backing1.frequency.exponentialRampToValueAtTime(587.33, now + 0.25); // D5

      const backing2 = context.createOscillator();
      backing2.type = "sawtooth";
      backing2.frequency.setValueAtTime(296.21, now + 0.03); // D4 +15 cents
      backing2.frequency.exponentialRampToValueAtTime(591.11, now + 0.25); // D5

      const backing3 = context.createOscillator();
      backing3.type = "sawtooth";
      backing3.frequency.setValueAtTime(291.14, now + 0.03); // D4 -15 cents
      backing3.frequency.exponentialRampToValueAtTime(583.58, now + 0.25); // D5

      // Huge sub bass thump
      const sub = context.createOscillator();
      sub.type = "sine";
      sub.frequency.value = 146.83; // D3
      const subGain = context.createGain();
      subGain.gain.setValueAtTime(0.45, now);
      subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      sub.connect(subGain);
      subGain.connect(context.destination);
      sub.start(now);
      sub.stop(now + 0.4);

      // Aggressive filter for punch
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 12;
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.exponentialRampToValueAtTime(7000, now + 0.3);

      // Backing gain envelopes
      const backGain1 = context.createGain();
      backGain1.gain.setValueAtTime(0.28, now + 0.03);
      backGain1.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      const backGain2 = context.createGain();
      backGain2.gain.setValueAtTime(0.24, now + 0.03);
      backGain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      const backGain3 = context.createGain();
      backGain3.gain.setValueAtTime(0.24, now + 0.03);
      backGain3.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      // Echo/delay for arcade depth
      const delay = context.createDelay(0.2);
      delay.delayTime.value = 0.05;
      const delayGain = context.createGain();
      delayGain.gain.value = 0.35;

      // Connect backing
      backing1.connect(backGain1);
      backing2.connect(backGain2);
      backing3.connect(backGain3);

      backGain1.connect(filter);
      backGain2.connect(filter);
      backGain3.connect(filter);

      filter.connect(context.destination);
      filter.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(context.destination);

      // Fire!
      backing1.start(now + 0.03);
      backing2.start(now + 0.03);
      backing3.start(now + 0.03);

      backing1.stop(now + 0.45);
      backing2.stop(now + 0.45);
      backing3.stop(now + 0.45);

      console.log("Played COMBO BLAST (success3)");
    } catch (e) {
      console.error("Error playing success3 sound effect:", e);
    }
  };

  const playTimeUpSound = async () => {
    try {
      const context = await getOrCreateAudioContext();
      if (!context) return;

      const now = context.currentTime;

      // "FINAL COUNTDOWN" - Urgent arcade alarm: descending siren with pulsing bass
      // Rapid alarm pulses (like classic arcade warnings)
      for (let i = 0; i < 3; i++) {
        const offset = i * 0.15;

        // High alarm beep
        const beep = context.createOscillator();
        beep.type = "square";
        beep.frequency.setValueAtTime(880, now + offset); // A5
        beep.frequency.exponentialRampToValueAtTime(
          659.25,
          now + offset + 0.12
        ); // E5 (descend)

        const beepGain = context.createGain();
        beepGain.gain.setValueAtTime(0.4 - i * 0.08, now + offset);
        beepGain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.12);

        beep.connect(beepGain);
        beepGain.connect(context.destination);
        beep.start(now + offset);
        beep.stop(now + offset + 0.12);

        // Low warning tone
        const warning = context.createOscillator();
        warning.type = "sawtooth";
        warning.frequency.value = 220; // A3

        const warningGain = context.createGain();
        warningGain.gain.setValueAtTime(0.35 - i * 0.06, now + offset);
        warningGain.gain.exponentialRampToValueAtTime(
          0.01,
          now + offset + 0.12
        );

        warning.connect(warningGain);
        warningGain.connect(context.destination);
        warning.start(now + offset);
        warning.stop(now + offset + 0.12);
      }

      // Pulsing sub bass for urgency
      const pulse = context.createOscillator();
      pulse.type = "sine";
      pulse.frequency.value = 110; // A2

      const pulseGain = context.createGain();
      // Create pulsing effect
      pulseGain.gain.setValueAtTime(0.4, now);
      pulseGain.gain.setValueAtTime(0.1, now + 0.075);
      pulseGain.gain.setValueAtTime(0.4, now + 0.15);
      pulseGain.gain.setValueAtTime(0.1, now + 0.225);
      pulseGain.gain.setValueAtTime(0.4, now + 0.3);
      pulseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      pulse.connect(pulseGain);
      pulseGain.connect(context.destination);
      pulse.start(now);
      pulse.stop(now + 0.5);

      // Noise burst for impact
      const noiseBuffer = context.createBuffer(
        1,
        context.sampleRate * 0.05,
        context.sampleRate
      );
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * 0.3;
      }

      const noise = context.createBufferSource();
      noise.buffer = noiseBuffer;

      const noiseGain = context.createGain();
      noiseGain.gain.setValueAtTime(0.25, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

      noise.connect(noiseGain);
      noiseGain.connect(context.destination);
      noise.start(now);

      console.log("Played FINAL COUNTDOWN (timeUp)");
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

let hasInitialized = false;

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
  }, []); // Empty deps array - function never needs to change

  // Memoized onLoad handler to stabilize it
  const handleLoad = useCallback(() => {
    if (onLoad) {
      onLoad();
    }
  }, [onLoad]);

  useEffect(() => {
    if (hasInitialized) {
      return;
    }
    hasInitialized = true;

    const resumeAudio = async () => {
      try {
        await getOrCreateAudioContext();
      } catch (e) {
        console.error("Error initializing audio:", e);
      }
    };

    const handleUserInteraction = () => {
      resumeAudio();
      handleLoad();
    };

    // Resume audio context on user interaction
    document.addEventListener("click", handleUserInteraction, { once: true });
    document.addEventListener("keydown", handleUserInteraction, { once: true });
    document.addEventListener("touchstart", handleUserInteraction, {
      once: true,
    });

    return () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
    };
  }, [handleLoad]); // Keep handleLoad in deps to maintain consistent array size

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
