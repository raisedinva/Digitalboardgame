import { createGameState } from "../game/gameState";
import { applyTileEffect, applyMove, getLegalMoves } from "../game/reducers";
import { GameState, MoveName, Tile } from "../game/types";
import { GameEngineAPI, GameView, PlayerId, UiCommand } from "./contracts";
import { projectGameView } from "./viewModel";

type CoreActionCommand = Extract<UiCommand, { readonly type: "CHOOSE_CORE_ACTION" }>;

const mapMove = (action: CoreActionCommand): MoveName => {
  switch (action.action) {
    case "DRAW_SEA_CARD":
      return "draw_card";
    case "REPAIR_SHIP":
      return "repair";
    case "CAREFUL_SAIL_1":
      return "careful_sail_1";
    case "CAREFUL_SAIL_2":
      return "careful_sail_2";
    case "END_TURN":
    default:
      return "end_turn";
  }
};

const applyAeolusChoice = (state: GameState, playerId: PlayerId, tilesToMove: 0 | 1 | 2 | 3): GameState => {
  const player = state.players.find((p) => p.playerId === playerId);
  const tile: Tile | undefined = player ? state.path[player.position] : undefined;
  if (!tile || tile.epicId !== "aeolus") {
    return state;
  }
  const result = applyTileEffect(tile, state, playerId, { aeolusSteps: tilesToMove });
  return result.state;
};

const filterCommandsForPlayer = (state: GameState, playerId: PlayerId, view: GameView): UiCommand[] => {
  if (state.gameEnded || state.currentPlayer !== playerId) return [];
  const legal: UiCommand[] = [];
  const moves = getLegalMoves(state);
  if (moves.includes("draw_card")) {
    legal.push({ type: "CHOOSE_CORE_ACTION", playerId, action: "DRAW_SEA_CARD" });
  }
  if (moves.includes("repair")) {
    legal.push({ type: "CHOOSE_CORE_ACTION", playerId, action: "REPAIR_SHIP" });
  }
  if (moves.includes("careful_sail_1")) {
    legal.push({ type: "CHOOSE_CORE_ACTION", playerId, action: "CAREFUL_SAIL_1" });
  }
  if (moves.includes("careful_sail_2")) {
    legal.push({ type: "CHOOSE_CORE_ACTION", playerId, action: "CAREFUL_SAIL_2" });
  }
  if (moves.includes("end_turn")) {
    legal.push({ type: "CHOOSE_CORE_ACTION", playerId, action: "END_TURN" });
  }
  if (view.activeEpic?.requiresChoice && view.activeEpic.allowedAeolusMoves) {
    view.activeEpic.allowedAeolusMoves.forEach((tilesToMove) => {
      legal.push({ type: "RESOLVE_AEOLUS_MOVE", playerId, tilesToMove });
    });
  }
  if (view.activeEpic) {
    legal.push({ type: "ACKNOWLEDGE_EPIC", playerId, epicId: view.activeEpic.id });
  }
  return legal;
};

export const gameEngineApi: GameEngineAPI = {
  initGame: (playerNames: string[]): GameState => createGameState(playerNames.length),
  getView: (state: GameState): GameView => projectGameView(state),
  getLegalCommands: (state: GameState, playerId: PlayerId): readonly UiCommand[] =>
    filterCommandsForPlayer(state, playerId, projectGameView(state)),
  applyCommand: (state: GameState, command: UiCommand): GameState => {
    switch (command.type) {
      case "START_GAME":
        return gameEngineApi.initGame(command.playerNames);
      case "CHOOSE_CORE_ACTION":
        if (command.playerId !== state.currentPlayer) return state;
        return applyMove(state, { name: mapMove(command) });
      case "RESOLVE_AEOLUS_MOVE":
        return applyAeolusChoice(state, command.playerId, command.tilesToMove);
      case "ACKNOWLEDGE_EPIC":
      default:
        return state;
    }
  },
};

