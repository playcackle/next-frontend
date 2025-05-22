import React from "react";
import styles from "../gameroom.module.css";
import type { Player, PlayerAction } from "../types";

interface PlayerActionOverlayProps {
  action: PlayerAction;
  player: Player;
  questionPoints: number;
}

const PlayerActionOverlay: React.FC<PlayerActionOverlayProps> = ({
  action,
  player,
  questionPoints,
}) => {
  return (
    <div
      key={`${action.playerId}-${action.questionId}-${action.timestamp}`}
      className={styles.playerActionOverlay}
    >
      <div
        className={styles.playerActionContainer}
        style={{
          background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), ${player.color}`,
          boxShadow: `0 0 20px ${player.color}`,
        }}
      >
        <div
          className={styles.playerActionAvatar}
          style={{ background: player.color }}
        >
          {player.avatar}
        </div>
        <div className={styles.playerActionContent}>
          <div className={styles.playerActionName}>{player.name}</div>
          <div className={styles.playerActionText}>
            Answered correctly! +{questionPoints} points
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PlayerActionOverlay);
