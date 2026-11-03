// Cloudflare Worker that keeps the CTA Train Tracker key off the page.
//   /             every line's train positions
//   /arrivals?mapid=40380   predictions for one station
// Responses are cached for 20 seconds so visitors share upstream calls,
// and carry the CORS header the map needs.

const CTA_API = "https://lapi.transitchicago.com/api/1.0";
const ROUTES = "red,blue,brn,g,org,p,pink,y";
const ALLOWED_ORIGINS = ["https://joeferber.com", "https://www.joeferber.com", "http://localhost:4173"];
const CACHE_SECONDS = 20;
const CACHE_CONTROL = `public, max-age=${CACHE_SECONDS}`;

// The Cache API does nothing on *.workers.dev, so each isolate also keeps
// recent responses in memory. On a custom domain both layers apply.
const memo = new Map();

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      Vary: "Origin",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: { ...cors, "Access-Control-Allow-Methods": "GET" } });
    if (request.method !== "GET") return new Response("Method not allowed", { status: 405, headers: cors });

    const url = new URL(request.url);
    let upstream;
    if (url.pathname === "/arrivals") {
      const mapid = url.searchParams.get("mapid") || "";
      if (!/^4\d{4}$/.test(mapid)) return new Response("Expected ?mapid=4xxxx", { status: 400, headers: cors });
      upstream = `${CTA_API}/ttarrivals.aspx?mapid=${mapid}&outputType=JSON`;
    } else {
      upstream = `${CTA_API}/ttpositions.aspx?rt=${ROUTES}&outputType=JSON`;
    }

    try {
      const body = await cached(upstream, request, env, ctx);
      return new Response(body, { headers: { ...cors, "Content-Type": "application/json", "Cache-Control": CACHE_CONTROL } });
    } catch (err) {
      return new Response(`CTA feed unavailable: ${err.message}`, { status: 502, headers: cors });
    }
  },
};

async function cached(upstream, request, env, ctx) {
  const hit = memo.get(upstream);
  if (hit && Date.now() - hit.at < CACHE_SECONDS * 1000) return hit.body;
  // The cache key never includes the secret key.
  const cacheKey = new Request(new URL(`/__cache/${encodeURIComponent(upstream)}`, request.url));
  const cachedRes = await caches.default.match(cacheKey);
  if (cachedRes) return cachedRes.text();

  const res = await fetch(`${upstream}&key=${encodeURIComponent(env.CTA_KEY)}`);
  if (!res.ok) throw new Error(`CTA returned ${res.status}`);
  const body = await res.text();
  if (memo.size > 200) memo.clear();
  memo.set(upstream, { at: Date.now(), body });
  ctx.waitUntil(caches.default.put(cacheKey, new Response(body, {
    headers: { "Content-Type": "application/json", "Cache-Control": CACHE_CONTROL },
  })));
  return body;
}
