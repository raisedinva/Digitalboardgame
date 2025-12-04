import { extendPath } from "./epicClock";
import { getMoveCost } from "./moves";
import { applySeaCard, drawSeaCard } from "./seaDeck";
import {
  EpicId,
  GameState,
  Move,
  MoveName,
  PlayerState,
  StartTurnResult,
  Tile,
} from "./types";

interface TileEffectResult {
  readonly state: GameState;
  readonly shipwrecked: boolean;
  readonly turnEnded: boolean;
}

interface TileEffectOptions {
  readonly aeolusSteps?: number;
}

const updatePlayer = (state: GameState, updater: (player: PlayerState) => PlayerState): GameState => ({
  ...state,
  players: state.players.map((p) => (p.playerId === state.currentPlayer ? updater(p) : p)),
});

const withPlayers = (state: GameState, players: readonly PlayerState[]): GameState => ({
  ...state,
  players,
});

export const beginTurn = (state: GameState): StartTurnResult => {
  const current = state.players[state.currentPlayer];
  if (current.skipNextTurn || current.stuckAtCyclops) {
    const cleared = state.players.map((p) =>
      p.playerId === current.playerId
        ? { ...p, skipNextTurn: false }
        : p,
    );
    return {
      state: {
        ...state,
        players: cleared,
        currentPlayer: (state.currentPlayer + 1) % state.players.length,
        actionsRemaining: 0,
      },
      skipped: true,
    };
  }
  let workingState: GameState = state;
  if (current.circeJumpPending) {
    workingState = jumpToNextEpic(state, current.playerId);
    workingState = withPlayers(workingState, workingState.players.map((p) =>
      p.playerId === current.playerId ? { ...p, circeJumpPending: false } : p,
    ));
  }
  return {
    state: {
      ...workingState,
      actionsRemaining: 5,
      players: workingState.players.map((p) =>
        p.playerId === current.playerId ? { ...p, skipNextTurn: false } : p,
      ),
    },
    skipped: false,
  };
};

const jumpToNextEpic = (state: GameState, playerId: number): GameState => {
  let working = state;
  const player = working.players.find((p) => p.playerId === playerId);
  if (!player) return state;
  let index = player.position + 1;
  while (index < working.path.length && working.path[index].category !== "epic" && working.path[index].category !== "ithaca") {
    index += 1;
    if (index >= working.path.length) {
      working = extendPath(working);
    }
  }
  const steps = index - player.position;
  for (let i = 0; i < steps; i += 1) {
    working = movePlayerStep(working, playerId, 1);
  }
  return working;
};

const resolveShipwreck = (state: GameState, playerId: number): GameState => {
  return {
    ...state,
    actionsRemaining: 0,
    players: state.players.map((p) =>
      p.playerId === playerId
        ? { ...p, damage: 3, skipNextTurn: true }
        : p,
    ),
  };
};

const applySafeHarbor = (state: GameState, playerId: number): TileEffectResult => ({
  state: withPlayers(
    state,
    state.players.map((p) =>
      p.playerId === playerId
        ? { ...p, damage: 0 }
        : p,
    ),
  ),
  shipwrecked: false,
  turnEnded: false,
});

const applySoldierAttack = (state: GameState, playerId: number): TileEffectResult => {
  const players = state.players.map((p) =>
    p.playerId === playerId ? { ...p, damage: p.damage + 1 } : p,
  );
  const player = players.find((p) => p.playerId === playerId)!;
  const shipwrecked = player.damage >= 3;
  return {
    state: shipwrecked ? resolveShipwreck({ ...state, players }, playerId) : { ...state, players },
    shipwrecked,
    turnEnded: shipwrecked,
  };
};

const applyLotusEaters = (state: GameState, playerId: number): TileEffectResult => {
  const moved = movePlayerStep(state, playerId, 1);
  const updated = withPlayers(
    moved,
    moved.players.map((p) =>
      p.playerId === playerId ? { ...p, skipNextTurn: true } : p,
    ),
  );
  return { state: updated, shipwrecked: false, turnEnded: false };
};

