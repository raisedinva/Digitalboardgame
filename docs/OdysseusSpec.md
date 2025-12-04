Odysseus: Tempt the Seas — Pure TypeScript Logic Engine

Paste this into your Codex project as the main long-form system prompt.
Codex will follow these rules for all future code generations and edits.

------------------------------------------------------------
1. PURPOSE OF THIS CODEX PROJECT
------------------------------------------------------------

This Codex project must create and maintain a full TypeScript game-logic engine for a turn-based, hot-seat multiplayer game titled Odysseus: Tempt the Seas.

Codex will:

Generate TypeScript modules

Maintain project-wide architectural consistency

Create and update logic, types, reducers, and tests

Never generate UI code

Never use browser APIs

Always produce pure, deterministic logic

The final engine must be:

Immutable

Fully typed

Testable

Serializable

Platform-agnostic

Game rules are fully specified below and must be followed exactly.

------------------------------------------------------------
2. OUTPUT RULES FOR CODEX
------------------------------------------------------------

Codex must follow these strict output rules:

2.1 When creating or updating files:

Produce complete file contents

Include file paths at the top

Use ES modules (export function, export const)

Never generate partial files unless explicitly asked

2.2 Architecture restrictions:

No classes unless explicitly requested

No side effects

No global state

No mutation of arguments or state

All state transitions return new objects

2.3 Code style:

Use readonly where appropriate

Prefer const over let

No magical values — use enums or string unions

Minimize unnecessary abstractions

Keep each module small and single-purpose

------------------------------------------------------------
3. REQUIRED DIRECTORY STRUCTURE
------------------------------------------------------------

Codex must maintain this file structure:

