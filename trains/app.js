import { buildRoute, project } from "./lib/route.js";
import {
  SPRITES, PALETTE, LANDMARKS, NAVY_PIER, RIVER, BOATS, BOAT_RANGE,
  parseSprite, chicagoDate, greenRiver, holidaySeason, monsterPose, codeListener,
} from "./lib/eggs.js";
import { sampleTrains, sampleArrivals } from "./lib/sim.js";
import { parsePositions, parseArrivals } from "./lib/cta.js";
import { ICONS, STATION_PLACES, SPOTS, resolvePlaces, tierOf } from "./lib/places.js";

const LINES = [
  ["red", "Red"], ["blue", "Blue"], ["brn", "Brown"], ["g", "Green"],
  ["o", "Orange"], ["p", "Purple"], ["pnk", "Pink"], ["y", "Yellow"],
].map(([code, name]) => ({ code, name }));
const LINE_ORDER = LINES.map((l) => l.code);
const LINE_NAME = Object.fromEntries(LINES.map((l) => [l.code, l.name]));

const FEED_URL = document.documentElement.dataset.feed;
const FEED_EVERY = 30_000;
const MILE = 1609;
// State St and Madison St, the zero lines of Chicago's address grid, in map meters.
const GRID_ORIGIN = { x: 10135, y: -221 };

const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d", { alpha: false });
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

const css = getComputedStyle(document.documentElement);
const color = (name) => css.getPropertyValue(name).trim();
const COLORS = {
  ground: rgb(color("--ground")),
  grid: rgb(color("--grid")),
  lakeA: rgb(color("--lake-a")),
  lakeB: rgb(color("--lake-b")),
  glint: rgb(color("--lake-glint")),
  shore: rgb(color("--shore")),
  station: rgb(color("--station")),
  ink: rgb(color("--ink")),
};
const LINE_RGB = Object.fromEntries(LINE_ORDER.map((c) => [c, rgb(color(`--line-${c}`))]));
COLORS.pier = rgb(color("--pier"));
COLORS.river = rgb(color("--river"));
COLORS.riverGreen = rgb(color("--river-green"));
const LAKE = new Set([COLORS.lakeA, COLORS.lakeB, COLORS.glint]);

const FRAMES = Object.fromEntries(Object.entries(SPRITES).map(([k, frames]) => [k, frames.map(parseSprite)]));
const ICON_FRAMES = Object.fromEntries(Object.entries(ICONS).map(([k, rows]) => [k, parseSprite(rows)]));
// Minor places start as a small plus in their icon's main colour.
const DOTS = Object.fromEntries(Object.entries(ICON_FRAMES).map(([k, sprite]) => {
  const counts = {};
  for (const [, , ch] of sprite.pixels) counts[ch] = (counts[ch] || 0) + 1;
  const main = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  return [k, parseSprite([`.${main}.`, `${main}${main}${main}`, `.${main}.`])];
}));
// Boats heading west face the other way.
FRAMES.boatWest = SPRITES.boat.map((rows) => parseSprite(rows.map((r) => [...r].reverse().join(""))));

// ?date=2026-03-14 previews the date-driven surprises.
const dateParam = new URLSearchParams(location.search).get("date");
const today = chicagoDate(dateParam ? new Date(`${dateParam}T12:00:00-06:00`) : new Date());
const SEASON = { green: greenRiver(today), holiday: holidaySeason(today) };
const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];

const state = {
  net: null,
  routes: [],
  segsByLine: {},
  bounds: null,
  view: { cx: 0, cy: 0, mpp: 100 },
  fitMpp: 100,
  fb: { w: 0, h: 0, scale: 3 },
  bg: null,
  bgDirty: true,
  hidden: new Set(),
  trains: [],
  drawn: [], // [{train, px, py}] from the last frame, for hit testing
  eggs: [], // [{x0, y0, x1, y1, label, note}] sprites drawn in the last frame
  water: null, // projected river and pier
  monster: { at: 0, x: 0, y: 0, next: 0 },
  places: [], // station details and standalone spots, in map meters
  // dataAt: when list was true; askedAt: last request; failedAt: last live failure.
  board: { open: false, line: "red", station: null, list: [], dataAt: 0, askedAt: 0, live: false, failedAt: 0, rows: [] },
  hover: null,
  selected: null,
  live: { prev: new Map(), curr: new Map(), at: 0, ok: false, failed: false },
};

init().catch((err) => {
  document.getElementById("note").textContent = "The map data didn’t load. Try refreshing the page.";
  console.error(err);
});

