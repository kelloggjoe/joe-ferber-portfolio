# CTA feed proxy

The map at `/trains` runs simulated trains until it has a live feed. The CTA
Train Tracker API needs a secret key and doesn't send CORS headers, so the
browser can't call it directly. This Cloudflare Worker sits in between.

Folders starting with `_` are not published by GitHub Pages, so this code
never ships with the site.

## Going live

1. Get a Train Tracker key: https://www.transitchicago.com/developers/traintrackerapply/
2. Deploy the worker (needs the Cloudflare account that already serves joeferber.com):

   ```bash
   cd _cta-proxy
   npx wrangler deploy worker.js --name cta-trains --compatibility-date 2026-10-01 \
     --route "trains-api.joeferber.com/*"
   npx wrangler secret put CTA_KEY --name cta-trains
   ```

   Then add a proxied DNS record for `trains-api` in the joeferber.com zone
   (an `AAAA` record to `100::` is the usual placeholder for Worker-only hosts).

   Use your own domain rather than the free `*.workers.dev` URL: Cloudflare's
   shared cache doesn't work on `workers.dev`, and the CTA key has a daily
   request limit. The worker also caches in memory, which helps either way.

3. Point the map at it in `trains/index.html`:

   ```html
   <html lang="en" data-feed="https://trains-api.joeferber.com/">
   ```

The same worker answers `/arrivals?mapid=4xxxx` for the next-trains panel.

The page polls every 30 seconds, glides each train between reports, and falls
back to the sample run if the feed goes down.
