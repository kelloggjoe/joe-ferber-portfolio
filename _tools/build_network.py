"""Build trains/data/network.json from City of Chicago open data.

Inputs (download, then pass the paths):
  lines.geojson  https://data.cityofchicago.org/api/geospatial/xbyr-jnvx?method=export&format=GeoJSON
  stops.json     https://data.cityofchicago.org/resource/8pix-ypme.json?$limit=1000
  city.geojson   https://data.cityofchicago.org/resource/qqq8-j68g.geojson

Usage:
  python3 _tools/build_network.py lines.geojson stops.json city.geojson > trains/data/network.json

Coordinates are projected to whole meters on a local flat plane
(x east, y south) centred on ORIGIN, which is accurate to well under a
pixel at any zoom the map offers.
"""

import heapq
import json
import math
import sys

ORIGIN = (41.88, -87.75)  # lat, lon
M_PER_DEG_LAT = 110574.0
M_PER_DEG_LON = 111320.0 * math.cos(math.radians(ORIGIN[0]))

LINES = ["red", "blue", "brn", "g", "o", "p", "pnk", "y"]

# Each route is a list of (station name) waypoints on that line's track.
# Trains run the whole list and wrap around, so every route starts and
# ends at the same terminal. Loop lines visit the Loop on the way.
ROUTES = {
    "red": [["Howard", "95th/Dan Ryan", "Howard"]],
    "blue": [["O'Hare", "Forest Park", "O'Hare"]],
    "brn": [["Kimball", "Washington/Wells", "Harold Washington Library-State/Van Buren",
             "Adams/Wabash", "Clark/Lake", "Kimball"]],
    "g": [["Harlem/Lake", "Ashland/63rd", "Harlem/Lake"],
          ["Harlem/Lake", "Cottage Grove", "Harlem/Lake"]],
    "o": [["Midway", "Quincy/Wells", "Clark/Lake", "Adams/Wabash", "Midway"]],
    "p": [["Linden", "Merchandise Mart", "Washington/Wells",
           "Harold Washington Library-State/Van Buren", "Adams/Wabash", "Clark/Lake", "Linden"]],
    "pnk": [["54th/Cermak", "State/Lake", "Harold Washington Library-State/Van Buren",
             "Washington/Wells", "54th/Cermak"]],
    "y": [["Dempster-Skokie", "Howard", "Dempster-Skokie"]],
}

# Lakefront north of the city limits (Evanston up the North Shore), lat/lon.
# It runs well past the last station so zoomed-out views never see an edge.
NORTH_SHORE = [
    (42.0300, -87.6662), (42.0400, -87.6695), (42.0500, -87.6735),
    (42.0600, -87.6775), (42.0700, -87.6825), (42.0800, -87.6870),
    (42.0950, -87.6950), (42.1100, -87.7200), (42.1350, -87.7520),
    (42.1600, -87.7700), (42.1900, -87.7900), (42.2500, -87.8100),
    (42.3500, -87.8250),
]


def project(lat, lon):
    return (round((lon - ORIGIN[1]) * M_PER_DEG_LON), round((ORIGIN[0] - lat) * M_PER_DEG_LAT))


def line_codes(label):
    s = label.lower()
    codes = []
    for word, code in [("red", "red"), ("blue", "blue"), ("brown", "brn"), ("green", "g"),
                       ("orange", "o"), ("purple", "p"), ("pink", "pnk"), ("yellow", "y")]:
        if word in s:
            codes.append(code)
    return codes


def simplify(pts, tol):
    """Ramer-Douglas-Peucker on a list of (x, y)."""
    if len(pts) < 3:
        return pts
    (x0, y0), (x1, y1) = pts[0], pts[-1]
    dx, dy = x1 - x0, y1 - y0
    norm = math.hypot(dx, dy) or 1.0
    far, idx = 0.0, 0
    for i in range(1, len(pts) - 1):
        d = abs(dy * (pts[i][0] - x0) - dx * (pts[i][1] - y0)) / norm
        if d > far:
            far, idx = d, i
    if far <= tol:
        return [pts[0], pts[-1]]
    return simplify(pts[: idx + 1], tol)[:-1] + simplify(pts[idx:], tol)


def dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def build_tracks(geo):
    tracks = []
    for f in geo["features"]:
        codes = line_codes(f["properties"]["lines"])
        g = f["geometry"]
        parts = g["coordinates"] if g["type"] == "MultiLineString" else [g["coordinates"]]
        for part in parts:
            pts = [project(lat, lon) for lon, lat in part]
            tracks.append({"l": codes, "pts": pts})
    return tracks


def line_graph(tracks, code, snap=40):
    """Undirected graph of one line's track pieces, endpoints snapped together."""
    nodes = []  # representative points

    def node_for(p):
        for i, q in enumerate(nodes):
            if dist(p, q) <= snap:
                return i
        nodes.append(p)
        return len(nodes) - 1

    edges = {}
    for t in tracks:
        if code not in t["l"]:
            continue
        a, b = node_for(t["pts"][0]), node_for(t["pts"][-1])
        length = plen(t["pts"])
        edges.setdefault(a, []).append((b, length, t["pts"]))
        edges.setdefault(b, []).append((a, length, t["pts"][::-1]))
    return edges


def nearest_point_on_graph(edges, p):
    """Return (distance, node a, node b, piece pts, segment index, projected point) for the closest piece."""
    best = None
    for a, outs in edges.items():
        for b, _, pts in outs:
            for i in range(len(pts) - 1):
                q, d = closest_on_segment(pts[i], pts[i + 1], p)
                if best is None or d < best[0]:
                    best = (d, a, b, pts, i, q)
    return best


def closest_on_segment(a, b, p):
    dx, dy = b[0] - a[0], b[1] - a[1]
    den = dx * dx + dy * dy
    t = 0.0 if den == 0 else max(0.0, min(1.0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / den))
    q = (a[0] + t * dx, a[1] + t * dy)
    return q, dist(q, p)


def shortest_path(edges, start, goal):
    """Dijkstra from a point on the graph to another; both given as nearest_point results."""
    _, sa, sb, spts, si, sq = start
    _, ga, gb, gpts, gi, gq = goal
    # Same piece: walk directly.
    if {sa, sb} == {ga, gb} and spts == gpts:
        if si < gi or (si == gi and dist(spts[si], sq) <= dist(spts[si], gq)):
            return [sq] + spts[si + 1: gi + 1] + [gq]
        return [sq] + spts[gi + 1: si + 1][::-1] + [gq]
    # Virtual start: leave sq toward a (backward) or b (forward).
    to_a = [sq] + spts[: si + 1][::-1]
    to_b = [sq] + spts[si + 1:]
    from_a = gpts[: gi + 1] + [gq]           # arrive from ga walking forward
    from_b = gpts[gi + 1:][::-1] + [gq]      # arrive from gb walking backward
    seed = [(plen(to_a), sa, to_a), (plen(to_b), sb, to_b)]
    best_at = {}
    heap = []
    for d, n, path in seed:
        heapq.heappush(heap, (d, n, id(path)))
        if d < best_at.get(n, (math.inf,))[0]:
            best_at[n] = (d, path)
    done = set()
    while heap:
        d, n, _ = heapq.heappop(heap)
        if n in done:
            continue
        done.add(n)
        for m, length, pts in edges.get(n, []):
            nd = d + length
            if nd < best_at.get(m, (math.inf,))[0]:
                best_at[m] = (nd, best_at[n][1] + pts[1:])
                heapq.heappush(heap, (nd, m, id(pts)))
    options = []
    if ga in best_at:
        options.append((best_at[ga][0] + plen(from_a), best_at[ga][1] + from_a[1:]))
    if gb in best_at:
        options.append((best_at[gb][0] + plen(from_b), best_at[gb][1] + from_b[1:]))
    if not options:
        raise SystemExit("no path between waypoints")
    return min(options, key=lambda o: o[0])[1]


def plen(pts):
    return sum(dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1))


def build_stations(stops):
    stations = {}
    for s in stops:
        sid = s["map_id"]
        st = stations.setdefault(sid, {
            "id": sid, "name": s["station_name"], "l": set(),
            "pt": project(float(s["location"]["latitude"]), float(s["location"]["longitude"])),
        })
        for code in LINES:
            if s.get(code):
                st["l"].add(code)
    return stations


def find_station(stations, name, code):
    hits = [s for s in stations.values() if s["name"] == name and code in s["l"]]
    if len(hits) != 1:
        raise SystemExit(f"station lookup {name!r} on {code}: {len(hits)} matches")
    return hits[0]


