"use client";

import { useEffect, useRef } from "react";

export default function AudioFallback() {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Only run on the client side
    if (typeof window === "undefined") return;

    // Expose a function to play the audio
    // @ts-ignore
    window.playFallbackAudio = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current
          .play()
          .catch((e) => console.error("Fallback audio failed:", e));
      }
    };

    return () => {
      // @ts-ignore
      delete window.playFallbackAudio;
    };
  }, []);

  return (
    <audio
      ref={audioRef}
      src="/correct-answer.mp3"
      preload="auto"
      style={{ display: "none" }}
    />
  );
}