const applyCyclops = (state: GameState, playerId: number): TileEffectResult => {
  const player = state.players.find((p) => p.playerId === playerId)!;
  const stuckPlayers = state.players.filter((p) => p.stuckAtCyclops);
  if (stuckPlayers.length === 0) {
    return {
      state: withPlayers(
        state,
        state.players.map((p) =>
          p.playerId === playerId ? { ...p, stuckAtCyclops: true } : p,
        ),
      ),
      shipwrecked: false,
      turnEnded: false,
    };
  }
  let working = withPlayers(
    state,
    state.players.map((p) => ({ ...p, stuckAtCyclops: false })),
  );
  const rescueIds = new Set<number>([playerId, ...stuckPlayers.map((p) => p.playerId)]);
  rescueIds.forEach((id) => {
    working = movePlayerStep(working, id, 1);
    working = movePlayerStep(working, id, 1);
  });
  return { state: working, shipwrecked: false, turnEnded: false };
};

const applyAeolus = (
  state: GameState,
  playerId: number,
  options: TileEffectOptions,
): TileEffectResult => {
  const steps = Math.min(Math.max(options.aeolusSteps ?? 0, 0), 3);
  let working = state;
  for (let i = 0; i < steps; i += 1) {
    const player = working.players.find((p) => p.playerId === playerId)!;
    if (player.damage + 1 >= 3) {
      break;
    }
    const increased = withPlayers(
      working,
      working.players.map((p) =>
        p.playerId === playerId ? { ...p, damage: p.damage + 1 } : p,
      ),
    );
    working = movePlayerStep(increased, playerId, 1);
  }
  return { state: working, shipwrecked: false, turnEnded: false };
};

const applyCirce = (state: GameState, playerId: number): TileEffectResult => {
  const updated = withPlayers(
    state,
    state.players.map((p) =>
      p.playerId === playerId ? { ...p, skipNextTurn: true, circeJumpPending: true } : p,
    ),
  );
  return { state: updated, shipwrecked: false, turnEnded: true };
};

const applyUnderworld = (state: GameState, playerId: number): TileEffectResult => {
  const moved = movePlayerStep(state, playerId, -1);
  return { state: moved, shipwrecked: false, turnEnded: false };
};

const applySirens = (state: GameState, playerId: number): TileEffectResult => {
  const updated = withPlayers(
    state,
    state.players.map((p) =>
      p.playerId === playerId ? { ...p, sirensActive: true } : p,
    ),
  );
  return { state: updated, shipwrecked: false, turnEnded: false };
};

const applySunGodsCattle = (state: GameState, playerId: number): TileEffectResult => {
  const player = state.players.find((p) => p.playerId === playerId)!;
  let working = state;
  let target = player.position - 1;
  let destination = 0;
  while (target >= 0) {
    const tile = working.path[target];
    if (tile && tile.category === "epic" && tile.epicId !== "safe_harbor") {
      destination = target;
      break;
    }
    target -= 1;
  }
  const steps = player.position - destination;
  for (let i = 0; i < steps; i += 1) {
    working = movePlayerStep(working, playerId, -1);
  }
  return { state: working, shipwrecked: false, turnEnded: false };
};

const applyIthaca = (state: GameState, playerId: number): TileEffectResult => ({
  state: {
    ...state,
    gameEnded: true,
    winner: playerId,
  },
  shipwrecked: false,
  turnEnded: true,
});

const applyEpicEffect = (
  epicId: EpicId,
  tile: Tile,
  state: GameState,
  playerId: number,
  options: TileEffectOptions,
): TileEffectResult => {
  switch (epicId) {
    case "safe_harbor":
      return applySafeHarbor(state, playerId);
    case "soldier_attack":
      return applySoldierAttack(state, playerId);
    case "lotus_eaters":
      return applyLotusEaters(state, playerId);
    case "cyclops":
      return applyCyclops(state, playerId);
    case "aeolus":
      return applyAeolus(state, playerId, options);
    case "circe":
      return applyCirce(state, playerId);
    case "underworld":
      return applyUnderworld(state, playerId);
    case "sirens":
      return applySirens(state, playerId);
    case "sun_gods_cattle":
      return applySunGodsCattle(state, playerId);
    case "ithaca":
      return applyIthaca(state, playerId);
    default:
      return { state, shipwrecked: false, turnEnded: false };
  }
};

