import { EpicId, Tile } from "./types";

const epicIds: readonly EpicId[] = [
  "safe_harbor",
  "soldier_attack",
  "lotus_eaters",
  "cyclops",
  "aeolus",
  "circe",
  "underworld",
  "sirens",
  "sun_gods_cattle",
  "ithaca",
];

const createEpicTiles = (): readonly Tile[] =>
  epicIds.map((epicId, index) => ({
    id: `epic_${index + 1}_${epicId}`,
    category: epicId === "ithaca" ? "ithaca" : "epic",
    epicId,
  }));

const createOpenSeaTiles = (count: number): readonly Tile[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `open_${index + 1}`,
    category: "open_sea",
  }));

export const createTroyTile = (): Tile => ({
  id: "troy",
  category: "troy",
});

export const createOpenSeaStack = (): readonly Tile[] => createOpenSeaTiles(24);

export const createEpicStack = (): readonly Tile[] => createEpicTiles();

export const initialPath = (): readonly Tile[] => [createTroyTile()];
