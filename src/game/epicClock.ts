import { GameState, Tile } from "./types";

const drawTile = (tiles: readonly Tile[]): { tile: Tile; remaining: readonly Tile[] } => {
  const [tile, ...rest] = tiles;
  if (!tile) {
    throw new Error("Tile stack exhausted");
  }
  return { tile, remaining: rest };
};

export const extendPath = (state: GameState): GameState => {
  const drawEpic = state.epicClock === 2;
  if (drawEpic) {
    const { tile, remaining } = drawTile(state.epicStack);
    return {
      ...state,
      path: [...state.path, tile],
      epicStack: remaining,
      epicClock: 0,
    };
  }
  const { tile, remaining } = drawTile(state.openSeasStack);
  return {
    ...state,
    path: [...state.path, tile],
    openSeasStack: remaining,
    epicClock: state.epicClock + 1,
  };
};
