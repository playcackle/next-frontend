import { GameRoom } from "@/app/models/lobby";
import { atom } from "jotai";

export const gameRoomAtom = atom<GameRoom | null>(null);
