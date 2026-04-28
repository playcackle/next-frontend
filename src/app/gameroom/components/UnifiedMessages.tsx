"use client";

import { Flex } from "@radix-ui/themes";
import { useAtomValue } from "jotai";
import {
  BotIcon,
  Crosshair,
  Sparkles,
  Swords,
  Trophy,
  Zap,
  Sword,
  Target,
  Flame,
  TrendingUp,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef } from "react";
import {
  currentUserIdAtom,
  isRoundBreakAtom,
  unifiedMessagesAtom,
  type UnifiedMessage,
} from "../store/gameAtoms";
import styles from "./UnifiedMessages.module.css";

const HOST_ICONS: Record<string, LucideIcon> = {
  welcome: Sparkles,
  round_start: BotIcon,
  round_end: Trophy,
  near_miss: Crosshair,
  snipe: Swords,
  save: Sparkles,
  // Intermission accolades
  accolade_announcement: Trophy,
  accolade_speed: Zap,
  accolade_first: Sword,
  accolade_accuracy: Target,
  accolade_volume: Flame,
  accolade_streak: TrendingUp,
  accolade_clutch: Clock,
  // Game-end
  game_end_announcement: Trophy,
  game_end_speed: Zap,
  game_end_first: Sword,
  game_end_volume: Flame,
  game_end_streak: TrendingUp,
  game_end_accuracy: Target,
  game_end_clutch: Clock,
  game_end: BotIcon,
};

const HOST_ICON_COLORS: Record<string, string> = {
  welcome: "var(--neon-blue)",
  round_start: "var(--neon-blue)",
  round_end: "var(--neon-pink)",
  near_miss: "#ff6b00",
  snipe: "rgba(183, 0, 255, 0.5)",
  save: "var(--neon-blue)",
  // Intermission accolades
  accolade_announcement: "#ffd700",
  accolade_speed: "#ff6b00",
  accolade_first: "#8b0000",
  accolade_accuracy: "#00ff00",
  accolade_volume: "#ff4500",
  accolade_streak: "#ff1493",
  accolade_clutch: "#1e90ff",
  // Game-end
  game_end_announcement: "#ffd700",
  game_end_speed: "#ff6b00",
  game_end_first: "#8b0000",
  game_end_volume: "#ff4500",
  game_end_streak: "#ff1493",
  game_end_accuracy: "#00ff00",
  game_end_clutch: "#1e90ff",
  game_end: "var(--neon-pink)",
};

export default function UnifiedMessages() {
  const currentUserId = useAtomValue(currentUserIdAtom);
  const isRoundBreak = useAtomValue(isRoundBreakAtom);
  const messages = useAtomValue(unifiedMessagesAtom);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return timestamp;
    }
  };

  const getMessageTypeClass = (msg: UnifiedMessage): string => {
    if (msg.message_type === "host") {
      return styles.hostMessage;
    }
    if (
      msg.player_id === "botbob" ||
      msg.display_name.toLowerCase() === "botbob"
    ) {
      return styles.botBobMessage;
    }
    switch (msg.message_type) {
      case "successful_answer":
        return styles.successfulAnswerMessage;
      case "failed_answer":
        if (
          msg.submission_result === "already_snapped" ||
          msg.submission_result === "too_slow"
        )
          return styles.takenMessage;
        return styles.chatMessage;
      default:
        return styles.chatMessage;
    }
  };

  const getHostSubtypeClass = (subtype: string | undefined): string => {
    if (!subtype) return "";
    const camelCase = subtype.replace(/_([a-z])/g, (_, letter) =>
      letter.toUpperCase(),
    );
    const className = `host${camelCase.charAt(0).toUpperCase() + camelCase.slice(1)}Message`;
    return styles[className] || "";
  };

  const getHostIcon = (subtype: string | undefined): LucideIcon | null => {
    if (!subtype) return null;
    return HOST_ICONS[subtype] || null;
  };

  return (
    <div className={styles.unifiedMessagesContainer}>
      <div className={styles.messagesScrollArea}>
        {messages.length === 0 ? (
          <div className={styles.messagesEmpty}>
            {isRoundBreak
              ? "Chaos is pausing, for now..."
              : "Chaos will commence here..."}
          </div>
        ) : (
          messages.map((msg, index) => {
            const isHostMessage = msg.message_type === "host";
            const HostIconComponent = isHostMessage
              ? getHostIcon(msg.host_subtype)
              : null;
            const hostIconColor = isHostMessage
              ? HOST_ICON_COLORS[msg.host_subtype || ""]
              : undefined;

            return (
              <div
                key={index}
                className={`${styles.unifiedMessage} ${getMessageTypeClass(msg)} ${getHostSubtypeClass(
                  msg.host_subtype,
                )} ${
                  msg.player_id === currentUserId
                    ? msg.message_type === "successful_answer"
                      ? styles.ownSuccessfulAnswerMessage
                      : msg.message_type === "chat"
                        ? styles.ownMessage
                        : ""
                    : ""
                }`}
              >
                <Flex direction="row" gap="2" align="center">
                  {isHostMessage && HostIconComponent && (
                    <HostIconComponent
                      size={18}
                      style={{
                        color: hostIconColor,
                        flexShrink: 0,
                        marginLeft: "0.5rem",
                      }}
                    />
                  )}
                  <div className={styles.messageContentWrapper}>
                    <Flex direction="row" gap="2" align="center">
                      <span className={styles.messageUser}>
                        {msg.display_name}
                      </span>
                      <span className={styles.messageTime}>
                        {formatTimestamp(msg.timestamp)}
                      </span>
                    </Flex>
                    <div className={styles.messageContent}>
                      {msg.text}
                      {msg.canonical_text &&
                        msg.canonical_text.toLowerCase() !==
                          msg.text.toLowerCase() && (
                          <span className={styles.canonicalAnswer}>
                            {" "}
                            → "{msg.canonical_text}"
                          </span>
                        )}
                    </div>
                  </div>
                </Flex>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