export const applyTileEffect = (
  tile: Tile,
  state: GameState,
  playerId: number,
  options: TileEffectOptions = {},
): TileEffectResult => {
  if (tile.category !== "epic" && tile.category !== "ithaca") {
    return { state, shipwrecked: false, turnEnded: false };
  }
  if (!tile.epicId) {
    return { state, shipwrecked: false, turnEnded: false };
  }
  return applyEpicEffect(tile.epicId, tile, state, playerId, options);
};

export const movePlayerStep = (
  state: GameState,
  playerId: number,
  direction: 1 | -1,
): GameState => {
  const player = state.players.find((p) => p.playerId === playerId);
  if (!player) return state;
  let working = state;
  let target = player.position + direction;
  if (target < 0) target = 0;
  while (target >= working.path.length) {
    working = extendPath(working);
  }
  const players = working.players.map((p) =>
    p.playerId === playerId ? { ...p, position: target } : p,
  );
  const movedState: GameState = { ...working, players };
  const tile = movedState.path[target];
  const effect = applyTileEffect(tile, movedState, playerId, {});
  return effect.state;
};

export const applyMove = (state: GameState, move: Move): GameState => {
  if (state.gameEnded) return state;
  const cost = getMoveCost(move.name);
  if (state.actionsRemaining < cost) return state;
  const player = state.players[state.currentPlayer];
  let working = state;
  switch (move.name) {
    case "draw_card": {
      if (working.seaDeck.length === 0 && working.seaDiscard.length === 0) {
        return working;
      }
      const { state: withDraw, card } = drawSeaCard(working);
      const applied = applySeaCard(withDraw, player, card, movePlayerStep);
      const withDiscard: GameState = {
        ...applied.state,
        seaDiscard: [...applied.state.seaDiscard, card],
      };
      working = withDiscard;
      if (applied.shipwrecked) {
        return resolveShipwreck(working, player.playerId);
      }
      if (applied.endTurn) {
        return { ...working, actionsRemaining: 0 };
      }
      break;
    }
    case "repair": {
      working = updatePlayer(working, (p) => ({ ...p, damage: Math.max(0, p.damage - 1) }));
      break;
    }
    case "careful_sail_1": {
      working = movePlayerStep(working, player.playerId, 1);
      break;
    }
    case "careful_sail_2": {
      if (player.damage !== 0) return working;
      working = movePlayerStep(working, player.playerId, 1);
      working = movePlayerStep(working, player.playerId, 1);
      working = { ...working, actionsRemaining: 0 };
      break;
    }
    case "end_turn": {
      working = { ...working, actionsRemaining: 0 };
      break;
    }
    default:
      return working;
  }
  const remaining = working.actionsRemaining - cost;
  let updated: GameState = { ...working, actionsRemaining: remaining };
  const current = updated.players[updated.currentPlayer];
  if (current.sirensActive && remaining === 0) {
    updated = withPlayers(
      updated,
      updated.players.map((p) =>
        p.playerId === current.playerId
          ? { ...p, sirensActive: false, sirensPeekPending: true }
          : p,
      ),
    );
  }
  return updated;
};

export const getLegalMoves = (state: GameState): readonly MoveName[] => {
  if (state.gameEnded) return [];
  const player = state.players[state.currentPlayer];
  const legal: MoveName[] = [];
  if (
    state.actionsRemaining >= getMoveCost("draw_card") &&
    (state.seaDeck.length > 0 || state.seaDiscard.length > 0)
  ) {
    legal.push("draw_card");
  }
  if (state.actionsRemaining >= getMoveCost("repair")) {
    legal.push("repair");
  }
  if (state.actionsRemaining >= getMoveCost("careful_sail_1")) {
    legal.push("careful_sail_1");
  }
  if (player.damage === 0 && state.actionsRemaining >= getMoveCost("careful_sail_2")) {
    legal.push("careful_sail_2");
  }
  const mustActAll = player.sirensActive && state.actionsRemaining > 0;
  if (!mustActAll) {
    legal.push("end_turn");
  }
  return legal;
};

export const advanceTurn = (state: GameState): GameState => ({
  ...state,
  currentPlayer: (state.currentPlayer + 1) % state.players.length,
  actionsRemaining: 0,
});