async function init() {
  const res = await fetch(`data/network.json?v=${document.documentElement.dataset.version}`);
  if (!res.ok) throw new Error(`network.json ${res.status}`);
  const net = await res.json();
  state.net = net;
  state.routes = net.routes.map(buildRoute);
  indexTracks(net);
  const flat = (path) => path.flatMap(([lat, lon]) => { const p = project(lat, lon, net.origin); return [p.x, p.y]; });
  state.water = { river: RIVER.map(flat), pier: flat(NAVY_PIER) };
  state.places = [
    ...resolvePlaces(STATION_PLACES, net.stations).map((p) => ({ ...p, x: p.station.x, y: p.station.y, beside: true })),
    ...SPOTS.map((p) => ({ ...p, ...project(p.lat, p.lon, net.origin) })),
  ].map((p) => ({ ...p, tier: tierOf(p) })).sort((a, b) => a.tier - b.tier);
  state.monster.next = performance.now() + 9000;
  const summon = codeListener(KONAMI, () => spawnMonster(performance.now(), true));
  addEventListener("keydown", (e) => summon(e.key.toLowerCase()));
  buildLegend();
  buildBoard();
  bindInput();
  resize();
  fit();
  addEventListener("resize", () => { resize(); clampView(); });
  if (FEED_URL) pollFeed();
  tickClock();
  setInterval(tickClock, 15_000);
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------------------
// Network prep

function indexTracks(net) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const code of LINE_ORDER) state.segsByLine[code] = [];
  for (const t of net.tracks) {
    const lines = LINE_ORDER.filter((c) => t.l.includes(c));
    // Lines sharing track run side by side, one map pixel apart.
    // Whole-pixel offsets, so two lanes never round onto the same pixel on a diagonal.
    t.lanes = lines.map((code, i) => ({ code, off: i - Math.floor((lines.length - 1) / 2) }));
    for (let i = 0; i < t.pts.length; i += 2) {
      minX = Math.min(minX, t.pts[i]); maxX = Math.max(maxX, t.pts[i]);
      minY = Math.min(minY, t.pts[i + 1]); maxY = Math.max(maxY, t.pts[i + 1]);
    }
    for (const lane of t.lanes) {
      for (let i = 0; i + 3 < t.pts.length; i += 2) {
        state.segsByLine[lane.code].push({ ax: t.pts[i], ay: t.pts[i + 1], bx: t.pts[i + 2], by: t.pts[i + 3], off: lane.off });
      }
    }
  }
  state.bounds = { minX, minY, maxX, maxY };
}

// ---------------------------------------------------------------------------
// View

function resize() {
  const dpr = devicePixelRatio || 1;
  const cssPx = 2;
  const devPx = Math.max(1, Math.round(cssPx * dpr));
  const w = Math.ceil((innerWidth * dpr) / devPx);
  const h = Math.ceil((innerHeight * dpr) / devPx);
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = `${(w * devPx) / dpr}px`;
  canvas.style.height = `${(h * devPx) / dpr}px`;
  const oldW = state.fb.w;
  state.fb = { w, h, scale: devPx / dpr };
  state.bg = ctx.createImageData(w, h);
  state.bgDirty = true;
  if (oldW) state.fitMpp = fitMpp();
}

function fitMpp() {
  const { minX, minY, maxX, maxY } = state.bounds;
  const { w, h } = state.fb;
  // Leave room for the header and legend on small screens.
  const usableH = innerWidth < 700 ? h * 0.72 : h * 0.9;
  return Math.max((maxX - minX) / (w * 0.9), (maxY - minY) / usableH);
}

function fit() {
  const { minX, minY, maxX, maxY } = state.bounds;
  state.fitMpp = fitMpp();
  const shiftDown = innerWidth < 700 ? state.fitMpp * state.fb.h * 0.02 : 0;
  setView((minX + maxX) / 2, (minY + maxY) / 2 - shiftDown, state.fitMpp);
}

function setView(cx, cy, mpp) {
  state.view = { cx, cy, mpp };
  clampView();
}

function clampView() {
  const v = state.view;
  const { minX, minY, maxX, maxY } = state.bounds;
  v.mpp = clampMpp(v.mpp);
  v.cx = Math.min(Math.max(v.cx, minX), maxX);
  v.cy = Math.min(Math.max(v.cy, minY), maxY);
  state.bgDirty = true;
}

function clampMpp(mpp) {
  return Math.min(Math.max(mpp, 4), state.fitMpp * 1.6);
}

function zoomAt(factor, fx = state.fb.w / 2, fy = state.fb.h / 2) {
  const before = toWorld(fx, fy);
  const mpp = clampMpp(state.view.mpp / factor);
  // Keep the point under the cursor fixed while zooming.
  setView(before.x - (fx - state.fb.w / 2) * mpp, before.y - (fy - state.fb.h / 2) * mpp, mpp);
}

function toPx(x, y) {
  const v = state.view;
  return [(x - v.cx) / v.mpp + state.fb.w / 2, (y - v.cy) / v.mpp + state.fb.h / 2];
}

function toWorld(px, py) {
  const v = state.view;
  return { x: (px - state.fb.w / 2) * v.mpp + v.cx, y: (py - state.fb.h / 2) * v.mpp + v.cy };
}

// ---------------------------------------------------------------------------
// Background: land, address grid, lake, track and stations, drawn into one
// pixel buffer and reused until the view changes.

function paintBackground() {
  const { w, h } = state.fb;
  const buf = new Uint32Array(state.bg.data.buffer);
  buf.fill(COLORS.ground);
  const v = state.view;
  // Integer world-pixel offset, so dither patterns stay put while panning.
  const ox = Math.round(v.cx / v.mpp - w / 2);
  const oy = Math.round(v.cy / v.mpp - h / 2);

  paintGrid(buf, w, h, ox, oy);
  paintLake(buf, w, h, ox, oy);
  paintWaterways(buf, w, h);
  const gap = laneGap();
  for (const t of state.net.tracks) {
    for (const lane of t.lanes) {
      const c = mix(LINE_RGB[lane.code], COLORS.ground, state.hidden.has(lane.code) ? 0.8 : 0.3);
      drawPolyline(buf, w, h, t.pts, lane.off * gap, c);
    }
  }
  paintStations(buf, w, h);
  state.bgBuf = buf;
  state.bgDirty = false;
}

function paintWaterways(buf, w, h) {
  const river = SEASON.green ? COLORS.riverGreen : COLORS.river;
  for (const path of state.water.river) {
    drawPolyline(buf, w, h, path, 0, river);
    if (state.view.mpp < 20) drawPolyline(buf, w, h, path, 1, river);
  }
  drawPolyline(buf, w, h, state.water.pier, 0, COLORS.pier);
  if (state.view.mpp < 60) drawPolyline(buf, w, h, state.water.pier, 1, COLORS.pier);
}

