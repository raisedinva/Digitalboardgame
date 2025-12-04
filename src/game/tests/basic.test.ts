import assert from "assert";
import { createGameState } from "../gameState";
import { applyTileEffect, movePlayerStep, applyMove, beginTurn } from "../reducers";
import { extendPath } from "../epicClock";
import { createEpicStack } from "../tiles";
import { baseSeaDeck } from "../seaDeck";

const state = createGameState(2, 123);

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
  let working = createGameState(1, 2);
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
  let working = createGameState(1, 3);
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
  let working = createGameState(1, 9);
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

console.log("basic tests passed");
