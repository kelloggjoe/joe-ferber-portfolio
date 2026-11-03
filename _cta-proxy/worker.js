// Cloudflare Worker that keeps the CTA Train Tracker key off the page.
// It fetches every line's train positions, caches them for 20 seconds so
// visitors share one upstream call, and adds the CORS header the map needs.

const CTA_URL = "https://lapi.transitchicago.com/api/1.0/ttpositions.aspx";
const ROUTES = "red,blue,brn,g,org,p,pink,y";
const ALLOWED_ORIGINS = ["https://joeferber.com", "https://www.joeferber.com", "http://localhost:4173"];
const CACHE_SECONDS = 20;
const CACHE_CONTROL = `public, max-age=${CACHE_SECONDS}`;

// The Cache API does nothing on *.workers.dev, so each isolate also keeps
// the last response in memory. On a custom domain both layers apply.
let memo = { at: 0, body: null };

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      Vary: "Origin",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: { ...cors, "Access-Control-Allow-Methods": "GET" } });
    if (request.method !== "GET") return new Response("Method not allowed", { status: 405, headers: cors });

    try {
      const body = await positions(request, env, ctx);
      return new Response(body, { headers: { ...cors, "Content-Type": "application/json", "Cache-Control": CACHE_CONTROL } });
    } catch (err) {
      return new Response(`CTA feed unavailable: ${err.message}`, { status: 502, headers: cors });
    }
  },
};

async function positions(request, env, ctx) {
  if (memo.body && Date.now() - memo.at < CACHE_SECONDS * 1000) return memo.body;
  const cache = caches.default;
  const cacheKey = new Request(new URL("/positions", request.url));
  const hit = await cache.match(cacheKey);
  if (hit) return hit.text();

  const url = `${CTA_URL}?key=${encodeURIComponent(env.CTA_KEY)}&rt=${ROUTES}&outputType=JSON`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CTA returned ${res.status}`);
  const body = await res.text();
  memo = { at: Date.now(), body };
  ctx.waitUntil(cache.put(cacheKey, new Response(body, {
    headers: { "Content-Type": "application/json", "Cache-Control": CACHE_CONTROL },
  })));
  return body;
}