function paintGrid(buf, w, h, ox, oy) {
  // Chicago's mile streets (Madison, Roosevelt, North, ...) as dotted lines.
  const { minX, minY, maxX, maxY } = state.bounds;
  const [x0, y0] = toPx(minX - MILE, minY - MILE);
  const [x1, y1] = toPx(maxX + MILE, maxY + MILE);
  const kx0 = Math.ceil((minX - MILE - GRID_ORIGIN.x) / MILE);
  const kx1 = Math.floor((maxX + MILE - GRID_ORIGIN.x) / MILE);
  for (let k = kx0; k <= kx1; k++) {
    const px = Math.round(toPx(GRID_ORIGIN.x + k * MILE, 0)[0]);
    if (px < 0 || px >= w) continue;
    for (let py = Math.max(0, Math.round(y0)); py < Math.min(h, y1); py++) {
      if ((py + oy) % 3 === 0) buf[py * w + px] = COLORS.grid;
    }
  }
  const ky0 = Math.ceil((minY - MILE - GRID_ORIGIN.y) / MILE);
  const ky1 = Math.floor((maxY + MILE - GRID_ORIGIN.y) / MILE);
  for (let k = ky0; k <= ky1; k++) {
    const py = Math.round(toPx(0, GRID_ORIGIN.y + k * MILE)[1]);
    if (py < 0 || py >= h) continue;
    for (let px = Math.max(0, Math.round(x0)); px < Math.min(w, x1); px++) {
      if ((px + ox) % 3 === 0) buf[py * w + px] = COLORS.grid;
    }
  }
}

function paintLake(buf, w, h, ox, oy) {
  const ring = [];
  const lake = state.net.lake;
  for (let i = 0; i < lake.length; i += 2) ring.push(toPx(lake[i], lake[i + 1]));
  const xs = [];
  for (let y = 0; y < h; y++) {
    const sy = y + 0.5;
    xs.length = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xa, ya] = ring[i];
      const [xb, yb] = ring[j];
      if ((ya <= sy) !== (yb <= sy)) xs.push(xa + ((sy - ya) * (xb - xa)) / (yb - ya));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const from = Math.max(0, Math.ceil(xs[k]));
      const to = Math.min(w, Math.ceil(xs[k + 1]));
      const wy = y + oy;
      for (let x = from; x < to; x++) {
        const wx = x + ox;
        let c = (wx + wy) & 1 ? COLORS.lakeA : COLORS.lakeB;
        // Sparse wave crests: short dashes on a staggered lattice.
        const row = ((wy % 7) + 7) % 7;
        if (row === 0 && ((((wx + (Math.floor(wy / 7) * 5)) % 19) + 19) % 19) < 3) c = COLORS.glint;
        buf[y * w + x] = c;
      }
    }
  }
  // The shoreline is every lake vertex except the three that close it off out east.
  drawPolyline(buf, w, h, lake.slice(0, -6), 0, COLORS.shore);
}

// Close in, shared track splits into separate lanes and trains grow.
function laneGap() {
  return state.view.mpp < 40 ? 2 : 1;
}

function trainSize() {
  return state.view.mpp < 200 ? 3 : 2;
}

function paintStations(buf, w, h) {
  const big = state.view.mpp < 40;
  for (const s of state.net.stations) {
    if (stationHidden(s)) continue;
    const [fx, fy] = toPx(s.x, s.y);
    const px = Math.round(fx);
    const py = Math.round(fy);
    if (big) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          setPx(buf, w, h, px + dx, py + dy, dx === 0 && dy === 0 ? COLORS.ground : COLORS.station);
        }
      }
    } else {
      setPx(buf, w, h, px, py, COLORS.station);
    }
  }
}

function stationHidden(s) {
  return s.l.every((c) => state.hidden.has(c));
}

function drawPolyline(buf, w, h, pts, off, c) {
  let prev = null;
  for (let i = 0; i + 3 < pts.length; i += 2) {
    const [ax, ay] = toPx(pts[i], pts[i + 1]);
    const [bx, by] = toPx(pts[i + 2], pts[i + 3]);
    const len = Math.hypot(bx - ax, by - ay);
    if (len < 1e-6) continue;
    const nx = (-(by - ay) / len) * off;
    const ny = ((bx - ax) / len) * off;
    const x0 = Math.round(ax + nx), y0 = Math.round(ay + ny);
    const x1 = Math.round(bx + nx), y1 = Math.round(by + ny);
    if (prev && (prev[0] !== x0 || prev[1] !== y0)) bresenham(buf, w, h, prev[0], prev[1], x0, y0, c);
    bresenham(buf, w, h, x0, y0, x1, y1, c);
    prev = [x1, y1];
  }
}

