import { buildStore } from "./firestore.builder";
import type { GameDescription } from "../models";

export const gameStore = buildStore<GameDescription>('games');
