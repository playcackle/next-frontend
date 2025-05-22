import React from "react";
import styles from "../gameroom.module.css";

interface HeaderProps {
  name: string;
  roundNumber: number;
}

const RoomHeader: React.FC<HeaderProps> = ({ name, roundNumber }) => {
  return (
    <div className={styles.roomTitle} style={{ color: "--neon-pink" }}>
      <h1>
        <span className={styles.roomName}>{name}</span>
      </h1>
      <div className={styles.roomDifficulty}>Round {roundNumber}</div>
    </div>
  );
};

export default React.memo(RoomHeader);