function bresenham(buf, w, h, x0, y0, x1, y1, c) {
  // Skip segments entirely off screen.
  if ((x0 < 0 && x1 < 0) || (y0 < 0 && y1 < 0) || (x0 >= w && x1 >= w) || (y0 >= h && y1 >= h)) return;
  const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    setPx(buf, w, h, x0, y0, c);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

function setPx(buf, w, h, x, y, c) {
  if (x >= 0 && y >= 0 && x < w && y < h) buf[y * w + x] = c;
}

// ---------------------------------------------------------------------------
// Trains

function currentTrains(now) {
  if (state.live.ok) return liveTrains(now);
  const trains = sampleTrains(state.routes, state.net.stations, now);
  if (SEASON.holiday) {
    // One train per line gets the lights, the way the CTA Holiday Train does.
    const lit = new Set(["y"]);
    for (const t of trains) {
      if (!lit.has(t.line)) { t.holiday = true; lit.add(t.line); }
    }
  }
  return trains;
}

function liveTrains(now) {
  // Glide each train from its previous reported spot to its latest one.
  const { prev, curr, at } = state.live;
  const u = Math.min(1, (now - at) / FEED_EVERY);
  const out = [];
  for (const t of curr.values()) {
    const p = prev.get(t.id);
    out.push(p ? { ...t, x: p.x + (t.x - p.x) * u, y: p.y + (t.y - p.y) * u } : t);
  }
  return out;
}

function laneOffset(train) {
  // Find the nearest piece of this line's track and borrow its lane.
  let best = null;
  let bestD = Infinity;
  for (const s of state.segsByLine[train.line] || []) {
    const dx = s.bx - s.ax, dy = s.by - s.ay;
    const den = dx * dx + dy * dy || 1;
    const u = Math.max(0, Math.min(1, ((train.x - s.ax) * dx + (train.y - s.ay) * dy) / den));
    const d = Math.hypot(s.ax + u * dx - train.x, s.ay + u * dy - train.y);
    if (d < bestD) { bestD = d; best = s; }
  }
  if (!best || best.off === 0) return [0, 0];
  const len = Math.hypot(best.bx - best.ax, best.by - best.ay) || 1;
  const off = best.off * laneGap();
  return [(-(best.by - best.ay) / len) * off, ((best.bx - best.ax) / len) * off];
}

function drawTrains(now) {
  const { w, h } = state.fb;
  state.drawn = [];
  const blinkOn = reduceMotion.matches || Math.floor(now / 350) % 2 === 0;
  let selectedSpot = null;
  const size = trainSize();
  const half = size >> 1;
  for (const t of state.trains) {
    if (state.hidden.has(t.line)) continue;
    const [fx, fy] = toPx(t.x, t.y);
    if (fx < -6 || fy < -6 || fx > w + 6 || fy > h + 6) continue;
    const [ox, oy] = laneOffset(t);
    const px = Math.round(fx + ox);
    const py = Math.round(fy + oy);
    const base = t.holiday ? HOLIDAY_LIGHTS[Math.floor(now / 400 + px) % HOLIDAY_LIGHTS.length] : LINE_RGB[t.line];
    // Fading trail behind the train shows which way it is heading.
    const bx = -Math.cos(t.angle), by = -Math.sin(t.angle);
    [[0.45, 0], [0.65, 1], [0.82, 2]].forEach(([fade, k]) => {
      const d = size + k;
      ctx.fillStyle = css32(mix(base, COLORS.ground, fade));
      ctx.fillRect(Math.round(px + bx * d), Math.round(py + by * d), 1, 1);
    });
    ctx.fillStyle = css32(base);
    ctx.fillRect(px - half, py - half, size, size);
    state.drawn.push({ train: t, px, py });
    if (state.selected === t.id) selectedSpot = [px, py];
  }
  const b = state.board;
  if (b.open && b.station && blinkOn) {
    const s = state.net.stations.find((x) => x.id === b.station);
    const [sx, sy] = toPx(s.x, s.y);
    ring(Math.round(sx), Math.round(sy), 1, css32(LINE_RGB[b.line]));
  }
  if (selectedSpot && blinkOn) {
    ring(selectedSpot[0], selectedSpot[1], half, css32(COLORS.ink), size);
  }
}

// A one-pixel square ring, one pixel clear of a box `size` wide.
function ring(px, py, half, fill, size = half * 2 + 1) {
  const x0 = px - half - 2;
  const y0 = py - half - 2;
  const span = size + 4;
  ctx.fillStyle = fill;
  ctx.fillRect(x0, y0, span, 1);
  ctx.fillRect(x0, y0 + span - 1, span, 1);
  ctx.fillRect(x0, y0 + 1, 1, span - 2);
  ctx.fillRect(x0 + span - 1, y0 + 1, 1, span - 2);
}

// ---------------------------------------------------------------------------
// Landmarks, boats and the lake monster. Sprites keep their size at every
// zoom: one sprite pixel is one map pixel.

const HOLIDAY_LIGHTS = ["#ff4a4a", "#4be08a", "#ffd166"].map(rgb);

function drawSprite(sprite, px, py, k = 1, rows = sprite.h) {
  // Anchored at the bottom centre, k map pixels per sprite pixel. rows < h
  // shows only the top of the sprite, sitting on py, so things can rise
  // out of the water.
  const x0 = px - ((sprite.w * k) >> 1);
  const y0 = py - rows * k + 1;
  for (const [x, y, ch] of sprite.pixels) {
    if (y >= rows) continue;
    ctx.fillStyle = PALETTE[ch];
    ctx.fillRect(x0 + x * k, y0 + y * k, k, k);
  }
  return { x0, y0, x1: x0 + sprite.w * k - 1, y1: py };
}

// Close in, sprites double up so they read as characters, not specks.
function spriteScale() {
  return state.view.mpp < 60 ? 2 : 1;
}

function drawEggs(now) {
  const { w, h } = state.fb;
  const still = reduceMotion.matches;
  state.eggs = [];
  const onScreen = (px, py) => px > -24 && py > -24 && px < w + 24 && py < h + 24;
  const k = spriteScale();

  for (const l of LANDMARKS) {
    if (state.view.mpp > l.maxMpp) continue;
    const p = project(l.lat, l.lon, state.net.origin);
    const [fx, fy] = toPx(p.x, p.y);
    const px = Math.round(fx), py = Math.round(fy);
    if (!onScreen(px, py)) continue;
    const frames = FRAMES[l.sprite];
    const f = still || !l.every ? 0 : Math.floor(now / l.every) % frames.length;
    state.eggs.push({ ...drawSprite(frames[f], px, py, k), label: l.label, note: l.note });
  }

  const t = Date.now() / 1000;
  const [xa, xb] = BOAT_RANGE.map((lon) => project(41.9, lon, state.net.origin).x);
  for (const b of BOATS) {
    const start = project(b.lat, b.lon0, state.net.origin);
    const span = xb - xa;
    const x = xa + ((((start.x - xa + b.speed * t) % span) + span) % span);
    const [fx, fy] = toPx(x, start.y);
    const px = Math.round(fx);
    const py = Math.round(fy) + (still ? 0 : Math.floor(t / 1.3) % 2);
    if (!onScreen(px, py) || !isLake(px, py + 1)) continue;
    state.eggs.push({ ...drawSprite(FRAMES[b.speed < 0 ? "boatWest" : "boat"][0], px, py, k), label: "Sailboat" });
  }

  drawPlaces();
  drawMonster(now);
}

// Station details sit just east of their station; spots sit on their spot.
// Bigger places show from further out and grow sooner; neighbourhood signs
// stay a small marker until street level. Places are drawn most important
// first, and one that would land on another waits for a closer zoom.
function drawPlaces() {
  const mpp = state.view.mpp;
  const { w, h } = state.fb;
  const taken = [];
  for (const p of state.places) {
    const size = placeSize(p.tier, mpp);
    if (!size) continue;
    if (p.beside && stationHidden(p.station)) continue;
    const [fx, fy] = toPx(p.x, p.y);
    const px = Math.round(fx) + (p.beside ? (size === "dot" ? 4 : 7 * size) : 0);
    const py = Math.round(fy) + (size === "dot" ? 1 : 3 * size);
    if (px < -16 || py < -16 || px > w + 16 || py > h + 16) continue;
    const sprite = size === "dot" ? DOTS[p.icon] : ICON_FRAMES[p.icon];
    const k = size === "dot" ? 1 : size;
    const half = (sprite.w * k) >> 1;
    const box = { x0: px - half - 1, y0: py - sprite.h * k, x1: px + half + 1, y1: py + 1 };
    if (taken.some((b) => box.x0 < b.x1 && box.x1 > b.x0 && box.y0 < b.y1 && box.y1 > b.y0)) continue;
    taken.push(box);
    state.eggs.push({ ...drawSprite(sprite, px, py, k), label: p.label, note: p.note });
  }
}

// null (hidden), "dot", or a pixel scale for the full icon.
function placeSize(tier, mpp) {
  if (tier === 1) return mpp < 30 ? 2 : 1;
  if (tier === 2) return mpp < 12 ? 2 : mpp < 60 ? 1 : null;
  return mpp < 12 ? 1 : mpp < 40 ? "dot" : null;
}

function isLake(px, py) {
  const { w, h } = state.fb;
  return px >= 0 && py >= 0 && px < w && py < h && LAKE.has(state.bgBuf[py * w + px]);
}

function drawMonster(now) {
  const m = state.monster;
  if (!m.at) {
    if (now >= m.next) spawnMonster(now);
    if (!m.at) return;
  }
  const pose = monsterPose((now - m.at) / 1000);
  if (pose.done) {
    m.at = 0;
    m.next = now + 40_000 + Math.random() * 80_000;
    return;
  }
  const [fx, fy] = toPx(m.x, m.y);
  const px = Math.round(fx), py = Math.round(fy);
  if (pose.foam >= 0) drawSprite(FRAMES.foam[pose.foam], px, py + 2, 2);
  if (pose.rows > 0) {
    const box = drawSprite(FRAMES.monster[pose.blink ? 1 : 0], px, py, 2, pose.rows);
    state.eggs.push({ ...box, label: "Lake Michigan monster", note: "probably just a log" });
  }
}

// Surface somewhere in open water that's on screen and not under a panel.
function spawnMonster(now, eager = false) {
  const m = state.monster;
  if (m.at) return;
  const { w, h } = state.fb;
  const blocked = panelRects();
  const tries = eager ? 400 : 60;
  for (let i = 0; i < tries; i++) {
    // The monster is drawn at double size: 24 by 14 map pixels plus foam.
    const px = 14 + Math.floor(Math.random() * (w - 28));
    const py = 16 + Math.floor(Math.random() * (h - 20));
    if (blocked.some((r) => px + 14 > r.x0 && px - 14 < r.x1 && py + 4 > r.y0 && py - 16 < r.y1)) continue;
    let open = true;
    for (let y = py - 15; y <= py + 3 && open; y++) {
      for (let x = px - 13; x <= px + 13 && open; x++) open = isLake(x, y);
    }
    if (!open) continue;
    const at = toWorld(px, py);
    Object.assign(m, { at: now, x: at.x, y: at.y });
    return;
  }
  m.next = now + 15_000;
}

function panelRects() {
  const c = canvas.getBoundingClientRect();
  const k = state.fb.w / c.width;
  return [...document.querySelectorAll(".panel")].filter((el) => !el.hidden).map((el) => {
    const r = el.getBoundingClientRect();
    return { x0: (r.left - c.left) * k, y0: (r.top - c.top) * k, x1: (r.right - c.left) * k, y1: (r.bottom - c.top) * k };
  });
}

// ---------------------------------------------------------------------------
// Frame loop

let lastCounts = "";
function frame(now) {
  const wall = Date.now();
  state.trains = currentTrains(wall);
  if (state.bgDirty) paintBackground();
  ctx.putImageData(state.bg, 0, 0);
  drawEggs(now);
  drawTrains(now);
  updateCounts();
  updateCard();
  updateBoard(wall);
  requestAnimationFrame(frame);
}

function updateCounts() {
  const counts = Object.fromEntries(LINE_ORDER.map((c) => [c, 0]));
  for (const t of state.trains) counts[t.line]++;
  const key = LINE_ORDER.map((c) => counts[c]).join(",");
  if (key === lastCounts) return;
  lastCounts = key;
  for (const c of LINE_ORDER) document.querySelector(`[data-line="${c}"] b`).textContent = counts[c];
  const total = state.trains.length;
  document.getElementById("count").textContent = `${total} train${total === 1 ? "" : "s"}`;
}

function tickClock() {
  document.getElementById("clock").textContent = new Intl.DateTimeFormat("en-US", {
    hour: "numeric", minute: "2-digit", timeZone: "America/Chicago",
  }).format(new Date()) + " CT";
}

// ---------------------------------------------------------------------------
// Live feed

async function pollFeed() {
  const live = state.live;
  try {
    const res = await fetch(FEED_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`feed ${res.status}`);
    const trains = parsePositions(await res.json(), state.net.origin);
    const now = Date.now();
    // Start the glide from where each train is now, even if the tab was hidden.
    live.prev = new Map(live.ok ? liveTrains(now).map((t) => [t.id, t]) : []);
    live.curr = new Map(trains.map((t) => [t.id, t]));
    live.at = now;
    live.ok = true;
    live.failed = false;
    live.misses = 0;
  } catch (err) {
    console.warn("Train feed unavailable", err);
    // Ride out a blip on the last good positions; give up after three misses.
    live.misses = (live.misses || 0) + 1;
    if (live.misses >= 3) {
      live.ok = false;
      live.failed = true;
    }
  }
  setMode();
  setTimeout(pollFeed, FEED_EVERY);
}

function setMode() {
  const mode = document.getElementById("mode");
  const note = document.getElementById("note");
  mode.classList.toggle("live", state.live.ok);
  mode.classList.toggle("down", state.live.failed);
  if (state.live.ok) {
    mode.textContent = "Live";
    note.textContent = "Positions from CTA Train Tracker, refreshed every 30 seconds.";
  } else if (state.live.failed) {
    mode.textContent = "Sample run";
    note.textContent = "Can’t reach the CTA feed right now. Showing simulated trains until it’s back.";
  }
}

// ---------------------------------------------------------------------------
// Next trains: pick a line and station (or click a station on the map).

const ARRIVALS_EVERY = 30_000;

function buildBoard() {
  const toggle = document.getElementById("board-toggle");
  const lineSel = document.getElementById("pick-line");
  const stationSel = document.getElementById("pick-station");
  for (const { code, name } of LINES) lineSel.add(new Option(`${name} Line`, code));
  toggle.addEventListener("click", () => {
    const b = state.board;
    if (b.open) closeBoard();
    else openBoard(b.station ? state.net.stations.find((s) => s.id === b.station) : null);
  });
  lineSel.addEventListener("change", () => {
    const keep = lineStations(lineSel.value).some((s) => s.id === state.board.station);
    setBoard(lineSel.value, keep ? state.board.station : lineStations(lineSel.value)[0].id);
  });
  stationSel.addEventListener("change", () => setBoard(state.board.line, stationSel.value));
}

// A line's stations in riding order, from its first terminal outward.
function lineStations(line) {
  // Every route on the line, so both Green Line branches are listed.
  const seen = new Set();
  const names = new Map(state.net.stations.map((s) => [s.id, s]));
  return state.routes.filter((r) => r.line === line).flatMap((r) => r.stops.map(([, id]) => id))
    .filter((id) => !seen.has(id) && seen.add(id)).map((id) => names.get(id));
}

function openBoard(station) {
  const b = state.board;
  const line = station ? (station.l.includes(b.line) ? b.line : station.l[0]) : b.line;
  b.open = true;
  document.getElementById("board-toggle").setAttribute("aria-expanded", "true");
  document.getElementById("board-body").hidden = false;
  setBoard(line, station ? station.id : (b.station || lineStations(line)[0].id));
}

function closeBoard() {
  state.board.open = false;
  document.getElementById("board-toggle").setAttribute("aria-expanded", "false");
  document.getElementById("board-body").hidden = true;
}

function setBoard(line, stationId) {
  const b = state.board;
  const lineSel = document.getElementById("pick-line");
  const stationSel = document.getElementById("pick-station");
  if (b.line !== line || stationSel.options.length === 0) {
    stationSel.replaceChildren(...lineStations(line).map((s) => new Option(s.name, s.id)));
  }
  Object.assign(b, { line, station: stationId, list: [], dataAt: 0, askedAt: 0, rows: [], rowsKey: "" });
  lineSel.value = line;
  stationSel.value = stationId;
  refreshArrivals();
}

async function refreshArrivals() {
  const b = state.board;
  const asked = `${b.line}:${b.station}`;
  const now = Date.now();
  b.askedAt = now;
  // After a live failure, use the sample run for a minute, then try again.
  if (FEED_URL && now - b.failedAt > 60_000) {
    try {
      const res = await fetch(new URL(`arrivals?mapid=${b.station}`, FEED_URL), { cache: "no-store" });
      if (!res.ok) throw new Error(`arrivals ${res.status}`);
      const list = parseArrivals(await res.json()).filter((a) => a.line === b.line);
      if (asked !== `${b.line}:${b.station}`) return; // the pick changed mid-flight
      Object.assign(b, { list, dataAt: Date.now(), live: true, failedAt: 0 });
      return renderBoard();
    } catch (err) {
      if (asked !== `${b.line}:${b.station}`) return;
      console.warn("Arrivals unavailable", err);
      b.failedAt = Date.now();
    }
  }
  Object.assign(b, { live: false, dataAt: now, list: sampleArrivals(state.routes, state.net.stations, now, b.station, b.line) });
  renderBoard();
}

let boardTick = 0;
function updateBoard(now) {
  const b = state.board;
  if (!b.open || !b.station) return;
  if (now - b.askedAt > (b.live ? ARRIVALS_EVERY : 5000)) refreshArrivals();
  // Count down once a second between refreshes.
  const tick = Math.floor(now / 1000);
  if (tick !== boardTick) { boardTick = tick; updateTimes(); }
}

// Rows are rebuilt only when new data lands, so focus and clicks survive;
// the countdowns tick in place.
function renderBoard() {
  const b = state.board;
  const ol = document.getElementById("arrivals");
  const gone = (Date.now() - b.dataAt) / 1000;
  const list = b.list.filter((a) => a.inSec - gone > -30).slice(0, 8);
  const key = list.map((a) => `${a.id}>${a.dest}`).join("|");
  if (list.length && key === b.rowsKey) {
    // Same trains as before: refresh their times without touching the DOM.
    b.rows.forEach((r, i) => { r.a = list[i]; });
    updateTimes();
  } else if (!list.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No trains due in the next 45 minutes.";
    ol.replaceChildren(li);
    b.rows = [];
  } else {
    b.rows = list.map((a) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.style.setProperty("--c", `var(--line-${a.line})`);
      btn.innerHTML = `<i></i><span>To ${esc(a.dest)}${a.scheduled && b.live ? " <small>sched.</small>" : ""}</span><time></time>`;
      btn.addEventListener("click", () => showTrain(a.id));
      const li = document.createElement("li");
      li.append(btn);
      return { a, btn, li, time: btn.querySelector("time") };
    });
    ol.replaceChildren(...b.rows.map((r) => r.li));
    updateTimes();
  }
  b.rowsKey = key;
  document.getElementById("board-note").textContent = b.live
    ? "CTA predictions. “sched.” means the train hasn’t left its terminal yet."
    : b.failedAt
      ? "Can’t reach CTA arrivals right now, so these times come from the sample run."
      : "Times from the sample run, which follows the real routes and stops.";
}

