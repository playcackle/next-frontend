import React from "react";
import styles from "../gameroom.module.css";

interface HeaderProps {
  roomName: string;
  roundName: string;
  roundNumber: number;
  totalRounds: number;
}

const RoomHeader: React.FC<HeaderProps> = ({
  roundName,
  roomName,
  roundNumber,
  totalRounds,
}) => {
  return (
    <div className={styles.roomTitle} style={{ color: "--neon-pink" }}>
      <h1>
        <span className={styles.roomName}>{roundName}</span>
      </h1>
      <div className={styles.roomDifficulty}>
        {roomName} - Round {roundNumber}/{totalRounds}
      </div>
    </div>
  );
};

export default React.memo(RoomHeader);
