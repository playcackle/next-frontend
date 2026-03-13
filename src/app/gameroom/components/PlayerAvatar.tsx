import React, { useMemo } from "react";
import { getPlayerAvatar } from "../utils";
import styles from "./PlayerAvatar.module.css";

interface PlayerAvatarProps {
  playerId: string;
  displayName: string;
  size?: "small" | "medium" | "large";
  className?: string;
}

const PlayerAvatar = React.memo(
  ({
    playerId,
    displayName,
    size = "medium",
    className = "",
  }: PlayerAvatarProps) => {
    // Memoize avatar lookup to prevent recalculation on every render
    const avatar = useMemo(
      () => getPlayerAvatar(playerId, displayName),
      [playerId, displayName]
    );

    // Memoize size classes to prevent recreation on every render
    const sizeClasses = useMemo(
      () => ({
        small: styles.avatarSmall,
        medium: styles.avatarMedium,
        large: styles.avatarLarge,
      }),
      []
    );

    if (avatar.type === "image") {
      return (
        <img
          src={avatar.value}
          alt={displayName}
          className={`${styles.playerAvatarImage} ${sizeClasses[size]} ${className}`}
        />
      );
    }

    // Generated avatar with initials
    return (
      <div
        className={`${styles.playerAvatarGenerated} ${sizeClasses[size]} ${className}`}
        style={{ backgroundColor: avatar.color }}
      >
        {avatar.initials}
      </div>
    );
  },
  (prev, next) =>
    prev.playerId === next.playerId &&
    prev.displayName === next.displayName &&
    prev.size === next.size &&
    prev.className === next.className
);

export default PlayerAvatar;
