// Small Chicago things hidden around the map: landmark sprites, sailboats,
// a lake monster, and a couple of date-driven surprises.

// One character per pixel; "." is transparent. Each sprite lists its
// animation frames, and app.js maps the letters to colours.
export const SPRITES = {
  wheel: [
    ["..ppppp..", ".p..w..p.", "p...w...p", "p...w...p", "pwwwowwwp", "p...w...p", "p...w...p", ".p..w..p.", "..ppppp..", "...w.w...", "..w...w.."],
    ["..ppppp..", ".p.....p.", "p.w...w.p", "p..w.w..p", "p...o...p", "p..w.w..p", "p.w...w.p", ".p.....p.", "..ppppp..", "...w.w...", "..w...w.."],
  ],
  bean: [[".sss.", "shsss", ".sss."], [".sss.", "sssss", ".shs."], [".sss.", "ssssh", ".sss."]],
  willis: [
    [".r.r.", ".k.k.", ".kkk.", ".kyk.", "kkkkk", "kykyk", "kkkkk", "kykky", "kkkkk", "ykkyk", "kkkkk"],
    [".....", ".k.k.", ".kkk.", ".kyk.", "kkkkk", "kykyk", "kkkkk", "kykky", "kkkkk", "ykkyk", "kkkkk"],
  ],
  fountain: [["...c...", "..c.c..", ".c...c.", "bbbbbbb"], ["..c.c..", ".c.c.c.", "c.....c", "bbbbbbb"]],
  // The W flies west of the pole so it stays clear of the Red Line.
  wrigley: [["wwwwwwwp", "wbwbwbwp", "wbwbwbwp", "wwbwbwwp", "wwwwwwwp", ".......p", ".......p"]],
  boat: [["..w..", "..ww.", "..www", "rrrrr", ".rrr."]],
  monster: [
    ["........ggg.", ".......gwggg", ".......gggt.", "........g...", "..ggg...g...", ".gdddg..g...", "gdd.ddg.gg.."],
    ["........ggg.", ".......ggggg", ".......ggg..", "........g...", "..ggg...g...", ".gdddg..g...", "gdd.ddg.gg.."],
  ],
  foam: [["....f.f....."], ["..f.f..ff.f."], ["f.ff.f.f.ff."]],
};

export const PALETTE = {
  p: "#ffd166", w: "#e6ecf8", o: "#ff5a7a",
  s: "#b9c4da", h: "#ffffff",
  r: "#ff4a4a", k: "#3f4d72", y: "#ffd166",
  c: "#8fd8ff", b: "#9aa6c2",
  g: "#4be08a", d: "#25a05e", t: "#ff5a7a", f: "#cfe8ff",
  u: "#b48cff", n: "#c98a52", e: "#ff9230", l: "#34b8ff", x: "#0e1424",
};

// Where each landmark sits, and how far in you have to zoom (meters per
// map pixel) before it shows, so the full-system view stays uncluttered.
export const LANDMARKS = [
  { sprite: "wheel", lat: 41.8917, lon: -87.6080, maxMpp: 160, every: 900, label: "Navy Pier", note: "the Centennial Wheel" },
  { sprite: "willis", lat: 41.8789, lon: -87.6359, maxMpp: 16, every: 1000, label: "Willis Tower", note: "locals still call it Sears" },
  { sprite: "bean", lat: 41.8827, lon: -87.6233, maxMpp: 20, every: 1400, label: "Cloud Gate", note: "everyone calls it the Bean" },
  { sprite: "fountain", lat: 41.8758, lon: -87.6189, maxMpp: 40, every: 450, label: "Buckingham Fountain" },
  { sprite: "wrigley", lat: 41.9484, lon: -87.6560, maxMpp: 400, every: 0, label: "Wrigley Field", note: "fly the W" },
];

export const NAVY_PIER = [[41.8918, -87.6128], [41.8918, -87.6008]];

// The Chicago River: main stem from the lake to Wolf Point, then the
// North and South branches.
export const RIVER = [
  [[41.8889, -87.6110], [41.8887, -87.6180], [41.8885, -87.6260], [41.8878, -87.6330], [41.8868, -87.6375]],
  [[41.8868, -87.6375], [41.8905, -87.6395], [41.8960, -87.6430], [41.9010, -87.6480], [41.9060, -87.6520],
   [41.9120, -87.6560], [41.9180, -87.6580], [41.9250, -87.6640], [41.9330, -87.6740], [41.9400, -87.6800],
   [41.9480, -87.6860], [41.9570, -87.6900], [41.9650, -87.6930], [41.9730, -87.6970]],
  [[41.8868, -87.6375], [41.8800, -87.6382], [41.8720, -87.6382], [41.8650, -87.6375], [41.8600, -87.6370],
   [41.8560, -87.6400], [41.8530, -87.6450], [41.8500, -87.6530], [41.8470, -87.6600], [41.8440, -87.6700],
   [41.8400, -87.6800], [41.8350, -87.6900], [41.8280, -87.7000]],
];

// Sailboats drift east and west across this stretch of open water.
export const BOATS = [
  { lat: 41.965, lon0: -87.60, speed: 3.5 },
  { lat: 41.915, lon0: -87.53, speed: -2.5 },
  { lat: 41.862, lon0: -87.57, speed: 3 },
  { lat: 41.805, lon0: -87.51, speed: -4 },
];
export const BOAT_RANGE = [-87.62, -87.46];

export const MONSTER_SECONDS = 7;

export function parseSprite(rows) {
  const pixels = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== ".") pixels.push([x, y, ch]); }));
  return { w: rows[0].length, h: rows.length, pixels };
}

// Today's date in Chicago, whatever the visitor's own time zone.
export function chicagoDate(date) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago", year: "numeric", month: "numeric", day: "numeric",
  }).formatToParts(date).map((p) => [p.type, p.value]));
  return { y: +parts.year, m: +parts.month, d: +parts.day };
}

// The river gets dyed on the Saturday on or before March 17.
export function greenRiver({ y, m, d }) {
  if (m !== 3) return false;
  const dow = new Date(Date.UTC(y, 2, 17)).getUTCDay();
  const dyeDay = 17 - ((dow + 1) % 7);
  return d >= dyeDay && d <= 17;
}

// The CTA Holiday Train makes its rounds in December.
export function holidaySeason({ m }) {
  return m === 12;
}

// Frame plan for one appearance, t seconds in: how many sprite rows show
// above the water, which foam frame (-1 for none), and whether the eye is shut.
export function monsterPose(t) {
  const h = SPRITES.monster[0].length;
  if (t >= MONSTER_SECONDS) return { rows: 0, foam: -1, blink: false, done: true };
  if (t < 0.8) return { rows: 0, foam: t < 0.4 ? 0 : 1, blink: false, done: false };
  if (t < 2.2) return { rows: Math.min(h, 1 + Math.floor((t - 0.8) / 0.2)), foam: 2, blink: false, done: false };
  if (t < 5) return { rows: h, foam: 2, blink: t > 3.6 && t < 3.8, done: false };
  if (t < 6.2) return { rows: Math.max(0, h - 1 - Math.floor((t - 5) / 0.17)), foam: 2, blink: false, done: false };
  return { rows: 0, foam: t < 6.6 ? 1 : 0, blink: false, done: false };
}

// Calls onMatch whenever the keys fed in end with the full sequence.
export function codeListener(sequence, onMatch) {
  let at = 0;
  return (key) => {
    if (key === sequence[at]) at++;
    else at = key === sequence[0] ? 1 : 0;
    if (at === sequence.length) {
      at = 0;
      onMatch();
    }
  };
}
