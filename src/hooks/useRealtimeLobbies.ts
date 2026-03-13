"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type LobbyInfo = {
  lobby_id: string;
  collection_name: string;
  status: string;
  player_count: number;
  max_players?: number | null;
  join_base_url?: string | null;
  game_ws_url?: string | null;
  chat_ws_url?: string | null;
  admin_base_url?: string | null;
};

export function useRealtimeLobbies(initialLobbies: LobbyInfo[]) {
  const [lobbies, setLobbies] = useState<LobbyInfo[]>(initialLobbies);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    setLobbies(initialLobbies);
  }, [initialLobbies]);

  useEffect(() => {
    const channel = supabase
      .channel("public:ActiveLobby")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "activelobby",
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.eventType === "INSERT") {
            const newLobby: LobbyInfo = {
              lobby_id: payload.new.lobby_id,
              collection_name: payload.new.collection_name || "Unknown Collection",
              status: payload.new.status,
              player_count: payload.new.player_count,
              max_players: payload.new.max_players,
              join_base_url: payload.new.join_base_url,
              game_ws_url: payload.new.game_ws_url,
              chat_ws_url: payload.new.chat_ws_url,
              admin_base_url: payload.new.admin_base_url,
            };
            setLobbies((prev) => [...prev, newLobby]);
          } else if (payload.eventType === "UPDATE") {
            setLobbies((prev) =>
              prev.map((lobby) =>
                lobby.lobby_id === payload.new.lobby_id
                  ? {
                      ...lobby,
                      status: payload.new.status,
                      player_count: payload.new.player_count,
                      max_players: payload.new.max_players,
                      join_base_url: payload.new.join_base_url,
                      game_ws_url: payload.new.game_ws_url,
                      chat_ws_url: payload.new.chat_ws_url,
                    }
                  : lobby
              )
            );
          } else if (payload.eventType === "DELETE") {
            setLobbies((prev) =>
              prev.filter((lobby) => lobby.lobby_id !== payload.old.lobby_id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return lobbies;
}
