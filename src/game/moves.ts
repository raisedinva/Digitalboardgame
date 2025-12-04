import { MoveName } from "./types";

export interface MoveCost {
  readonly name: MoveName;
  readonly cost: number;
}

export const moveCosts: readonly MoveCost[] = [
  { name: "draw_card", cost: 1 },
  { name: "repair", cost: 1 },
  { name: "careful_sail_1", cost: 3 },
  { name: "careful_sail_2", cost: 5 },
  { name: "end_turn", cost: 0 },
];

export const getMoveCost = (name: MoveName): number => {
  const found = moveCosts.find((move) => move.name === name);
  if (!found) {
    throw new Error(`Unknown move: ${name}`);
  }
  return found.cost;
};
