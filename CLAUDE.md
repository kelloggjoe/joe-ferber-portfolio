# joeferber.com

Static site served by GitHub Pages from `main`. There's no build step. Each page is a single HTML file with inline CSS and JS.

- `index.html`: the homepage
- `books/index.html`: Book recommendations
- `trains/`: the Chicago 'L' tracker and its case study (`trains/about/` uses the root `styles.css`)

## Merging

Joe has pre-approved merging PRs to this repo. Don't ask before merging. Open a PR, verify it, merge it, then confirm the change on the live site.

1. Work on a branch and open a PR. Never push to `main` directly.
2. Before merging, run `for t in _tests/*.mjs; do node "$t"; done`. Serve the site locally (`python3 -m http.server`) and check desktop and phone widths, the browser console, and every link you touched.
3. Squash-merge, wait for the Pages deploy, and check the live page.
4. Tell Joe what went live.

Still ask before anything outward-facing in a new way: deleting a page, changing the domain or DNS, adding analytics or third-party scripts, or publishing personal information.

## Writing

Write site copy in Joe's voice: plain and first person, with no slogans, forced lists of three, buzzwords, or em dashes. Use only facts from his resume, his projects, or his own reviews. Never invent numbers, claims, or quotes.
