import { legalMoves, startTurn } from "../game/engine";
import { GameState, PlayerState, Tile } from "../game/types";

const formatTileLabel = (tile: Tile): string => {
  switch (tile.category) {
    case "troy":
      return "Troy";
    case "ithaca":
      return "Ithaca";
    case "epic":
      return tile.epicId?.replace(/_/g, " ") ?? "Epic";
    case "open_sea":
    default:
      return "Open Sea";
  }
};

const formatFlags = (player: PlayerState): string => {
  const flags: string[] = [];
  if (player.skipNextTurn) {
    flags.push("skip next turn");
  }
  if (player.stuckAtCyclops) {
    flags.push("stuck at cyclops");
  }
  if (player.sirensActive) {
    flags.push("sirens");
  }
  if (player.circeJumpPending) {
    flags.push("circe jump");
  }
  if (player.sirensPeekPending) {
    flags.push("sirens peek");
  }
  return flags.length ? ` [${flags.join(", ")}]` : "";
};

const describePlayer = (state: GameState, player: PlayerState): string => {
  const tile = state.path[player.position];
  const location = tile ? `${formatTileLabel(tile)} (#${player.position})` : `Unknown (#${player.position})`;
  return `P${player.playerId + 1}: ${location}, damage ${player.damage}${formatFlags(player)}`;
};

const describePath = (state: GameState): string =>
  state.path
    .map((tile, index) => {
      const occupants = state.players
        .filter((player) => player.position === index)
        .map((player) => `P${player.playerId + 1}`)
        .join(", ");
      const label = formatTileLabel(tile);
      return occupants ? `[${index}:${label} – ${occupants}]` : `[${index}:${label}]`;
    })
    .join(" ");

export interface RenderOptions {
  readonly includeLegalMoves?: boolean;
  readonly includeAutoStartTurn?: boolean;
}

export const renderStateSummary = (state: GameState, options: RenderOptions = {}): string => {
  const baselineMoves = options.includeAutoStartTurn ? legalMoves(startTurn(state).state) : legalMoves(state);
  const moves = options.includeLegalMoves ? baselineMoves : undefined;
  const playerLines = state.players.map((player) => `- ${describePlayer(state, player)}`).join("\n");
  const moveLine = moves ? `\nLegal moves: ${moves.join(", ")}` : "";
  return [
    `Current player: P${state.currentPlayer + 1}`,
    `Actions remaining: ${state.actionsRemaining}`,
    `Epic clock: ${state.epicClock} of 3`,
    `Sea deck: ${state.seaDeck.length} | discard: ${state.seaDiscard.length}`,
    "Players:",
    playerLines,
    "Path:",
    describePath(state),
    moveLine,
  ]
    .filter(Boolean)
    .join("\n");
};
