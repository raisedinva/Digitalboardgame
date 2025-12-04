import assert from "assert";
import { createGameState } from "../gameState";
import { applyTileEffect, movePlayerStep, applyMove, beginTurn, getLegalMoves } from "../reducers";
import { extendPath } from "../epicClock";
import { createEpicStack } from "../tiles";
import { baseSeaDeck } from "../seaDeck";
import { renderStateSummary } from "../../ui/render";
import { gameEngineApi } from "../../ui/api";
import { projectGameView } from "../../ui/viewModel";

const state = createGameState(2, 123);

// Enforces player count bounds
{
  let lowThrew = false;
  try {
    createGameState(1, 99);
  } catch (error) {
    lowThrew = (error as Error).message.includes("between 2 and 4");
  }
  assert.strictEqual(lowThrew, true);

  let highThrew = false;
  try {
    createGameState(5, 99);
  } catch (error) {
    highThrew = (error as Error).message.includes("between 2 and 4");
  }
  assert.strictEqual(highThrew, true);
}

// Safe Harbor repairs damage
{
  let working = extendPath(state);
  working = extendPath(working);
  working = extendPath(working); // draw epic safe_harbor
  const player = { ...working.players[0], damage: 2 };
  const patched = { ...working, players: [player, working.players[1]] };
  const result = applyTileEffect(working.path[3], patched, 0, {});
  assert.strictEqual(result.state.players[0].damage, 0);
}

// Cyclops rescue clears stuck flag
{
  let working = createGameState(2, 1);
  const epicStack = createEpicStack();
  const cyclopsTile = epicStack.find((tile) => tile.epicId === "cyclops")!;
  const reorderedStack = [cyclopsTile, ...epicStack.filter((tile) => tile.epicId !== "cyclops")];
  working = { ...working, epicStack: reorderedStack };
  working = extendPath(working);
  working = extendPath(working);
  working = extendPath(working); // draw cyclops
  const players = [
    { ...working.players[0], position: 2 },
    { ...working.players[1], position: 3, stuckAtCyclops: true },
  ];
  working = { ...working, players };
  working = movePlayerStep(working, 0, 1);
  assert.strictEqual(working.players[0].stuckAtCyclops, false);
  assert.strictEqual(working.players[1].stuckAtCyclops, false);
}

// Sirens forces actions and sets peek flag
{
  let working = createGameState(2, 2);
  const epicStack = createEpicStack();
  const sirensTile = epicStack.find((tile) => tile.epicId === "sirens")!;
  const reorderedStack = [sirensTile, ...epicStack.filter((tile) => tile.epicId !== "sirens")];
  working = { ...working, epicStack: reorderedStack, epicClock: 2 };
  working = extendPath(working);
  const effect = applyTileEffect(working.path[1], working, 0, {});
  assert.strictEqual(effect.state.players[0].sirensActive, true);
  const turn = beginTurn({ ...effect.state, actionsRemaining: 0 });
  const afterMove = applyMove(turn.state, { name: "repair" });
  const afterSecond = applyMove(afterMove, { name: "repair" });
  const afterThird = applyMove(afterSecond, { name: "repair" });
  const afterFourth = applyMove(afterThird, { name: "repair" });
  const afterFifth = applyMove(afterFourth, { name: "repair" });
  assert.strictEqual(afterFifth.players[0].sirensActive, false);
}

// Charted Course skips the next epic effect
{
  const chartedCourse = baseSeaDeck.find((card) => card.advanceToNextEpic)!;
  let working = createGameState(2, 3);
  const epicStack = createEpicStack();
  const soldier = epicStack.find((tile) => tile.epicId === "soldier_attack")!;
  const reorderedStack = [soldier, ...epicStack.filter((tile) => tile.epicId !== "soldier_attack")];
  working = {
    ...working,
    epicStack: reorderedStack,
    seaDeck: [chartedCourse],
    seaDiscard: [],
  };
  const turn = beginTurn({ ...working, actionsRemaining: 0 });
  const afterDraw = applyMove(turn.state, { name: "draw_card" });
  assert.strictEqual(afterDraw.players[0].position, 3);
  assert.strictEqual(afterDraw.players[0].damage, 0);
}

// Sea deck reshuffles discard when empty
{
  const filler = { id: "filler", name: "Filler", move: 0, damage: 0 };
  const anchor = { id: "anchor", name: "Anchor", move: 0, damage: 0 };
  let working = createGameState(2, 9);
  working = {
    ...working,
    seaDeck: [],
    seaDiscard: [filler, anchor],
  };
  const turn = beginTurn({ ...working, actionsRemaining: 0 });
  const afterFirst = applyMove(turn.state, { name: "draw_card" });
  assert.strictEqual(afterFirst.seaDeck.length, 1);
  assert.strictEqual(afterFirst.seaDiscard.length, 1);

  const afterSecond = applyMove(afterFirst, { name: "draw_card" });
  assert.strictEqual(afterSecond.seaDeck.length, 0);
  assert.strictEqual(afterSecond.seaDiscard.length, 2);

  const afterThird = applyMove(afterSecond, { name: "draw_card" });
  assert.strictEqual(afterThird.seaDeck.length, 1);
  assert.strictEqual(afterThird.seaDiscard.length, 1);
}

