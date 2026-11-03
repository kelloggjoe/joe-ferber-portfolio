import { test } from "node:test";
import assert from "node:assert/strict";
import { sunElevation, skyPhase } from "../trains/lib/sky.js";
import { toggleFavorite, MAX_FAVORITES } from "../trains/lib/favorites.js";

const CHICAGO = [41.88, -87.63];

test("the sun is high over Chicago at midsummer noon and below the horizon at midnight", () => {
  // Solar noon in Chicago is about 12:50 CDT, 17:50 UTC.
  const noon = sunElevation(new Date(Date.UTC(2026, 5, 21, 17, 50)), ...CHICAGO);
  assert.ok(noon > 69 && noon < 73, `noon ${noon}`);
  const midnight = sunElevation(new Date(Date.UTC(2026, 5, 22, 5, 50)), ...CHICAGO);
  assert.ok(midnight < -20, `midnight ${midnight}`);
});

test("sky phases follow the sun", () => {
  assert.equal(skyPhase(30), "day");
  assert.equal(skyPhase(2), "dusk");
  assert.equal(skyPhase(-4), "dusk");
  assert.equal(skyPhase(-10), "night");
  // 7 pm in Chicago on 2 November 2026 is well after sunset.
  assert.equal(skyPhase(sunElevation(new Date(Date.UTC(2026, 10, 3, 1, 0)), ...CHICAGO)), "night");
  // 10 am the same day is daytime.
  assert.equal(skyPhase(sunElevation(new Date(Date.UTC(2026, 10, 2, 16, 0)), ...CHICAGO)), "day");
});

test("toggleFavorite adds to the front, removes on a second tap, and caps the list", () => {
  let favs = [];
  favs = toggleFavorite(favs, { line: "p", station: "40400" });
  favs = toggleFavorite(favs, { line: "red", station: "41220" });
  assert.deepEqual(favs.map((f) => f.station), ["41220", "40400"]);
  favs = toggleFavorite(favs, { line: "p", station: "40400" });
  assert.deepEqual(favs.map((f) => f.station), ["41220"]);
  for (let i = 0; i < 10; i++) favs = toggleFavorite(favs, { line: "red", station: String(40000 + i) });
  assert.equal(favs.length, MAX_FAVORITES);
});
