"use client";

import { useCallback, useState } from "react";
import { Player } from "../../models/player";
import type { PlayerAction } from "../types";

export const usePlayers = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerActions, setPlayerActions] = useState<PlayerAction[]>([]);
  const [lastAnsweringPlayer, setLastAnsweringPlayer] = useState<Player | null>(
    null
  );
  const [playerName] = useState<string>("You");

  // Update player score
  const updatePlayerScore = useCallback((playerId: string, points: number) => {
    setPlayers((prev) => {
      const updatedPlayers = [...prev];
      const playerIndex = updatedPlayers.findIndex((p) => p.id === playerId);

      if (playerIndex !== -1) {
        updatedPlayers[playerIndex] = {
          ...updatedPlayers[playerIndex],
          score: updatedPlayers[playerIndex].score + points,
        };
      }

      // Sort by score (descending)
      return [...updatedPlayers].sort((a, b) => b.score - a.score);
    });
  }, []);

  // Add player action
  const addPlayerAction = useCallback(
    (playerId: number, questionId: number) => {
      setPlayerActions((prev) => [
        ...prev,
        {
          playerId,
          questionId,
          timestamp: Date.now(),
          animationComplete: false,
        },
      ]);
    },
    []
  );

  // Mark player action as complete
  const markPlayerActionComplete = useCallback(
    (playerId: number, questionId: number) => {
      setPlayerActions((prev) =>
        prev.map((action) =>
          action.playerId === playerId && action.questionId === questionId
            ? { ...action, animationComplete: true }
            : action
        )
      );
    },
    []
  );

  // Get player by ID
  const getPlayerById = useCallback(
    (id: string) => {
      return players.find((p) => p.id === id);
    },
    [players]
  );

  // Get player by name
  const getPlayerByName = useCallback(
    (name: string) => {
      return players.find((p) => p.name === name);
    },
    [players]
  );

  // Get current player
  const getCurrentPlayer = useCallback(() => {
    return players.find((p) => p.name === "You") || players[5];
  }, [players]);

  // Get other players (not the current player)
  const getOtherPlayers = useCallback(() => {
    return players.filter((p) => p.name !== "You");
  }, [players]);

  return {
    players,
    playerActions,
    lastAnsweringPlayer,
    playerName,
    updatePlayerScore,
    addPlayerAction,
    markPlayerActionComplete,
    getPlayerById,
    getPlayerByName,
    getCurrentPlayer,
    getOtherPlayers,
    setLastAnsweringPlayer,
  };
};
