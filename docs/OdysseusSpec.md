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
  advanceToNextEpic?: boolean; // jump without triggering epic effect
  skipEpicEffect?: boolean;    // reserved flag to clarify no landing trigger
}

4.5 PlayerState
interface PlayerState {
  playerId: number;
  position: number;
  damage: number;            // 0–3
  skipNextTurn: boolean;
  stuckAtCyclops: boolean;
  sirensActive: boolean;
  circeJumpPending?: boolean;
  sirensPeekPending?: boolean;
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

State detail: set circeJumpPending=true when landing; resolve the jump at the start of that player's next active turn before assigning actionsRemaining

6.7 Underworld

Move back 1 tile (trigger effect)

Peek at top 2 tiles of epicStack (do not reorder)

6.8 Sirens

sirensActive = true
On next turn:

Must take all 5 actions
After completing that turn without shipwreck:

Set sirensPeekPending=true; use resolveSirensPeek to reveal the next Epic tile (or Ithaca) ahead, extending path as needed

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

If draw is attempted while deck is empty but the discard pile has cards → reshuffle discard to refresh the deck, then draw

If deck and discard are empty → draw_card is not allowed

Special sea card: Charted Course

advanceToNextEpic=true, skipEpicEffect=true

Move the current player directly to the next Epic tile ahead (or Ithaca)

Do not trigger the destination tile effect

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
12. EXPANSION-FRIENDLINESS
------------------------------------------------------------

Codex must structure data so future expansions can add:

new Epic tiles

new Sea cards

alternative Epic Clock pacing

difficulty modes

branching journey paths

------------------------------------------------------------
13. PRIMARY CODING STANDARD
------------------------------------------------------------

Codex must always:

Prefer pure functions

Avoid state mutation

Use strong types

Ensure determinism

Keep logic modular

Ensure each file has a single purpose

------------------------------------------------------------
14. WHAT CODEX SHOULD DO NEXT
------------------------------------------------------------

When asked:

“Generate starter files” → Codex creates the entire directory with empty or template logic.

“Implement tile effects” → Codex fills in reducers for Epic tiles.

“Implement movement logic” → Codex creates step-by-step movement functions.

“Implement Sea Deck” → Codex generates card definitions and behavior.

“Add tests” → Codex generates test files in /src/game/tests/.

“Refactor” → Codex makes targeted edits while preserving architecture.