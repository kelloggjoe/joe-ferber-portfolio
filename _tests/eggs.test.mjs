import { test } from "node:test";
import assert from "node:assert/strict";
import { SPRITES, parseSprite, greenRiver, holidaySeason, monsterPose, MONSTER_SECONDS, codeListener } from "../trains/lib/eggs.js";

test("every sprite is a clean rectangle", () => {
  for (const [name, frames] of Object.entries(SPRITES)) {
    for (const rows of frames) {
      const s = parseSprite(rows);
      assert.ok(rows.every((r) => r.length === s.w), `${name} rows are all ${s.w} wide`);
      assert.ok(s.pixels.length > 0, `${name} draws something`);
    }
  }
});

test("parseSprite keeps keyed pixels and skips gaps", () => {
  const s = parseSprite(["a.", ".b"]);
  assert.deepEqual(s, { w: 2, h: 2, pixels: [[0, 0, "a"], [1, 1, "b"]] });
});

test("the river runs green from the Saturday before St. Patrick's Day through the 17th", () => {
  // In 2026 the 17th is a Tuesday, so the dye goes in on Saturday the 14th.
  assert.equal(greenRiver({ y: 2026, m: 3, d: 13 }), false);
  assert.equal(greenRiver({ y: 2026, m: 3, d: 14 }), true);
  assert.equal(greenRiver({ y: 2026, m: 3, d: 17 }), true);
  assert.equal(greenRiver({ y: 2026, m: 3, d: 18 }), false);
  // When the 17th is itself a Saturday, that's the only day.
  assert.equal(greenRiver({ y: 2029, m: 3, d: 16 }), false);
  assert.equal(greenRiver({ y: 2029, m: 3, d: 17 }), true);
});

test("holiday trains run through December", () => {
  assert.equal(holidaySeason({ y: 2026, m: 11, d: 30 }), false);
  assert.equal(holidaySeason({ y: 2026, m: 12, d: 1 }), true);
  assert.equal(holidaySeason({ y: 2026, m: 12, d: 31 }), true);
});

test("the monster ripples, rises, waits, sinks and leaves", () => {
  const h = parseSprite(SPRITES.monster[0]).h;
  assert.equal(monsterPose(0.2).rows, 0, "only a ripple at first");
  assert.ok(monsterPose(0.2).foam >= 0, "foam shows");
  const rising = [1.0, 1.4, 1.8].map((t) => monsterPose(t).rows);
  assert.ok(rising[0] < rising[1] && rising[1] < rising[2], "rises a row at a time");
  assert.equal(monsterPose(3).rows, h, "fully up");
  assert.ok(monsterPose(5.6).rows < h, "sinking");
  assert.equal(monsterPose(MONSTER_SECONDS + 0.1).done, true);
});

test("codeListener fires on the full sequence only", () => {
  let hits = 0;
  const feed = codeListener(["a", "b", "a"], () => hits++);
  ["a", "b", "b", "a", "b", "a"].forEach(feed);
  assert.equal(hits, 1);
});
