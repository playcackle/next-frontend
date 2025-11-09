"use client";

import React, { useRef, useState, useEffect } from "react";
import { Volume2, VolumeX, Volume1, Play, Pause } from "lucide-react"; // Icons for volume
import styles from "./background-music.module.css"; // We'll create this CSS module

interface BackgroundMusicProps {
  src: string;
}

const BackgroundMusic: React.FC<BackgroundMusicProps> = ({ src }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5); // Default volume
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
      audio.muted = isMuted;

      // Attempt to autoplay, but acknowledge browser restrictions
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.warn("Autoplay prevented:", error);
            // Autoplay was prevented, so set isPlaying to false
            setIsPlaying(false);
            // Optionally, show a play button to the user
          });
      }
    }
  }, [volume, isMuted]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      if (newVolume > 0 && isMuted) {
        setIsMuted(false); // Unmute if volume is increased from 0 while muted
      } else if (newVolume === 0 && !isMuted) {
        setIsMuted(true); // Mute if volume is set to 0
      }
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !isMuted;
      setIsMuted(!isMuted);
      // If unmuting, restore previous volume if it was 0 due to mute
      if (!isMuted && volume === 0) {
        setVolume(0.5); // Restore to a default non-zero volume
        audio.volume = 0.5;
      }
    }
  };

  const VolumeIcon = isMuted
    ? VolumeX
    : volume === 0
    ? VolumeX
    : volume < 0.5
    ? Volume1
    : Volume2;

  return (
    <div className={styles.musicControls}>
      <audio ref={audioRef} src={src} loop />

      <button onClick={togglePlayPause} className={styles.playPauseButton}>
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>

      <div className={styles.volumeControl}>
        <button onClick={toggleMute} className={styles.volumeButton}>
          <VolumeIcon size={20} />
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className={styles.volumeSlider}
        />
      </div>
    </div>
  );
};

export default BackgroundMusic;
