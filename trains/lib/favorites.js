// Saved stops, kept in this browser only. A favorite is { line, station }
// where station is the CTA map id.

export const MAX_FAVORITES = 5;
const KEY = "cta-favorites";

export function toggleFavorite(list, fav) {
  const same = (f) => f.line === fav.line && f.station === fav.station;
  if (list.some(same)) return list.filter((f) => !same(f));
  return [{ line: fav.line, station: fav.station }, ...list].slice(0, MAX_FAVORITES);
}

export function loadFavorites() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(list) ? list.filter((f) => f && typeof f.line === "string" && typeof f.station === "string") : [];
  } catch {
    return [];
  }
}

export function saveFavorites(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Private windows and blocked storage just don't remember.
  }
}
