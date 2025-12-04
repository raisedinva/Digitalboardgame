import { extendPath } from "./epicClock";
import { GameState, PlayerState, SeaCard } from "./types";

// 50 cards: 20 negative, 10 neutral-ish, 20 positive (40% / 20% / 40%)
export const baseSeaDeck: readonly SeaCard[] = [
  // Negative (balanced setbacks)
  { id: "choppy_1", name: "Choppy Waters", move: 1, damage: 1 },
  { id: "choppy_2", name: "Choppy Waters", move: 1, damage: 1 },
  { id: "choppy_3", name: "Choppy Waters", move: 1, damage: 1 },
  { id: "choppy_4", name: "Choppy Waters", move: 1, damage: 1 },
  { id: "rough_1", name: "Rough Gale", move: 2, damage: 1 },
  { id: "rough_2", name: "Rough Gale", move: 2, damage: 1 },
  { id: "rough_3", name: "Rough Gale", move: 2, damage: 1 },
  { id: "countercurrent_1", name: "Countercurrent", move: -1, damage: 1 },
  { id: "countercurrent_2", name: "Countercurrent", move: -1, damage: 1 },
  { id: "countercurrent_3", name: "Countercurrent", move: -1, damage: 1 },
  { id: "treacherous_1", name: "Treacherous Current", move: -2, damage: 1 },
  { id: "treacherous_2", name: "Treacherous Current", move: -2, damage: 1 },
  { id: "treacherous_3", name: "Treacherous Current", move: -2, damage: 1 },
  { id: "maelstrom", name: "Maelstrom", move: -3, damage: 1, endTurn: true },
  { id: "squall_1", name: "Sudden Squall", move: 0, damage: 1 },
  { id: "squall_2", name: "Sudden Squall", move: 0, damage: 1 },
  { id: "crash_1", name: "Crash", move: 2, damage: 1, endTurn: true },
  { id: "crash_2", name: "Crash", move: 2, damage: 1, endTurn: true },
  { id: "surge_1", name: "Surge", move: 3, damage: 1, endTurn: true },
  { id: "surge_2", name: "Surge", move: 3, damage: 1, endTurn: true },

  // Neutral-ish (minor drift, mostly pause)
  { id: "dead_calm_1", name: "Dead Calm", move: 0, damage: 0 },
  { id: "dead_calm_2", name: "Dead Calm", move: 0, damage: 0 },
  { id: "dead_calm_3", name: "Dead Calm", move: 0, damage: 0 },
  { id: "ebb_flow_1", name: "Ebb and Flow", move: -1, damage: 0 },
  { id: "ebb_flow_2", name: "Ebb and Flow", move: -1, damage: 0 },
  { id: "balanced_tide_1", name: "Balanced Tide", move: 1, damage: 0 },
  { id: "balanced_tide_2", name: "Balanced Tide", move: 1, damage: 0 },
  { id: "balanced_tide_3", name: "Balanced Tide", move: 1, damage: 0, endTurn: true },
  { id: "holding_pattern_1", name: "Holding Pattern", move: 0, damage: 0, endTurn: true },
  { id: "holding_pattern_2", name: "Holding Pattern", move: 0, damage: 0, endTurn: true },

  // Positive (steady with occasional burst)
  { id: "calm_1", name: "Calm Seas", move: 1, damage: 0 },
  { id: "calm_2", name: "Calm Seas", move: 1, damage: 0 },
  { id: "calm_3", name: "Calm Seas", move: 1, damage: 0 },
  { id: "calm_4", name: "Calm Seas", move: 1, damage: 0 },
  { id: "calm_5", name: "Calm Seas", move: 1, damage: 0 },
  { id: "calm_6", name: "Calm Seas", move: 1, damage: 0 },
  { id: "calm_7", name: "Calm Seas", move: 1, damage: 0 },
  { id: "steady_breeze_1", name: "Steady Breeze", move: 1, damage: 0 },
  { id: "steady_breeze_2", name: "Steady Breeze", move: 1, damage: 0 },
  { id: "steady_breeze_3", name: "Steady Breeze", move: 1, damage: 0 },
  { id: "steady_breeze_4", name: "Steady Breeze", move: 1, damage: 0 },
  { id: "tailwind_1", name: "Tailwind", move: 2, damage: 0 },
  { id: "tailwind_2", name: "Tailwind", move: 2, damage: 0 },
  { id: "tailwind_3", name: "Tailwind", move: 2, damage: 0 },
  { id: "measured_advance_1", name: "Measured Advance", move: 2, damage: 0, endTurn: true },
  { id: "measured_advance_2", name: "Measured Advance", move: 2, damage: 0, endTurn: true },
  { id: "favorable_1", name: "Favorable Tide", move: 3, damage: 0 },
  { id: "swift_current", name: "Swift Current", move: 4, damage: 0, endTurn: true },
  {
    id: "charted_course_1",
    name: "Charted Course",
    move: 0,
    damage: 0,
    endTurn: true,
    advanceToNextEpic: true,
    skipEpicEffect: true,
  },
  {
    id: "charted_course_2",
    name: "Charted Course",
    move: 0,
    damage: 0,
    endTurn: true,
    advanceToNextEpic: true,
    skipEpicEffect: true,
  },
];

