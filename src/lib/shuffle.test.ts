import assert from "node:assert/strict";
import { test } from "node:test";
import { shuffle } from "./text";

test("shuffle spreads the first item evenly across positions", () => {
  const positions = [0, 0, 0, 0];
  const seeds = 40_000;
  for (let seed = 1; seed <= seeds; seed++) {
    const out = shuffle(["a", "b", "c", "d"], seed);
    positions[out.indexOf("a")]++;
  }
  for (const [i, n] of positions.entries()) {
    const share = n / seeds;
    assert.ok(Math.abs(share - 0.25) < 0.0125, `position ${i + 1} got ${(share * 100).toFixed(1)}%`);
  }
});
