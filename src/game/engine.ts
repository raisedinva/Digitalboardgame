import { createGameState } from "./gameState";
import { extendPath } from "./epicClock";
import { advanceTurn, applyMove, beginTurn, getLegalMoves } from "./reducers";
import { GameState, Move, StartTurnResult, Tile } from "./types";

export const startGame = (playerCount: number, seed = 1): GameState => createGameState(playerCount, seed);

export const startTurn = (state: GameState): StartTurnResult => beginTurn(state);

export const performMove = (state: GameState, move: Move): GameState => applyMove(state, move);

export const endTurn = (state: GameState): GameState => advanceTurn(state);

export const legalMoves = (state: GameState) => getLegalMoves(state);

export const peekNextEpic = (state: GameState): { readonly tile: Tile | null; readonly state: GameState } => {
  let working = state;
  let index = working.path.length;
  while (working.path.length <= index) {
    working = extendPath(working);
  }
  const tile = working.path.find((t, idx) => idx >= working.players[working.currentPlayer].position && (t.category === "epic" || t.category === "ithaca")) ?? null;
  return { tile, state: working };
};

export const resolveSirensPeek = (
  state: GameState,
): { readonly state: GameState; readonly tile: Tile | null } => {
  const flagged = state.players.find((p) => p.sirensPeekPending);
  if (!flagged) {
    return { state, tile: null };
  }
  let working = state;
  let index = flagged.position + 1;
  while (index >= working.path.length) {
    working = extendPath(working);
  }
  while (index < working.path.length && working.path[index].category === "open_sea") {
    index += 1;
    if (index >= working.path.length) {
      working = extendPath(working);
    }
  }
  const tile = working.path[index] ?? null;
  const cleared = working.players.map((p) =>
    p.playerId === flagged.playerId ? { ...p, sirensPeekPending: false } : p,
  );
  return { state: { ...working, players: cleared }, tile };
};
