import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PLACES, ICONS } from "../trains/lib/places.js";
import { parseSprite, PALETTE } from "../trains/lib/eggs.js";
import { project } from "../trains/lib/route.js";

const network = JSON.parse(readFileSync(new URL("../trains/data/network.json", import.meta.url)));

test("icons are 7 by 7 and only use known colours", () => {
  for (const [name, rows] of Object.entries(ICONS)) {
    const s = parseSprite(rows);
    assert.equal(s.w, 7, name);
    assert.equal(s.h, 7, name);
    assert.ok(rows.every((r) => r.length === 7), `${name} rows`);
    for (const [, , ch] of s.pixels) assert.ok(PALETTE[ch], `${name} uses unknown colour ${ch}`);
  }
});

test("every landmark has an icon, a tier and a spot on the map", () => {
  const xs = network.stations.map((s) => s.x);
  const ys = network.stations.map((s) => s.y);
  const [minX, maxX, minY, maxY] = [Math.min(...xs) - 3000, Math.max(...xs) + 3000, Math.min(...ys) - 3000, Math.max(...ys) + 3000];
  assert.equal(new Set(PLACES.map((p) => p.label)).size, PLACES.length, "no duplicates");
  for (const p of PLACES) {
    assert.ok(ICONS[p.icon], `${p.label} icon ${p.icon}`);
    assert.ok(p.tier === 1 || p.tier === 2, `${p.label} tier`);
    const { x, y } = project(p.lat, p.lon, network.origin);
    assert.ok(x >= minX && x <= maxX && y >= minY && y <= maxY, `${p.label} is on the map`);
  }
});

test("landmarks are spread across the city, not bunched downtown", () => {
  const loop = project(41.8819, -87.6278, network.origin); // State and Madison
  const near = PLACES.filter((p) => {
    const { x, y } = project(p.lat, p.lon, network.origin);
    return Math.hypot(x - loop.x, y - loop.y) < 3000;
  });
  assert.ok(near.length <= PLACES.length / 3, `${near.length} of ${PLACES.length} within 3 km of the Loop`);
  // Downtown ones mostly wait for a closer zoom.
  assert.ok(near.filter((p) => p.tier === 1).length <= 4, "few downtown places show city-wide");
  for (const area of [[42.06, -87.68], [41.79, -87.60], [41.98, -87.90]]) {
    const c = project(area[0], area[1], network.origin);
    assert.ok(PLACES.some((p) => { const q = project(p.lat, p.lon, network.origin); return Math.hypot(q.x - c.x, q.y - c.y) < 4000; }), `something near ${area}`);
  }
});
