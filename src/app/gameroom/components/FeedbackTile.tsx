import React from "react";
import styles from "../gameroom.module.css";
import { formatTime } from "../utils";

interface FeedbackTileProps {
  feedback: string;
  isIntermission: boolean;
  intermissionTimeRemaining: number;
  roundNumber: number;
}

const FeedbackTile: React.FC<FeedbackTileProps> = ({
  feedback,
  isIntermission,
  intermissionTimeRemaining,
  roundNumber,
}) => {
  return (
    <div className={styles.feedbackTile}>
      <div className={styles.feedbackContent}>
        {isIntermission ? (
          <>
            <div className={styles.intermissionText}>
              Intermission: Next round starts in{" "}
              {formatTime(intermissionTimeRemaining)}
            </div>
            <div className={styles.roundInfo}>
              Round {roundNumber} completed • Round {roundNumber + 1} coming up
            </div>
          </>
        ) : (
          feedback
        )}
      </div>
    </div>
  );
};

export default React.memo(FeedbackTile);