// Legal moves include draw when discard will reshuffle
{
  const anchor = { id: "anchor", name: "Anchor", move: 0, damage: 0 };
  const working = {
    ...createGameState(2, 10),
    seaDeck: [],
    seaDiscard: [anchor],
  };
  const turn = beginTurn({ ...working, actionsRemaining: 0 });
  const legal = getLegalMoves(turn.state);
  assert.strictEqual(legal.includes("draw_card"), true);
}

// Drawing after a reshuffle still consumes an action
{
  const anchor = { id: "anchor", name: "Anchor", move: 0, damage: 0 };
  const working = {
    ...createGameState(2, 11),
    seaDeck: [],
    seaDiscard: [anchor],
  };
  const turn = beginTurn({ ...working, actionsRemaining: 0 });
  const afterDraw = applyMove(turn.state, { name: "draw_card" });
  assert.strictEqual(afterDraw.actionsRemaining, 4);
}

// Actions cannot be taken once none remain
{
  const turn = beginTurn(createGameState(2, 12));
  const damaged = {
    ...turn.state,
    players: [{ ...turn.state.players[0], damage: 1 }],
    actionsRemaining: 0,
  };
  const legal = getLegalMoves(damaged);
  assert.strictEqual(legal.length, 1);
  assert.strictEqual(legal[0], "end_turn");
  const afterAttempt = applyMove(damaged, { name: "repair" });
  assert.strictEqual(afterAttempt.players[0].damage, 1);
  assert.strictEqual(afterAttempt.actionsRemaining, 0);
}

// UI renderer surfaces core state details
{
  const turn = beginTurn(createGameState(2, 15));
  const rendered = renderStateSummary(turn.state, { includeLegalMoves: true });
  assert.strictEqual(rendered.includes("Current player: P1"), true);
  assert.strictEqual(rendered.includes("Actions remaining: 5"), true);
  assert.strictEqual(rendered.includes("Legal moves: draw_card"), true);
  assert.strictEqual(rendered.includes("Path:"), true);
}

// Game view projection exposes board, epic, and peek metadata
{
  let working = createGameState(2, 25);
  working = extendPath(working);
  working = extendPath(working);
  working = extendPath(working);
  const peekReady = {
    ...working,
    players: [
      { ...working.players[0], sirensPeekPending: true },
      working.players[1],
    ],
  };
  const view = projectGameView(peekReady);
  assert.strictEqual(view.tiles.length >= 4, true);
  assert.strictEqual(view.upcomingEpicPeek?.tiles[0].index, 3);
}

// UI command surface exposes Aeolus resolution choices
{
  let working = createGameState(2, 26);
  const epicStack = createEpicStack();
  const aeolusTile = epicStack.find((tile) => tile.epicId === "aeolus")!;
  const reordered = [aeolusTile, ...epicStack.filter((tile) => tile.epicId !== "aeolus")];
  working = { ...working, epicStack: reordered };
  working = extendPath(working);
  working = extendPath(working);
  working = extendPath(working);
  working = {
    ...working,
    currentPlayer: 0,
    actionsRemaining: 5,
    players: [
      { ...working.players[0], position: 3 },
      working.players[1],
    ],
  };
  const view = projectGameView(working);
  assert.strictEqual(view.activeEpic?.id, "aeolus");
  assert.strictEqual(view.activeEpic?.allowedAeolusMoves?.join(","), "0,1,2");
  const commands = gameEngineApi.getLegalCommands(working, 0);
  const aeolusCommands = commands.filter((command) => command.type === "RESOLVE_AEOLUS_MOVE");
  assert.strictEqual(aeolusCommands.length, 3);
  const afterChoice = gameEngineApi.applyCommand(working, {
    type: "RESOLVE_AEOLUS_MOVE",
    playerId: 0,
    tilesToMove: 1,
  });
  assert.strictEqual(afterChoice.players[0].position, 4);
}

// Engine API init command mirrors player count
{
  const starting = createGameState(2, 30);
  const restarted = gameEngineApi.applyCommand(starting, {
    type: "START_GAME",
    playerNames: ["Alpha", "Beta", "Gamma"],
  });
  assert.strictEqual(restarted.players.length, 3);
}

console.log("basic tests passed");
