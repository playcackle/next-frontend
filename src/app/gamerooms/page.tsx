import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GameroomsClient from "./gamerooms-client";

type LobbyInfo = {
  lobby_id: string;
  collection_name: string;
  status: string;
  player_count: number;
  join_base_url?: string | null;
  game_ws_url?: string | null;
  chat_ws_url?: string | null;
};

export default async function GameroomsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const gamerooms = await fetchGamerooms();

  return <GameroomsClient gamerooms={gamerooms} />;
}

async function fetchGamerooms(): Promise<LobbyInfo[]> {
  try {
    const baseUrl =
      process.env.BACKEND_URL || process.env.NEXT_PUBLIC_LOBBY_MANAGER_URL;
    if (!baseUrl) throw new Error("Lobby Manager URL is not configured.");

    const response = await fetch(`${baseUrl}/lobbies`, {
      next: { revalidate: 30 },
    });
    if (!response.ok) throw new Error(`Error fetching lobbies: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error("Failed to fetch lobbies:", error);
    return [];
  }
}
