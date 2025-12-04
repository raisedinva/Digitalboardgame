import { GameState, PlayerState, Tile } from "../game/types";

export type PlayerId = PlayerState["playerId"];

export type UiCommand =
  | { readonly type: "START_GAME"; readonly playerNames: string[] }
  | {
      readonly type: "CHOOSE_CORE_ACTION";
      readonly playerId: PlayerId;
      readonly action: "DRAW_SEA_CARD" | "REPAIR_SHIP" | "END_TURN";
    }
  | {
      readonly type: "RESOLVE_AEOLUS_MOVE";
      readonly playerId: PlayerId;
      readonly tilesToMove: 0 | 1 | 2 | 3;
    }
  | {
      readonly type: "ACKNOWLEDGE_EPIC";
      readonly playerId: PlayerId;
      readonly epicId: string;
    };

export interface GameView {
  readonly state: GameState;
  readonly currentPlayerId: PlayerId;
  readonly actionsRemaining: number;
  readonly damageByPlayer: Record<PlayerId, number>;
  readonly tiles: readonly BoardTileView[];
  readonly activeEpic?: {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly requiresChoice: boolean;
    readonly allowedAeolusMoves?: readonly (0 | 1 | 2 | 3)[];
  };
  readonly upcomingEpicPeek?: {
    readonly tiles: readonly EpicPreviewTile[];
  };
  readonly gameOver?: {
    readonly winnerPlayerId: PlayerId;
  };
}

export interface BoardTileView {
  readonly id: string;
  readonly index: number;
  readonly type: "SEA" | "EPIC" | "START" | "ITHACA";
  readonly epicName?: string;
  readonly players: readonly PlayerId[];
}

export interface EpicPreviewTile {
  readonly id: string;
  readonly index: number;
  readonly name: string;
}

export interface GameEngineAPI {
  readonly initGame: (playerNames: string[]) => GameState;
  readonly getView: (state: GameState) => GameView;
  readonly getLegalCommands: (state: GameState, playerId: PlayerId) => readonly UiCommand[];
  readonly applyCommand: (state: GameState, command: UiCommand) => GameState;
}

export type TileFormatter = (tile: Tile) => string | undefined;

