// Sample trains for when there is no live feed. Every train follows a
// timetable derived from the wall clock, so two visitors looking at the
// same moment see the same trains, and a reload picks up where it left off.

import { pointAt } from "./route.js";

// Roughly a weekday evening's service.
export const TRAIN_COUNTS = { red: 24, blue: 22, brn: 14, g: 14, o: 9, p: 6, pnk: 8, y: 2 };

// CTA run numbers sit in a block per line.
const RUN_BASE = { red: 801, blue: 101, brn: 401, g: 1, o: 701, p: 501, pnk: 301, y: 591 };

const CRUISE = 14; // m/s between stations, about 31 mph
const DWELL = 22; // s at an ordinary stop
const TERMINAL_DWELL = 150; // s laying over at either end

export function makeTimetable(route) {
  const stops = route.stops.slice();
  // Round trips end where they start; the closing stop is the opening one.
  if (stops.length > 1 && stops[stops.length - 1][1] === stops[0][1] && route.length - stops[stops.length - 1][0] < 400) {
    stops.pop();
  }
  const legs = [];
  let t = 0;
  for (let i = 0; i < stops.length; i++) {
    const s0 = stops[i][0];
    const s1 = i + 1 < stops.length ? stops[i + 1][0] : stops[0][0] + route.length;
    const atEnd = i === 0 || Math.abs(s0 - route.turn) < 400;
    const dwell = atEnd ? TERMINAL_DWELL : DWELL;
    // Accelerating and braking stretch the trip by about a fifth.
    const travel = ((s1 - s0) / CRUISE) * 1.2;
    legs.push({ s0, s1, stop: stops[i][1], next: stops[(i + 1) % stops.length][1], t0: t, dwell, travel });
    t += dwell + travel;
  }
  return { legs, period: t };
}

export function positionAt(tt, seconds) {
  const t = ((seconds % tt.period) + tt.period) % tt.period;
  let lo = 0;
  let hi = tt.legs.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (tt.legs[mid].t0 <= t) lo = mid;
    else hi = mid - 1;
  }
  const leg = tt.legs[lo];
  const into = t - leg.t0;
  if (into < leg.dwell) return { s: leg.s0, leg, moving: false };
  const u = (into - leg.dwell) / leg.travel;
  // Smoothstep: pull away slowly, cruise, brake into the platform.
  const eased = u * u * (3 - 2 * u);
  return { s: leg.s0 + (leg.s1 - leg.s0) * eased, leg, moving: true, left: leg.travel - (into - leg.dwell) };
}

export function sampleTrains(routes, stations, nowMs, counts = TRAIN_COUNTS, opts = {}) {
  const names = new Map(stations.map((s) => [s.id, s.name]));
  const seconds = nowMs / 1000;
  return fleet(routes, counts, opts).map(({ id, rn, line, route, tt, offset }) => {
    const pos = positionAt(tt, seconds + offset);
    const p = pointAt(route, pos.s);
    const s = ((pos.s % route.length) + route.length) % route.length;
    return {
      id,
      rn,
      line,
      x: p.x,
      y: p.y,
      angle: p.angle,
      next: names.get(pos.moving ? pos.leg.next : pos.leg.stop),
      dest: destAt(route, s),
      approaching: pos.moving && pos.left < 20,
      delayed: false,
    };
  });
}

// When each sample train on `line` next pulls into `stationId`, within the
// horizon, soonest first. Read straight off the same timetables as the map.
export function sampleArrivals(routes, stations, nowMs, stationId, line, horizon = 45 * 60, counts = TRAIN_COUNTS) {
  const seconds = nowMs / 1000;
  const out = [];
  for (const { id, rn, route, tt, offset } of fleet(routes, { [line]: counts[line] })) {
    const t = (((seconds + offset) % tt.period) + tt.period) % tt.period;
    for (const leg of tt.legs) {
      if (leg.stop !== stationId) continue;
      // Standing at the platform counts as due until the doors close.
      const since = (t - leg.t0 + tt.period) % tt.period;
      const inSec = since < leg.dwell ? 0 : tt.period - since;
      if (inSec > horizon) continue;
      out.push({ id, rn, line, inSec: Math.round(inSec), dest: destAt(route, leg.s0), scheduled: true });
    }
  }
  out.sort((a, b) => a.inSec - b.inSec);
  // One listing per train per pass, even if a stop sits on the route twice in quick succession.
  return out.filter((a, i) => !out.slice(0, i).some((b) => b.id === a.id && a.inSec - b.inSec < 90));
}

// What the front of the train says at distance s: the far end until it
// gets there, then home. Shared by the map and the arrivals board.
function destAt(route, s) {
  return s < route.turn - 60 ? route.ends[1] : route.ends[0];
}

// Every sample train with its route, timetable and place in the cycle.
function fleet(routes, counts, opts = {}) {
  const phase = opts.phase || ((line, k) => hash(`${line}:${k}`));
  const trains = [];
  for (const [line, total] of Object.entries(counts)) {
    const lineRoutes = routes.filter((r) => r.line === line);
    if (!lineRoutes.length) continue;
    const perRoute = Math.ceil(total / lineRoutes.length);
    for (let k = 0; k < total; k++) {
      const route = lineRoutes[k % lineRoutes.length];
      const tt = timetableFor(route);
      // Spread the line's trains evenly, then nudge each so headways vary.
      const slot = Math.floor(k / lineRoutes.length);
      const offset = ((slot + phase(line, k) * 0.6) / perRoute) * tt.period;
      const rn = String(RUN_BASE[line] + k).padStart(3, "0");
      trains.push({ id: `${line}-${RUN_BASE[line] + k}`, rn, line, route, tt, offset });
    }
  }
  return trains;
}

const timetables = new WeakMap();
function timetableFor(route) {
  let tt = timetables.get(route);
  if (!tt) timetables.set(route, (tt = makeTimetable(route)));
  return tt;
}

// Stable 0..1 value per string.
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}
