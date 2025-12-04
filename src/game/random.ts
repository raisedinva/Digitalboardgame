import { RNG } from "./types";

const MOD = 2 ** 31 - 1;
const MULTIPLIER = 48271;

export interface SeededRNG extends RNG {
  readonly seed: number;
}

export const createRNG = (seed: number): SeededRNG => {
  let internal = seed % MOD;
  const next = () => {
    internal = (internal * MULTIPLIER) % MOD;
    return internal / MOD;
  };
  return {
    seed,
    next,
  };
};

export const cloneRNG = (rng: RNG): SeededRNG => {
  if ((rng as SeededRNG).seed !== undefined) {
    return createRNG((rng as SeededRNG).seed);
  }
  const seed = Math.floor(rng.next() * MOD);
  return createRNG(seed);
};
