import React from "react";
import styles from "./RoomHeader.module.css";

interface HeaderProps {
  roomName: string;
}

const RoomHeader: React.FC<HeaderProps> = ({ roomName }) => {
  return (
    <div className={styles.roomTitle} style={{ color: "--neon-pink" }}>
      <h1>
        <span className={styles.roomName}>{roomName}</span>
      </h1>
    </div>
  );
};

export default React.memo(RoomHeader);
