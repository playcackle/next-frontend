import React from "react";
import styles from "../gameroom.module.css";

interface CountdownOverlayProps {
  show: boolean;
  value: number;
}

const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ show, value }) => {
  if (!show) return null;

  return (
    <div className={styles.countdownOverlay}>
      <div className={styles.countdownContainer}>
        <div className={styles.countdownValue}>{value}</div>
        <div className={styles.countdownText}>SECONDS REMAINING</div>
      </div>
    </div>
  );
};

export default React.memo(CountdownOverlay);
