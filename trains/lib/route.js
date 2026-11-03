// Geometry shared by the map and the simulator. Positions are meters on a
// flat plane centred on network.origin: x grows east, y grows south.

const M_PER_DEG_LAT = 110574;
const M_PER_DEG_LON_EQ = 111320;

export function project(lat, lon, origin) {
  const mPerDegLon = M_PER_DEG_LON_EQ * Math.cos((origin[0] * Math.PI) / 180);
  return {
    x: Math.round((lon - origin[1]) * mPerDegLon),
    y: Math.round((origin[0] - lat) * M_PER_DEG_LAT),
  };
}

export function buildRoute(raw) {
  const cum = [0];
  for (let i = 2; i < raw.pts.length; i += 2) {
    cum.push(cum[cum.length - 1] + Math.hypot(raw.pts[i] - raw.pts[i - 2], raw.pts[i + 1] - raw.pts[i - 1]));
  }
  return { ...raw, cum, length: cum[cum.length - 1] };
}

// Point and travel angle (radians) at distance s along the route, wrapping.
export function pointAt(route, s) {
  const { pts, cum, length } = route;
  s = ((s % length) + length) % length;
  let lo = 0;
  let hi = cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= s) lo = mid;
    else hi = mid;
  }
  const x0 = pts[lo * 2];
  const y0 = pts[lo * 2 + 1];
  const x1 = pts[hi * 2];
  const y1 = pts[hi * 2 + 1];
  const seg = cum[hi] - cum[lo] || 1;
  const u = (s - cum[lo]) / seg;
  return { x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u, angle: Math.atan2(y1 - y0, x1 - x0) };
}
