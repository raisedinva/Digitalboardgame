import { extendPath } from "../game/epicClock";
import { GameState, Tile } from "../game/types";
import { BoardTileView, EpicPreviewTile, GameView, PlayerId } from "./contracts";

const epicMetadata: Record<string, { readonly name: string; readonly description: string }> = {
  safe_harbor: { name: "Safe Harbor", description: "Fully repair all damage." },
  soldier_attack: { name: "Soldier Attack", description: "Take 1 damage; shipwreck at 3." },
  lotus_eaters: { name: "Lotus-Eaters", description: "Move forward 1 and skip your next turn." },
  cyclops: { name: "Cyclops", description: "First visitor becomes stuck; later arrivals free all and move forward." },
  aeolus: { name: "Aeolus", description: "Choose 0–3 steps forward; each step adds 1 damage without sinking the ship." },
  circe: { name: "Circe", description: "End turn; next turn starts with a jump to the next Epic tile." },
  underworld: { name: "Underworld", description: "Move back 1 tile and resolve it." },
  sirens: { name: "Sirens", description: "Spend all 5 actions on this turn; earn a peek ahead after finishing." },
  sun_gods_cattle: { name: "Sun God’s Cattle", description: "Backtrack to the nearest prior Epic (not Safe Harbor)." },
  ithaca: { name: "Ithaca", description: "Reach Ithaca to win the game." },
};

const formatEpicName = (epicId: string): string => epicMetadata[epicId]?.name ?? epicId.replace(/_/g, " ");

const formatTileType = (tile: Tile): BoardTileView["type"] => {
  switch (tile.category) {
    case "troy":
      return "START";
    case "ithaca":
      return "ITHACA";
    case "epic":
      return "EPIC";
    default:
      return "SEA";
  }
};

const toBoardTileView = (state: GameState, tile: Tile, index: number): BoardTileView => ({
  id: tile.id,
  index,
  type: formatTileType(tile),
  epicName: tile.epicId ? formatEpicName(tile.epicId) : undefined,
  players: state.players.filter((player) => player.position === index).map((player) => player.playerId),
});

const computeAeolusOptions = (playerDamage: number): readonly (0 | 1 | 2 | 3)[] => {
  const safeSteps = Math.max(0, Math.min(3, 2 - playerDamage));
  return (Array.from({ length: safeSteps + 1 }, (_, step) => step) as readonly number[]).filter(
    (step): step is 0 | 1 | 2 | 3 => step >= 0 && step <= 3,
  );
};

const describeActiveEpic = (state: GameState): GameView["activeEpic"] => {
  const player = state.players[state.currentPlayer];
  const tile = state.path[player.position];
  if (!tile || (tile.category !== "epic" && tile.category !== "ithaca")) {
    return undefined;
  }
  const epicId = tile.epicId ?? "ithaca";
  const metadata = epicMetadata[epicId];
  const requiresChoice = epicId === "aeolus";
  const allowedAeolusMoves = requiresChoice ? computeAeolusOptions(player.damage) : undefined;
  return {
    id: epicId,
    name: metadata?.name ?? formatEpicName(epicId),
    description: metadata?.description ?? "Epic encounter",
    requiresChoice,
    allowedAeolusMoves,
  };
};

const findNextEpicOnPath = (state: GameState, playerId: PlayerId): EpicPreviewTile[] => {
  const player = state.players.find((p) => p.playerId === playerId);
  if (!player?.sirensPeekPending) return [];
  let working = state;
  let index = player.position + 1;
  while (index >= working.path.length) {
    working = extendPath(working);
  }
  for (let i = index; i < working.path.length; i += 1) {
    const tile = working.path[i];
    if (tile.category === "epic" || tile.category === "ithaca") {
      return [
        {
          id: tile.id,
          index: i,
          name: tile.epicId ? formatEpicName(tile.epicId) : "Epic",
        },
      ];
    }
  }
  return [];
};

export const projectGameView = (state: GameState): GameView => {
  const tiles = state.path.map((tile, index) => toBoardTileView(state, tile, index));
  const damageByPlayer: Record<PlayerId, number> = state.players.reduce(
    (acc, player) => ({ ...acc, [player.playerId]: player.damage }),
    {} as Record<PlayerId, number>,
  );
  const upcomingEpicTiles = state.players.flatMap((player) => findNextEpicOnPath(state, player.playerId));
  const activeEpic = describeActiveEpic(state);
  return {
    state,
    currentPlayerId: state.currentPlayer,
    actionsRemaining: state.actionsRemaining,
    damageByPlayer,
    tiles,
    ...(activeEpic ? { activeEpic } : {}),
    ...(upcomingEpicTiles.length > 0 ? { upcomingEpicPeek: { tiles: upcomingEpicTiles } } : {}),
    ...(state.gameEnded && state.winner !== null ? { gameOver: { winnerPlayerId: state.winner } } : {}),
  };
};

