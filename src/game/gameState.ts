import { createEpicStack, createOpenSeaStack, initialPath } from "./tiles";
import { baseSeaDeck, shuffleSeaDeck } from "./seaDeck";
import { GameState, PlayerState } from "./types";
import { createRNG } from "./random";

export const createPlayers = (count: number): readonly PlayerState[] =>
  Array.from({ length: count }, (_, index) => ({
    playerId: index,
    position: 0,
    damage: 0,
    skipNextTurn: false,
    stuckAtCyclops: false,
    sirensActive: false,
    circeJumpPending: false,
    sirensPeekPending: false,
  }));

export const createGameState = (playerCount: number, seed = 1): GameState => {
  const rng = createRNG(seed);
  return {
    players: createPlayers(playerCount),
    currentPlayer: 0,
    actionsRemaining: 0,
    path: initialPath(),
    openSeasStack: createOpenSeaStack(),
    epicStack: createEpicStack(),
    epicClock: 0,
    seaDeck: shuffleSeaDeck(baseSeaDeck, rng),
    seaDiscard: [],
    rng,
    gameEnded: false,
    winner: null,
  };
};
