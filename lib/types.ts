import { Card } from "./cards";

export interface GameOverInfo {
    nHints: number,
    nMistakes: number,
}

export type Opponents = Record<string, { name: string, collected: Card[] }>;

export type MultiplayerAction = {
    type: "triad",
    triad: [number, number, number],
} | {
    type: "gameover",
};