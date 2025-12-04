export type TileCategory = "troy" | "open_sea" | "epic" | "ithaca";

export type EpicId =
  | "safe_harbor"
  | "soldier_attack"
  | "lotus_eaters"
  | "cyclops"
  | "aeolus"
  | "circe"
  | "underworld"
  | "sirens"
  | "sun_gods_cattle"
  | "ithaca";

export interface Tile {
  readonly id: string;
  readonly category: TileCategory;
  readonly epicId?: EpicId;
}

export interface SeaCard {
  readonly id: string;
  readonly name: string;
  readonly move: number;
  readonly damage: number;
  readonly endTurn?: boolean;
  readonly advanceToNextEpic?: boolean;
  readonly skipEpicEffect?: boolean;
}

export interface PlayerState {
  readonly playerId: number;
  readonly position: number;
  readonly damage: number;
  readonly skipNextTurn: boolean;
  readonly stuckAtCyclops: boolean;
  readonly sirensActive: boolean;
  readonly circeJumpPending?: boolean;
  readonly sirensPeekPending?: boolean;
}

export interface RNG {
  readonly next: () => number;
}

export interface GameState {
  readonly players: readonly PlayerState[];
  readonly currentPlayer: number;
  readonly actionsRemaining: number;
  readonly path: readonly Tile[];
  readonly openSeasStack: readonly Tile[];
  readonly epicStack: readonly Tile[];
  readonly epicClock: number;
  readonly seaDeck: readonly SeaCard[];
  readonly seaDiscard: readonly SeaCard[];
  readonly rng: RNG;
  readonly gameEnded: boolean;
  readonly winner: number | null;
}

export type MoveName =
  | "draw_card"
  | "repair"
  | "careful_sail_1"
  | "careful_sail_2"
  | "end_turn";

export interface Move {
  readonly name: MoveName;
  readonly payload?: unknown;
}

export interface StartTurnResult {
  readonly state: GameState;
  readonly skipped: boolean;
}
