import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { STATION_PLACES, SPOTS, ICONS, resolvePlaces } from "../trains/lib/places.js";
import { parseSprite, PALETTE } from "../trains/lib/eggs.js";

const network = JSON.parse(readFileSync(new URL("../trains/data/network.json", import.meta.url)));

test("every station detail points at exactly one station", () => {
  const placed = resolvePlaces(STATION_PLACES, network.stations);
  assert.equal(placed.length, STATION_PLACES.length);
  assert.equal(new Set(placed.map((p) => p.station.id)).size, placed.length, "no station gets two");
});

test("about two thirds of stations have something", () => {
  const share = STATION_PLACES.length / network.stations.length;
  assert.ok(share >= 0.6, `${Math.round(share * 100)}% covered`);
});

test("icons are 7 by 7 and only use known colours", () => {
  for (const [name, rows] of Object.entries(ICONS)) {
    const s = parseSprite(rows);
    assert.equal(s.w, 7, name);
    assert.equal(s.h, 7, name);
    assert.ok(rows.every((r) => r.length === 7), `${name} rows`);
    for (const [, , ch] of s.pixels) assert.ok(PALETTE[ch], `${name} uses unknown colour ${ch}`);
  }
  for (const p of [...STATION_PLACES, ...SPOTS]) assert.ok(ICONS[p.icon], `${p.label} has icon ${p.icon}`);
});