function updateTimes() {
  const b = state.board;
  const gone = (Date.now() - b.dataAt) / 1000;
  for (const { a, btn, time } of b.rows) {
    const left = Math.max(0, a.inSec - gone);
    const mins = Math.round(left / 60);
    const label = left < 60 ? "Due" : `${mins} min`;
    if (time.textContent === label) continue;
    time.textContent = label;
    time.className = left < 60 ? "due" : "";
    btn.setAttribute("aria-label", `${LINE_NAME[a.line]} Line to ${a.dest}, ${left < 60 ? "due now" : `in ${mins} minutes`}. Show on map.`);
  }
}

function showTrain(id) {
  // Run numbers only line up when the board and the map use the same source.
  if (state.board.live !== state.live.ok) return;
  const t = state.trains.find((x) => x.id === id);
  if (!t) return;
  if (state.hidden.has(t.line)) document.querySelector(`[data-line="${t.line}"]`).click();
  setView(t.x, t.y, Math.min(state.view.mpp, 25));
  select(id);
}

// ---------------------------------------------------------------------------
// Legend, card, tooltip

function buildLegend() {
  const legend = document.getElementById("legend");
  for (const { code, name } of LINES) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.line = code;
    b.setAttribute("aria-pressed", "true");
    b.style.setProperty("--c", `var(--line-${code})`);
    b.innerHTML = `<i></i>${name}<b>0</b>`;
    b.addEventListener("click", () => {
      const showing = !state.hidden.has(code);
      if (showing) state.hidden.add(code);
      else state.hidden.delete(code);
      b.setAttribute("aria-pressed", String(!showing));
      if (showing && state.selected?.startsWith(`${code}-`)) select(null);
      state.bgDirty = true;
    });
    legend.append(b);
  }
}