def build_routes(tracks, stations):
    routes = []
    for code, plans in ROUTES.items():
        edges = line_graph(tracks, code)
        line_stations = [s for s in stations.values() if code in s["l"]]
        for plan in plans:
            pts = []
            turn = 0
            for leg_no, (a, b) in enumerate(zip(plan, plan[1:])):
                if leg_no == len(plan) - 2:
                    turn = plen(pts)  # destination sign flips back to the first terminal here
                sa = nearest_point_on_graph(edges, find_station(stations, a, code)["pt"])
                sb = nearest_point_on_graph(edges, find_station(stations, b, code)["pt"])
                # Simplify per leg: a whole round trip starts and ends at the
                # same point, which RDP collapses to nothing.
                leg = simplify([(round(x), round(y)) for x, y in shortest_path(edges, sa, sb)], 4)
                pts += leg if not pts else leg[1:]
            routes.append({
                "line": code,
                "pts": [c for p in pts for c in p],
                "stops": route_stops(pts, line_stations),
                "ends": [plan[0], plan[1] if len(plan) == 3 else "Loop"],
                "turn": round(turn),
            })
    return routes


def route_stops(pts, line_stations, max_off=120, far_off=300):
    """Distance along the route of each station it passes, in travel order.

    Stations within max_off of the track count; a station with no match at
    all (a terminal set back from the end of the track, like O'Hare) gets a
    second look out to far_off. Keeping the first radius tight stops a stop
    a block away, like Quincy beside the Van Buren side of the Loop, from
    being counted as a pass.
    """
    cum = [0.0]
    for i in range(len(pts) - 1):
        cum.append(cum[-1] + dist(pts[i], pts[i + 1]))

    def passes(s, limit):
        # Each run of segments within reach is one pass; keep its closest point.
        found, run = [], None
        for i in range(len(pts) - 1):
            q, d = closest_on_segment(pts[i], pts[i + 1], s["pt"])
            if d <= limit:
                at = cum[i] + dist(pts[i], q)
                if run is None or d < run[1]:
                    run = (at, d) if run is None or at - run[0] < 300 else run
                if run and at - run[0] >= 300:
                    found.append(run[0])
                    run = (at, d)
            elif run is not None:
                found.append(run[0])
                run = None
        if run is not None:
            found.append(run[0])
        return found

    hits = []
    for s in line_stations:
        found = passes(s, max_off) or passes(s, far_off)
        hits += [(round(at), s["id"]) for at in found]
    hits.sort()
    return [[at, sid] for at, sid in hits]


def build_lake(city):
    """Lake Michigan as a polygon: the city's eastern edge plus the north shore."""
    polys = city["features"][0]["geometry"]["coordinates"]
    rings = [poly[0] for poly in polys]
    shore = []
    lat = 41.6445
    while lat <= 42.0227:
        xs = []
        for ring in rings:
            for (x1, y1), (x2, y2) in zip(ring, ring[1:]):
                if (y1 <= lat < y2) or (y2 <= lat < y1):
                    xs.append(x1 + (lat - y1) * (x2 - x1) / (y2 - y1))
        if xs:
            shore.append((lat, max(xs)))
        lat += 0.0015
    shore = [(la, lo) for la, lo in shore if lo > -87.7] + NORTH_SHORE
    pts = [project(la, lo) for la, lo in shore]
    pts = simplify(pts, 25)
    north, south = pts[-1][1], pts[0][1]
    east = 120000
    ring = pts + [(pts[-1][0], north - 60000), (east, north - 60000), (east, south + 60000), (pts[0][0], south + 60000)]
    return [c for p in ring for c in p]


def main():
    lines_geo, stops, city = (json.load(open(p)) for p in sys.argv[1:4])
    tracks = build_tracks(lines_geo)
    stations = build_stations(stops)
    routes = build_routes(tracks, stations)
    out = {
        "origin": ORIGIN,
        "tracks": [{"l": t["l"], "pts": [c for p in simplify(t["pts"], 6) for c in p]} for t in tracks],
        "stations": [{"id": s["id"], "name": s["name"], "l": sorted(s["l"], key=LINES.index),
                      "x": s["pt"][0], "y": s["pt"][1]} for s in stations.values()],
        "routes": routes,
        "lake": build_lake(city),
    }
    json.dump(out, sys.stdout, separators=(",", ":"))


if __name__ == "__main__":
    main()
