import { startGame, startTurn } from "../game/engine";
import { renderStateSummary } from "./render";

const game = startGame(2, 2024);
const { state, skipped } = startTurn(game);
const heading = skipped ? "Turn skipped" : "Turn started";
console.log(`${heading}\n--------------`);
console.log(renderStateSummary(state, { includeLegalMoves: true }));