function select(id) {
  state.selected = id;
  document.getElementById("card").hidden = !id;
  updateCard(true);
}

let cardKey = "";
function updateCard(force) {
  if (!state.selected) return;
  const t = state.trains.find((x) => x.id === state.selected);
  if (!t) {
    // The train finished its run or dropped out of the feed.
    select(null);
    return;
  }
  const key = `${t.id}|${t.dest}|${t.next}|${t.approaching}|${t.delayed}|${t.holiday}`;
  if (!force && key === cardKey) return;
  cardKey = key;
  document.getElementById("card-swatch").style.setProperty("--c", `var(--line-${t.line})`);
  document.getElementById("card-title").textContent = `${LINE_NAME[t.line]} Line · Run ${t.rn}`;
  document.getElementById("card-dest").textContent = t.dest ?? "Not reported";
  document.getElementById("card-next").textContent = t.next || "Not reported";
  const flag = document.getElementById("card-flag");
  flag.hidden = !(t.delayed || t.approaching || t.holiday);
  flag.textContent = t.delayed ? "Running late"
    : t.holiday ? "The Holiday Train, lit up for December"
    : `Pulling into ${t.next}`;
}

function hitTest(px, py) {
  let best = null;
  let bestD = 5;
  for (const d of state.drawn) {
    const dist = Math.hypot(d.px - px, d.py - py);
    if (dist < bestD) { bestD = dist; best = d.train; }
  }
  if (best) return { kind: "train", train: best };
  for (const s of state.net.stations) {
    if (stationHidden(s)) continue;
    const [sx, sy] = toPx(s.x, s.y);
    if (Math.hypot(sx - px, sy - py) < 3) return { kind: "station", station: s };
  }
  for (let i = state.eggs.length - 1; i >= 0; i--) {
    const e = state.eggs[i];
    if (px >= e.x0 - 1 && px <= e.x1 + 2 && py >= e.y0 - 1 && py <= e.y1 + 2) return { kind: "egg", egg: e };
  }
  return null;
}

