"use client";

import { useCallback, useEffect } from "react";

type SoundEffectProps = {
  onLoad?: () => void;
};

export type SoundType =
  | "correct"
  | "bonus"
  | "success1"
  | "success2"
  | "success3"
  | "timeUp"
  | "newRound"
  | "playerSnap";

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

const scheduleCleanup = (
  context: AudioContext,
  nodes: AudioNode[],
  duration: number
) => {
  setTimeout(() => {
    nodes.forEach((node) => {
      try {
        node.disconnect();
      } catch (e) {
        // Node may already be disconnected
      }
    });
  }, duration * 1000 + 100); // Add 100ms buffer
};

// Sound generation functions
const createSoundGenerators = () => {
  const playCelebratoryCorrectSound = async () => {
    try {
      const context = await getOrCreateAudioContext();
      if (!context) return;

      const now = context.currentTime;
      const duration = 0.2; // Define max duration

      const blip1 = context.createOscillator();
      blip1.type = "square";
      blip1.frequency.value = 783.99;
      const blip1Gain = context.createGain();
      blip1Gain.gain.setValueAtTime(0.4, now);
      blip1Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      blip1.connect(blip1Gain);
      blip1Gain.connect(context.destination);
      blip1.start(now);
      blip1.stop(now + 0.08);

      const blip2 = context.createOscillator();
      blip2.type = "square";
      blip2.frequency.value = 1046.5;
      const blip2Gain = context.createGain();
      blip2Gain.gain.setValueAtTime(0.45, now + 0.06);
      blip2Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
      blip2.connect(blip2Gain);
      blip2Gain.connect(context.destination);
      blip2.start(now + 0.06);
      blip2.stop(now + 0.16);

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

      const sub = context.createOscillator();
      sub.type = "sine";
      sub.frequency.value = 196.0;
      const subGain = context.createGain();
      subGain.gain.setValueAtTime(0.3, now);
      subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      sub.connect(subGain);
      subGain.connect(context.destination);
      sub.start(now);
      sub.stop(now + 0.12);

      scheduleCleanup(
        context,
        [blip1Gain, blip2Gain, triGain, subGain],
        duration
      );
    } catch (e) {
      console.error("Error playing sound effect:", e);
    }
  };

  const playEpicBonusSound = async () => {
    try {
      const context = await getOrCreateAudioContext();
      if (!context) return;

      const now = context.currentTime;
      const duration = 0.7; // Define max duration

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

      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0];
      const intervals = [0, 0.07, 0.13, 0.19, 0.25, 0.31, 0.37];
      const allNodes: AudioNode[] = [noiseGain];

      notes.forEach((freq, i) => {
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
        allNodes.push(blipGain);

        const tri = context.createOscillator();
        tri.type = "triangle";
        tri.frequency.value = freq * 0.5;
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
        allNodes.push(triGain);
      });

      const chord1 = context.createOscillator();
      chord1.type = "square";
      chord1.frequency.value = 261.63;
      const chord2 = context.createOscillator();
      chord2.type = "square";
      chord2.frequency.value = 329.63;
      const chord3 = context.createOscillator();
      chord3.type = "square";
      chord3.frequency.value = 392.0;

      const chordGain = context.createGain();
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

      allNodes.push(chordGain, kickGain, kick2Gain);
      scheduleCleanup(context, allNodes, duration);
    } catch (e) {
      console.error("Error playing bonus sound effect:", e);
    }
  };

  const playCelebratorySuccess1Sound = async () => {
    try {
      const context = await getOrCreateAudioContext();
      if (!context) return;

      const now = context.currentTime;
      const duration = 0.5; // Define max duration

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

      const hits = [659.25, 987.77, 1318.51];
      const timings = [0.02, 0.1, 0.18];
      const allNodes: AudioNode[] = [explosionGain];

      hits.forEach((freq, i) => {
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
        allNodes.push(hitGain);

        const saw = context.createOscillator();
        saw.type = "sawtooth";
        saw.frequency.value = freq * 0.5;
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
        allNodes.push(sawGain);
      });

      const power1 = context.createOscillator();
      power1.type = "square";
      power1.frequency.value = 329.63;
      const power2 = context.createOscillator();
      power2.type = "square";
      power2.frequency.value = 493.88;

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

      const sub = context.createOscillator();
      sub.type = "sine";
      sub.frequency.value = 164.81;
      sub.frequency.exponentialRampToValueAtTime(82.41, now + 0.1);
      const subGain = context.createGain();
      subGain.gain.setValueAtTime(0.5, now);
      subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      sub.connect(subGain);
      subGain.connect(context.destination);
      sub.start(now);
      sub.stop(now + 0.25);

      allNodes.push(powerGain, subGain);
      scheduleCleanup(context, allNodes, duration);
    } catch (e) {
      console.error("Error playing success1 sound effect:", e);
    }
  };

  const playCelebratorySuccess2Sound = async () => {
    try {
      const context = await getOrCreateAudioContext();
      if (!context) return;

      const now = context.currentTime;
      const duration = 0.6; // Define max duration

      const pulse = context.createOscillator();
      pulse.type = "square";
      pulse.frequency.value = 523.25;
      const pulseGain = context.createGain();
      pulseGain.gain.setValueAtTime(0.45, now);
      pulseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
      pulse.connect(pulseGain);
      pulseGain.connect(context.destination);
      pulse.start(now);
      pulse.stop(now + 0.04);

      const arp1 = context.createOscillator();
      arp1.type = "sawtooth";
      arp1.frequency.setValueAtTime(523.25, now + 0.03);
      arp1.frequency.setValueAtTime(659.25, now + 0.12);
      arp1.frequency.setValueAtTime(783.99, now + 0.21);
      arp1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.38);

      const arp2 = context.createOscillator();
      arp2.type = "sawtooth";
      arp2.frequency.setValueAtTime(527.18, now + 0.03);
      arp2.frequency.setValueAtTime(664.18, now + 0.12);
      arp2.frequency.setValueAtTime(789.66, now + 0.21);
      arp2.frequency.exponentialRampToValueAtTime(1053.98, now + 0.38);

      const arp3 = context.createOscillator();
      arp3.type = "sawtooth";
      arp3.frequency.setValueAtTime(519.37, now + 0.03);
      arp3.frequency.setValueAtTime(654.39, now + 0.12);
      arp3.frequency.setValueAtTime(778.39, now + 0.21);
      arp3.frequency.exponentialRampToValueAtTime(1039.14, now + 0.38);

      const sub = context.createOscillator();
      sub.type = "sine";
      sub.frequency.setValueAtTime(130.81, now + 0.03);
      sub.frequency.setValueAtTime(164.81, now + 0.12);
      sub.frequency.setValueAtTime(196.0, now + 0.21);
      sub.frequency.exponentialRampToValueAtTime(261.63, now + 0.38);

      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 10;
      filter.frequency.setValueAtTime(2000, now);
      filter.frequency.exponentialRampToValueAtTime(8000, now + 0.35);

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

      const arpGain1 = context.createGain();
      arpGain1.gain.setValueAtTime(0.32, now + 0.03);
      arpGain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      const arpGain2 = context.createGain();
      arpGain2.gain.setValueAtTime(0.28, now + 0.03);
      arpGain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      const arpGain3 = context.createGain();
      arpGain3.gain.setValueAtTime(0.28, now + 0.03);
      arpGain3.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      const subGain = context.createGain();
      subGain.gain.setValueAtTime(0.38, now + 0.03);
      subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      arp1.connect(arpGain1);
      arp2.connect(arpGain2);
      arp3.connect(arpGain3);
      sub.connect(subGain);

      arpGain1.connect(filter);
      arpGain2.connect(filter);
      arpGain3.connect(filter);

      filter.connect(context.destination);
      subGain.connect(context.destination);

      arp1.start(now + 0.03);
      arp2.start(now + 0.03);
      arp3.start(now + 0.03);
      sub.start(now + 0.03);

      arp1.stop(now + 0.5);
      arp2.stop(now + 0.5);
      arp3.stop(now + 0.5);
      sub.stop(now + 0.5);

      const allNodes: AudioNode[] = [
        pulseGain,
        arpGain1,
        arpGain2,
        arpGain3,
        subGain,
        blipGain1,
        blipGain2,
        blipGain3,
        filter,
      ];
      scheduleCleanup(context, allNodes, duration);
    } catch (e) {
      console.error("Error playing success2 sound effect:", e);
    }
  };

  const playCelebratorySuccess3Sound = async () => {
    try {
      const context = await getOrCreateAudioContext();
      if (!context) return;

      const now = context.currentTime;
      const duration = 0.5; // Define max duration

      const explosion = context.createOscillator();
      explosion.type = "square";
      explosion.frequency.setValueAtTime(587.33, now);
      const explosionGain = context.createGain();
      explosionGain.gain.setValueAtTime(0.55, now);
      explosionGain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
      explosion.connect(explosionGain);
      explosionGain.connect(context.destination);
      explosion.start(now);
      explosion.stop(now + 0.06);

      const note1 = context.createOscillator();
      note1.type = "square";
      note1.frequency.value = 587.33;
      const note1Gain = context.createGain();
      note1Gain.gain.setValueAtTime(0.35, now + 0.05);
      note1Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      note1.connect(note1Gain);
      note1Gain.connect(context.destination);
      note1.start(now + 0.05);
      note1.stop(now + 0.15);

      const note2 = context.createOscillator();
      note2.type = "square";
      note2.frequency.value = 698.46;
      const note2Gain = context.createGain();
      note2Gain.gain.setValueAtTime(0.35, now + 0.1);
      note2Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      note2.connect(note2Gain);
      note2Gain.connect(context.destination);
      note2.start(now + 0.1);
      note2.stop(now + 0.2);

      const note3 = context.createOscillator();
      note3.type = "square";
      note3.frequency.value = 880;
      const note3Gain = context.createGain();
      note3Gain.gain.setValueAtTime(0.35, now + 0.15);
      note3Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      note3.connect(note3Gain);
      note3Gain.connect(context.destination);
      note3.start(now + 0.15);
      note3.stop(now + 0.25);

      const note4 = context.createOscillator();
      note4.type = "square";
      note4.frequency.value = 1174.66;
      const note4Gain = context.createGain();
      note4Gain.gain.setValueAtTime(0.4, now + 0.2);
      note4Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      note4.connect(note4Gain);
      note4Gain.connect(context.destination);
      note4.start(now + 0.2);
      note4.stop(now + 0.35);

      const sub = context.createOscillator();
      sub.type = "sine";
      sub.frequency.value = 146.83;
      const subGain = context.createGain();
      subGain.gain.setValueAtTime(0.45, now);
      subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      sub.connect(subGain);
      subGain.connect(context.destination);
      sub.start(now);
      sub.stop(now + 0.4);

      // Simplified to just the core notes
      const allNodes: AudioNode[] = [
        explosionGain,
        note1Gain,
        note2Gain,
        note3Gain,
        note4Gain,
        subGain,
      ];
      scheduleCleanup(context, allNodes, duration);
    } catch (e) {
      console.error("Error playing success3 sound effect:", e);
    }
  };

  const playTimeUpSound = async () => {
    try {
      const context = await getOrCreateAudioContext();
      if (!context) return;

      const now = context.currentTime;
      const duration = 0.5;

      const oscillator = context.createOscillator();
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(880, now);
      oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.5);
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.5);

      scheduleCleanup(context, [gain], duration);
    } catch (e) {
      console.error("Error playing time up sound effect:", e);
    }
  };

  const playNewRoundSound = async () => {
    try {
      const context = await getOrCreateAudioContext();
      if (!context) return;

      const now = context.currentTime;
      const duration = 0.6;

      const blip1 = context.createOscillator();
      blip1.type = "square";
      blip1.frequency.value = 523.25; // C5
      const blip1Gain = context.createGain();
      blip1Gain.gain.setValueAtTime(0.35, now);
      blip1Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      blip1.connect(blip1Gain);
      blip1Gain.connect(context.destination);
      blip1.start(now);
      blip1.stop(now + 0.1);

      const blip2 = context.createOscillator();
      blip2.type = "square";
      blip2.frequency.value = 659.25; // E5
      const blip2Gain = context.createGain();
      blip2Gain.gain.setValueAtTime(0.35, now + 0.15);
      blip2Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      blip2.connect(blip2Gain);
      blip2Gain.connect(context.destination);
      blip2.start(now + 0.15);
      blip2.stop(now + 0.25);

      const blip3 = context.createOscillator();
      blip3.type = "square";
      blip3.frequency.value = 783.99; // G5
      const blip3Gain = context.createGain();
      blip3Gain.gain.setValueAtTime(0.4, now + 0.3);
      blip3Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      blip3.connect(blip3Gain);
      blip3Gain.connect(context.destination);
      blip3.start(now + 0.3);
      blip3.stop(now + 0.5);

      scheduleCleanup(context, [blip1Gain, blip2Gain, blip3Gain], duration);
    } catch (e) {
      console.error("Error playing new round sound effect:", e);
    }
  };

  const playPlayerSnapSound = async () => {
    try {
      const context = await getOrCreateAudioContext();
      if (!context) return;

      const now = context.currentTime;
      const duration = 0.15;

      const osc = context.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.05);
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start(now);
      osc.stop(now + 0.1);

      scheduleCleanup(context, [gain], duration);
    } catch (e) {
      console.error("Error playing player snap sound effect:", e);
    }
  };

  return {
    playCelebratoryCorrectSound,
    playEpicBonusSound,
    playCelebratorySuccess1Sound,
    playCelebratorySuccess2Sound,
    playCelebratorySuccess3Sound,
    playTimeUpSound,
    playNewRoundSound,
    playPlayerSnapSound,
  };
};

