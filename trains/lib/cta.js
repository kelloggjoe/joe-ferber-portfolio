// CTA Train Tracker "ttpositions" feed, as passed through by the proxy in
// _cta-proxy/. Docs: https://www.transitchicago.com/developers/ttdocs/

import { project } from "./route.js";

const LINE_CODES = { red: "red", blue: "blue", brn: "brn", g: "g", org: "o", p: "p", pink: "pnk", y: "y" };

export function parsePositions(feed, origin) {
  const tt = feed && feed.ctatt;
  if (!tt) throw new Error("Unexpected response from the train feed");
  if (tt.errCd && tt.errCd !== "0") throw new Error(tt.errNm || `Train feed error ${tt.errCd}`);
  const trains = [];
  for (const route of tt.route || []) {
    const line = LINE_CODES[route["@name"]];
    if (!line || !route.train) continue;
    // The feed sends a bare object, not an array, when a line has one train.
    for (const t of [].concat(route.train)) {
      const lat = parseFloat(t.lat);
      const lon = parseFloat(t.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      const { x, y } = project(lat, lon, origin);
      // Feed heading is compass degrees; the map wants screen radians.
      const heading = parseFloat(t.heading) || 0;
      trains.push({
        id: `${line}-${t.rn}`,
        rn: t.rn,
        line,
        x,
        y,
        angle: ((heading - 90) * Math.PI) / 180,
        next: t.nextStaNm,
        dest: t.destNm,
        approaching: t.isApp === "1",
        delayed: t.isDly === "1",
      });
    }
  }
  return trains;
}