function showTip(hit, clientX, clientY) {
  const tip = document.getElementById("tip");
  if (!hit) { tip.hidden = true; return; }
  if (hit.kind === "train") {
    const t = hit.train;
    tip.innerHTML = `<b>${LINE_NAME[t.line]} ${esc(t.rn)}</b> to ${esc(t.dest ?? "Not reported")}`;
  } else if (hit.kind === "egg") {
    const e = hit.egg;
    tip.innerHTML = `<b>${esc(e.label)}</b>${e.note ? ` · ${esc(e.note)}` : ""}`;
  } else {
    const s = hit.station;
    tip.innerHTML = `<b>${esc(s.name)}</b> · ${s.l.map((c) => LINE_NAME[c]).join(", ")} · click for next trains`;
  }
  tip.hidden = false;
  const r = tip.getBoundingClientRect();
  const x = Math.min(clientX + 14, innerWidth - r.width - 8);
  const y = clientY - r.height - 12 < 8 ? clientY + 18 : clientY - r.height - 12;
  tip.style.left = `${x}px`;
  tip.style.top = `${y}px`;
}

// ---------------------------------------------------------------------------
// Input: drag to pan, wheel or pinch to zoom, tap a train for details.

function bindInput() {
  const pointers = new Map();
  let drag = null;
  let pinch = null;

  const fbPoint = (e) => {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * state.fb.w, ((e.clientY - r.top) / r.height) * state.fb.h];
  };

  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, e);
    if (pointers.size === 1) {
      drag = { x: e.clientX, y: e.clientY, cx: state.view.cx, cy: state.view.cy, moved: false };
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), mpp: state.view.mpp };
      drag = null;
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, e);
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const mid = fbPoint({ clientX: (a.clientX + b.clientX) / 2, clientY: (a.clientY + b.clientY) / 2 });
      zoomAt(state.view.mpp / ((pinch.mpp * pinch.d) / d), mid[0], mid[1]);
      return;
    }
    if (drag) {
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (Math.hypot(dx, dy) > 4) drag.moved = true;
      if (drag.moved) {
        canvas.classList.add("dragging");
        const k = state.view.mpp / state.fb.scale;
        setView(drag.cx - dx * k, drag.cy - dy * k, state.view.mpp);
        showTip(null);
      }
      return;
    }
    if (e.pointerType === "mouse") {
      const hit = hitTest(...fbPoint(e));
      canvas.classList.toggle("pointing", hit?.kind === "train");
      showTip(hit, e.clientX, e.clientY);
    }
  });

  const end = (e) => {
    const wasTap = drag && !drag.moved && pointers.size === 1;
    pointers.delete(e.pointerId);
    if (pinch && pointers.size === 1) {
      // One finger lifted from a pinch: keep panning with the other.
      const [rest] = pointers.values();
      drag = { x: rest.clientX, y: rest.clientY, cx: state.view.cx, cy: state.view.cy, moved: true };
      pinch = null;
      return;
    }
    if (pointers.size < 2) pinch = null;
    canvas.classList.remove("dragging");
    if (wasTap && e.type === "pointerup") {
      const hit = hitTest(...fbPoint(e));
      if (hit?.kind === "train") select(hit.train.id);
      else if (hit?.kind === "station") { openBoard(hit.station); showTip(null); }
      else if (hit && e.pointerType !== "mouse") showTip(hit, e.clientX, e.clientY);
      else { select(null); showTip(null); }
    }
    drag = null;
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("pointerleave", () => showTip(null));

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const [fx, fy] = fbPoint(e);
    zoomAt(Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0025)), fx, fy);
  }, { passive: false });

  canvas.addEventListener("keydown", (e) => {
    const step = 40 * state.view.mpp;
    const v = state.view;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) setView(v.cx + moves[e.key][0], v.cy + moves[e.key][1], v.mpp);
    else if (e.key === "+" || e.key === "=") zoomAt(1.5);
    else if (e.key === "-") zoomAt(1 / 1.5);
    else if (e.key === "0") fit();
    else if (e.key === "Escape") select(null);
    else return;
    e.preventDefault();
  });

  document.querySelectorAll("[data-zoom]").forEach((b) => b.addEventListener("click", () => {
    const z = b.dataset.zoom;
    if (z === "in") zoomAt(1.5);
    else if (z === "out") zoomAt(1 / 1.5);
    else fit();
  }));
  document.getElementById("card-close").addEventListener("click", () => select(null));
}

// ---------------------------------------------------------------------------
// Colour helpers. Pixels are stored as little-endian ABGR uint32.

function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (255 << 24 | (n & 0xff) << 16 | (n & 0xff00) | (n >> 16) & 0xff) >>> 0;
}

function mix(a, b, t) {
  const ch = (c, s) => (c >> s) & 0xff;
  const m = (s) => Math.round(ch(a, s) * (1 - t) + ch(b, s) * t);
  return (255 << 24 | m(16) << 16 | m(8) << 8 | m(0)) >>> 0;
}

function css32(c) {
  return `rgb(${c & 0xff} ${(c >> 8) & 0xff} ${(c >> 16) & 0xff})`;
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
}