const SoundEffects = ({ onLoad }: SoundEffectProps) => {
  const soundGenerators = createSoundGenerators();

  const playSound = useCallback(
    async (soundType: SoundType) => {
      switch (soundType) {
        case "correct":
          await soundGenerators.playCelebratoryCorrectSound();
          break;
        case "bonus":
          await soundGenerators.playEpicBonusSound();
          break;
        case "success1":
          await soundGenerators.playCelebratorySuccess1Sound();
          break;
        case "success2":
          await soundGenerators.playCelebratorySuccess2Sound();
          break;
        case "success3":
          await soundGenerators.playCelebratorySuccess3Sound();
          break;
        case "timeUp":
          await soundGenerators.playTimeUpSound();
          break;
        case "newRound":
          await soundGenerators.playNewRoundSound();
          break;
        case "playerSnap":
          await soundGenerators.playPlayerSnapSound();
          break;
        default:
          console.error("Unknown sound type:", soundType);
      }
    },
    [soundGenerators]
  );

  useEffect(() => {
    (window as any).playSoundEffect = playSound;

    return () => {
      delete (window as any).playSoundEffect;
    };
  }, [playSound]);

  useEffect(() => {
    if (onLoad) {
      onLoad();
    }
  }, [onLoad]);

  return null;
};

export default SoundEffects;
