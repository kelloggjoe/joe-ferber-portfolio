import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { project, buildRoute, pointAt } from "../trains/lib/route.js";
import { makeTimetable, positionAt, sampleTrains, TRAIN_COUNTS } from "../trains/lib/sim.js";
import { parsePositions } from "../trains/lib/cta.js";

const network = JSON.parse(readFileSync(new URL("../trains/data/network.json", import.meta.url)));
const routes = network.routes.map(buildRoute);

test("project puts the origin at zero with y growing south", () => {
  const [lat, lon] = network.origin;
  assert.deepEqual(project(lat, lon, network.origin), { x: 0, y: 0 });
  assert.ok(project(lat + 0.01, lon, network.origin).y < 0);
  assert.ok(project(lat, lon + 0.01, network.origin).x > 0);
});

test("pointAt walks a route by distance and wraps around", () => {
  const r = buildRoute({ line: "red", pts: [0, 0, 100, 0, 100, 100], stops: [], ends: ["A", "B"], turn: 100 });
  assert.equal(r.length, 200);
  assert.deepEqual(pick(pointAt(r, 50)), { x: 50, y: 0 });
  assert.deepEqual(pick(pointAt(r, 150)), { x: 100, y: 50 });
  assert.deepEqual(pick(pointAt(r, 250)), { x: 50, y: 0 });
  assert.deepEqual(pick(pointAt(r, -50)), { x: 100, y: 50 });
});

test("timetable dwells at stops and advances between them", () => {
  const r = routes.find((x) => x.line === "y");
  const tt = makeTimetable(r);
  assert.ok(tt.period > 0);
  const first = positionAt(tt, 0).s;
  assert.equal(first, tt.legs[0].s0);
  assert.equal(positionAt(tt, 5).s, first, "still dwelling at the terminal after 5 s");
  const legEnd = tt.legs[0].t0 + tt.legs[0].dwell + tt.legs[0].travel;
  assert.ok(Math.abs(positionAt(tt, legEnd - 0.001).s - tt.legs[0].s1) < 1);
  assert.equal(positionAt(tt, tt.period + 5).s, first, "wraps every period");
});

test("sampleTrains is deterministic and fills every line", () => {
  const now = Date.UTC(2026, 10, 2, 18, 0, 0);
  const a = sampleTrains(routes, network.stations, now);
  const b = sampleTrains(routes, network.stations, now);
  assert.deepEqual(a, b);
  for (const [line, n] of Object.entries(TRAIN_COUNTS)) {
    assert.equal(a.filter((t) => t.line === line).length, n, line);
  }
  assert.equal(new Set(a.map((t) => t.id)).size, a.length, "ids are unique");
});

test("sample trains move over a minute and carry signs", () => {
  const now = Date.UTC(2026, 10, 2, 18, 0, 0);
  const a = sampleTrains(routes, network.stations, now);
  const b = sampleTrains(routes, network.stations, now + 60_000);
  const moved = a.filter((t, i) => Math.hypot(t.x - b[i].x, t.y - b[i].y) > 50).length;
  assert.ok(moved > a.length * 0.6, `only ${moved} of ${a.length} moved`);
  for (const t of a) {
    assert.ok(t.dest && t.next, `${t.id} has a destination and next stop`);
  }
});

test("only trains close to their next stop count as approaching", () => {
  const trains = sampleTrains(routes, network.stations, Date.UTC(2026, 10, 2, 18, 0, 0));
  const share = trains.filter((t) => t.approaching).length / trains.length;
  assert.ok(share > 0 && share < 0.4, `${Math.round(share * 100)}% approaching`);
});

test("destination flips to the home terminal after the turn point", () => {
  const r = routes.find((x) => x.line === "red");
  const tt = makeTimetable(r);
  const out = sampleTrains([r], network.stations, 0, { red: 1 }, { phase: () => 0 })[0];
  assert.equal(out.dest, "95th/Dan Ryan");
  const turnLeg = tt.legs.find((l) => l.s0 >= r.turn);
  const back = sampleTrains([r], network.stations, (turnLeg.t0 + turnLeg.dwell + 30) * 1000, { red: 1 }, { phase: () => 0 })[0];
  assert.equal(back.dest, "Howard");
});

test("parsePositions normalises the CTA feed", () => {
  const feed = {
    ctatt: {
      errCd: "0",
      route: [
        { "@name": "org", train: { rn: "712", destNm: "Loop", nextStaNm: "Halsted", lat: "41.85", lon: "-87.65", heading: "45", isApp: "1", isDly: "0" } },
        { "@name": "red", train: [
          { rn: "811", destNm: "Howard", nextStaNm: "Grand", lat: "41.89", lon: "-87.628", heading: "358", isApp: "0", isDly: "1" },
          { rn: "812", destNm: "95th/Dan Ryan", nextStaNm: "Lake", lat: null, lon: null, heading: "180", isApp: "0", isDly: "0" },
        ] },
        { "@name": "pink" },
      ],
    },
  };
  const trains = parsePositions(feed, network.origin);
  assert.equal(trains.length, 2, "drops trains with no position");
  assert.equal(trains[0].line, "o");
  assert.equal(trains[0].approaching, true);
  assert.equal(trains[1].id, "red-811");
  assert.equal(trains[1].delayed, true);
  assert.ok(trains[1].y < 0, "projected north of the origin");
});

test("parsePositions surfaces API errors", () => {
  assert.throws(() => parsePositions({ ctatt: { errCd: "101", errNm: "Invalid API key" } }, network.origin), /Invalid API key/);
});

function pick(p) {
  return { x: Math.round(p.x), y: Math.round(p.y) };
}