export const shuffleSeaDeck = (deck: readonly SeaCard[], rng: GameState["rng"]): readonly SeaCard[] => {
  const mutable = [...deck];
  for (let i = mutable.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng.next() * (i + 1));
    const temp = mutable[i];
    mutable[i] = mutable[j];
    mutable[j] = temp;
  }
  return mutable;
};

export const drawSeaCard = (
  state: GameState,
): { readonly state: GameState; readonly card: SeaCard } => {
  let working = state;
  if (working.seaDeck.length === 0 && working.seaDiscard.length > 0) {
    const reshuffled = shuffleSeaDeck(working.seaDiscard, working.rng);
    working = {
      ...working,
      seaDeck: reshuffled,
      seaDiscard: [],
    };
  }
  const [card, ...rest] = working.seaDeck;
  if (!card) {
    throw new Error("Sea deck exhausted");
  }
  return {
    card,
    state: {
      ...working,
      seaDeck: rest,
      seaDiscard: working.seaDiscard,
    },
  };
};

export interface ApplySeaCardResult {
  readonly state: GameState;
  readonly shipwrecked: boolean;
  readonly endTurn: boolean;
}

export type MoveStep = (state: GameState, playerId: number, direction: 1 | -1) => GameState;

export const applySeaCard = (
  state: GameState,
  player: PlayerState,
  card: SeaCard,
  moveStep: MoveStep,
): ApplySeaCardResult => {
  let working = state;
  if (card.advanceToNextEpic) {
    const current = working.players.find((p) => p.playerId === player.playerId);
    if (current) {
      let index = current.position + 1;
      while (true) {
        if (index >= working.path.length) {
          working = extendPath(working);
        }
        const tile = working.path[index];
        if (tile.category === "epic" || tile.category === "ithaca") {
          break;
        }
        index += 1;
      }
      const players = working.players.map((p) =>
        p.playerId === player.playerId ? { ...p, position: index } : p,
      );
      working = { ...working, players };
    }
  } else {
    const direction: 1 | -1 = card.move >= 0 ? 1 : -1;
    for (let i = 0; i < Math.abs(card.move); i += 1) {
      working = moveStep(working, player.playerId, direction);
    }
  }
  const updatedPlayers = working.players.map((p) =>
    p.playerId === player.playerId
      ? { ...p, damage: p.damage + card.damage }
      : p,
  );
  const damagedPlayer = updatedPlayers.find((p) => p.playerId === player.playerId);
  const shipwrecked = (damagedPlayer?.damage ?? 0) >= 3;
  return {
    state: { ...working, players: updatedPlayers },
    shipwrecked,
    endTurn: Boolean(card.endTurn),
  };
};
