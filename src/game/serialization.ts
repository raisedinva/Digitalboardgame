import { createRNG, SeededRNG } from "./random";
import { GameState, PlayerState, RNG } from "./types";

interface SerializedGameState {
  readonly players: readonly PlayerState[];
  readonly currentPlayer: number;
  readonly actionsRemaining: number;
  readonly path: GameState["path"];
  readonly openSeasStack: GameState["openSeasStack"];
  readonly epicStack: GameState["epicStack"];
  readonly epicClock: number;
  readonly seaDeck: GameState["seaDeck"];
  readonly seaDiscard: GameState["seaDiscard"];
  readonly rngSeed: number;
  readonly gameEnded: boolean;
  readonly winner: number | null;
}

const getRngSeed = (rng: RNG): number => (rng as SeededRNG).seed ?? Math.floor(rng.next() * 1000000);

export const serializeGameState = (state: GameState): string => {
  const payload: SerializedGameState = {
    players: state.players,
    currentPlayer: state.currentPlayer,
    actionsRemaining: state.actionsRemaining,
    path: state.path,
    openSeasStack: state.openSeasStack,
    epicStack: state.epicStack,
    epicClock: state.epicClock,
    seaDeck: state.seaDeck,
    seaDiscard: state.seaDiscard,
    rngSeed: getRngSeed(state.rng),
    gameEnded: state.gameEnded,
    winner: state.winner,
  };
  return JSON.stringify(payload);
};

export const deserializeGameState = (serialized: string): GameState => {
  const parsed = JSON.parse(serialized) as SerializedGameState;
  const rng = createRNG(parsed.rngSeed);
  return {
    ...parsed,
    rng,
  };
};