/src/game/types.ts
/src/game/gameState.ts
/src/game/tiles.ts
/src/game/epicClock.ts
/src/game/seaDeck.ts
/src/game/moves.ts
/src/game/rules.ts
/src/game/engine.ts
/src/game/reducers.ts
/src/game/random.ts
/src/game/serialization.ts
/src/game/tests/
/src/game/tests/*.ts  (test cases)

------------------------------------------------------------
4. DATA MODEL (STRICT)
------------------------------------------------------------

Codex must maintain and use the following TypeScript types.

4.1 Tile Categories
type TileCategory =
  | "troy"
  | "open_sea"
  | "epic"
  | "ithaca";

4.2 Epic Identifiers
type EpicId =
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

4.3 Tile Definition
interface Tile {
  id: string;
  category: TileCategory;
  epicId?: EpicId;   // only present for epic tiles
}

4.4 Sea Card Definition
interface SeaCard {
  id: string;
  name: string;
  move: number;       // positive or negative
  damage: number;     // 0 or 1 usually
  endTurn?: boolean;
}

4.5 PlayerState
interface PlayerState {
  playerId: number;
  position: number;
  damage: number;            // 0–3
  skipNextTurn: boolean;
  stuckAtCyclops: boolean;
  sirensActive: boolean;
}

4.6 GameState
interface GameState {
  players: PlayerState[];
  currentPlayer: number;
  actionsRemaining: number;

  path: Tile[];
  openSeasStack: Tile[];
  epicStack: Tile[];        // Ithaca always last
  epicClock: number;        // 0,1,2 then Epic then reset to 0

  seaDeck: SeaCard[];
  seaDiscard: SeaCard[];

  rng: RNG;

  gameEnded: boolean;
  winner: number | null;
}

4.7 RNG Interface
interface RNG {
  next(): number;     // returns 0 ≤ n < 1
}

------------------------------------------------------------
5. GAMEPLAY RULES (STRICT)
------------------------------------------------------------

This section contains the authoritative game rules.
Codex must implement logic based solely on these definitions.

5.0 Player Count

The game supports 2–4 players. Game creation must reject player counts below 2 or above 4.

5.1 Turn Flow

The following sequence defines a turn:

If player.skipNextTurn → clear flag, skip turn

If player.stuckAtCyclops → skip turn

Apply Circe “jump to next Epic” if pending

Set actionsRemaining = 5

Player may take actions until:

They run out of actions

They choose to end turn

A card/tile ends the turn

Shipwreck occurs

5.2 Actions Available

Actions are:

"draw_card"
"repair"
"careful_sail_1"
"careful_sail_2"
"end_turn"

draw_card (cost: 1)

Reveal the top Sea card

Apply movement

Apply damage

If damage reaches 3 → shipwreck

If endTurn=true → end turn

repair (cost: 1)

damage = max(0, damage - 1)

careful_sail_1 (cost: 3)

Move forward exactly 1 tile

Trigger tile effect

No card drawn

careful_sail_2 (cost: 5)

Player must have 0 damage

Move forward exactly 2 tiles

Trigger tile effect on landing

No card drawn

Turn ends after this action

end_turn

Allowed anytime unless Sirens forces all 5 actions

------------------------------------------------------------
6. TILE EFFECTS (STRICT)
------------------------------------------------------------

Codex must implement reducers for each Epic tile:

6.1 Safe Harbor

Fully repair: damage = 0

6.2 Soldier Attack

damage += 1; if damage >= 3 → shipwreck

6.3 Lotus-Eaters

Move forward 1 tile

skipNextTurn = true

6.4 Cyclops

Landing alone:

stuckAtCyclops = true

Landing with a stuck player:

Move both ships forward 2 tiles

stuckAtCyclops = false for all

6.5 Aeolus

Player chooses 0–3 spaces to move forward.
For each tile moved:

damage += 1

If damage would reach 3 → cannot move further

Trigger landing tile.

6.6 Circe

End turn immediately

skipNextTurn = true

On the first turn after the skipped one:

Jump forward to the next Epic tile ahead

Trigger that tile

Continue the turn normally

6.7 Underworld

Move back 1 tile (trigger effect)

Peek at top 2 tiles of epicStack (do not reorder)

6.8 Sirens

sirensActive = true
On next turn:

Must take all 5 actions
After completing that turn without shipwreck:

Peek at next Epic tile

6.9 Sun God’s Cattle

Move backward to the previous Epic Challenge (not Safe Harbor)

Trigger that tile again

If none exists behind → move to Troy, trigger nothing

6.10 Ithaca

Landing on Ithaca = immediate win

------------------------------------------------------------
7. PATH EXTENSION RULES
------------------------------------------------------------

Codex must implement a pure function:

extendPath(state: GameState): GameState


Rules:

If epicClock < 2 → draw Open Sea tile, epicClock++

If epicClock = 2 → draw Epic tile, epicClock = 0

Always append drawn tile to state.path

If drawn Epic tile is Ithaca → path end is now final

Movement must be resolved tile by tile, extending path as needed.

------------------------------------------------------------
8. SEA DECK RULES
------------------------------------------------------------

Codex must implement:

drawSeaCard()
applySeaCard()
shuffleSeaDeck()


Sea cards never form a hand

Draw → resolve → discard

If deck is empty → draw_card is not allowed

Game ends when deck exhausted AND after equal turn counts

------------------------------------------------------------
9. SHIPWRECK RULES
------------------------------------------------------------

A shipwreck occurs when:

player.damage >= 3


Effects:

End turn immediately

skipNextTurn = true

Keep damage at 3

------------------------------------------------------------
10. WIN CONDITIONS
------------------------------------------------------------
10.1 Landing on Ithaca

Immediate win for current player.

10.2 Sea Deck Depletion

If deck is empty:

Finish round

Farthest ship wins

Ties → shared win

------------------------------------------------------------
11. IMPLEMENTATION REQUIREMENTS FOR CODEX
------------------------------------------------------------

Codex must build:

11.1 applyMove()

Pure reducer applying a single move.

11.2 getLegalMoves()

Moves allowed given current state.

11.3 advanceTurn()

Switch currentPlayer modulo N.

11.4 movePlayerStep()

Moves 1 tile; extends path if necessary; triggers tile if final step.

11.5 applyTileEffect(tile, state, playerId)

Handles all Epic rules.

11.6 Serialization
serializeGameState()
deserializeGameState()

11.7 Test suites

Add tests under /src/game/tests/:

tile effect tests

path extension tests

shipwreck tests

Sirens forced turn tests

Cyclops rescue tests

Sun God’s Cattle backtracking

Circe jump

Full-turn tests

------------------------------------------------------------
12. USER INTERFACE SPECIFICATION
------------------------------------------------------------

The engine now supports two complementary UI-oriented surfaces:

- A deterministic, text-based auditing UI for console review that renders GameState summaries (current player, actions remaining, epic clock, deck counts, player status flags, path occupancy, and optional legal moves) and exposes a demo entry point that starts a 2-player game, begins a turn, and prints the snapshot to stdout.

- A formal UI interaction contract that does **not** change any game rules. This supplement defines what the UI needs from the engine, how commands are expressed, and how to project a render-friendly view of state. All structures are additive and must never override the gameplay rules defined elsewhere.

UI & INTERACTION LAYER SPEC (SUPPLEMENTAL — DOES NOT MODIFY GAME RULES)
-----------------------------------------------------------------------

This section defines how the future user interface will interact with the game logic. Codex must treat these instructions as UI-only and must not alter or reinterpret the existing game rules, move definitions, or core engine behavior defined elsewhere.

These UI instructions only define:

- What information the UI needs from the logic layer
- How the UI will send commands to the logic layer
- What shape the GameView projection takes
- What inputs a user may provide
- How the UI should interpret and present state

No gameplay mechanics may be changed in this section.

12.1 Purpose of this UI spec

Codex must provide an abstraction layer between the game engine and any future UI (React, CLI, mobile, etc.). This layer must not include any UI code itself, but must provide clean, typed APIs that the UI can consume.

The UI:
- Runs in a local browser on a laptop.
- Presents a minimal digital boardgame layout.
- Has no hidden information or pass-the-device screens.
- Shows the full journey path at all times (no scrolling).
- Uses an action bar and tile clicks to select actions.
- Uses a side panel for epic explanations (no modals).

12.2 Board representation for UI

Codex must make the logic engine capable of producing a "view model" that the UI can render easily.

UI requires:

- Full path of tiles (index, type, epic name if applicable)
- Player tokens on tiles
- Current player highlight
- Damage and action counts
- Currently active epic information
- Optional peek information (when rules require it)
- Game-over summary

Codex must not add or modify game mechanics to fulfill this.

12.3 UI <-> engine contract (strict)

The UI may only interact with the engine through UiCommand objects.

export type UiCommand =
  | { type: "START_GAME"; playerNames: string[] }
  | {
      type: "CHOOSE_CORE_ACTION";
      playerId: PlayerId;
      action: "DRAW_SEA_CARD" | "REPAIR_SHIP" | "END_TURN";
    }
  | {
      type: "RESOLVE_AEOLUS_MOVE";
      playerId: PlayerId;
      tilesToMove: 0 | 1 | 2 | 3;
    }
  | {
      type: "ACKNOWLEDGE_EPIC";
      playerId: PlayerId;
      epicId: string;
    };

Codex must interpret these purely as UI commands, not game rules. Game logic remains defined elsewhere.

12.4 GameView projection

Codex must provide the UI with a derived view of the internal GameState. This projection must not change the underlying GameState shape.

export interface GameView {
  state: GameState;
  currentPlayerId: PlayerId;
  actionsRemaining: number;
  damageByPlayer: Record<PlayerId, number>;

  tiles: BoardTileView[];

  activeEpic?: {
    id: string;
    name: string;
    description: string;     // UI-friendly text
    requiresChoice: boolean;
    allowedAeolusMoves?: (0|1|2|3)[];
  };

  upcomingEpicPeek?: {
    tiles: EpicPreviewTile[];
  };

  gameOver?: {
    winnerPlayerId: PlayerId;
  };
}

export interface BoardTileView {
  id: string;
  index: number;
  type: "SEA" | "EPIC" | "START" | "ITHACA";
  epicName?: string;
  players: PlayerId[];
}

export interface EpicPreviewTile {
  id: string;
  index: number;
  name: string;
}

Codex must keep GameView a pure, derived representation that does not alter rules.

12.5 UI behavior requirements (no rule changes)

Codex must support (but not implement UI code for):

- Full horizontal board display
- Colored circular player tokens
- Tile click actions when required by commands
- Big action buttons in an action bar
- A static epic information panel (no modals)
- No history logs are required
- No hidden information
- No pass-device screens

These requirements influence only the shape of GameView and legal UI commands.

12.6 Engine API surface

Codex must expose the following engine API without altering the engine’s internal rules:

interface GameEngineAPI {
  initGame(playerNames: string[]): GameState;
  getView(state: GameState): GameView;
  getLegalCommands(state: GameState, playerId: PlayerId): UiCommand[];
  applyCommand(state: GameState, command: UiCommand): GameState;
}

Codex must not modify game rules to satisfy UI needs.

12.7 Modularity & safety requirements

- This UI section shall never override or reinterpret gameplay.
- All UI structures must be additive / supportive only.
- No game logic may depend on UI layout choices.
- No references to browser APIs, React, DOM, or rendering logic may appear in /src/game.
- All UI-related code must remain in a separate folder if later implemented.

------------------------------------------------------------
13. EXPANSION-FRIENDLINESS
------------------------------------------------------------

Codex must structure data so future expansions can add:

new Epic tiles

new Sea cards

alternative Epic Clock pacing

difficulty modes

branching journey paths

------------------------------------------------------------
14. PRIMARY CODING STANDARD
------------------------------------------------------------

Codex must always:

Prefer pure functions

Avoid state mutation

Use strong types

Ensure determinism

Keep logic modular

Ensure each file has a single purpose

------------------------------------------------------------
15. WHAT CODEX SHOULD DO NEXT
------------------------------------------------------------

When asked:

“Generate starter files” → Codex creates the entire directory with empty or template logic.

“Implement tile effects” → Codex fills in reducers for Epic tiles.

“Implement movement logic” → Codex creates step-by-step movement functions.

“Implement Sea Deck” → Codex generates card definitions and behavior.

“Add tests” → Codex generates test files in /src/game/tests/.

“Refactor” → Codex makes targeted edits while preserving architecture.