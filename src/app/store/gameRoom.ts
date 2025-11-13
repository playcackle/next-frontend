import { GameroomConnection } from "@/app/models/gameroom";
import { atom } from "jotai";

export const gameRoomAtom = atom<GameroomConnection | null>(null);
