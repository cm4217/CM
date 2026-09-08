import type { SearchHit } from "./types";
import { loadWatchlist } from "./watchlistStorage";
import { loadRecentSubstanceIds } from "./recentSubstances";
import { LS_CLIENT_BOOST } from "./storageKeys";

/** Prefer-stable light boost for watchlist / recent substance ids */
export function isClientBoostEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const v = localStorage.getItem(LS_CLIENT_BOOST);
    if (v === null) return true;
    return v !== "0" && v !== "false";
  } catch {
    return true;
  }
}

export function setClientBoostEnabled(on: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_CLIENT_BOOST, on ? "1" : "0");
}

export function loadBoostIdSets(): {
  watchIds: Set<string>;
  recentIds: Set<string>;
} {
  const watchIds = new Set<string>();
  for (const it of loadWatchlist()) {
    if (it.resolved.status === "matched") {
      watchIds.add(it.resolved.id);
    }
  }
  const recentIds = new Set(loadRecentSubstanceIds());
  return { watchIds, recentIds };
}

function boostWeight(
  hit: SearchHit,
  watchIds: Set<string>,
  recentIds: Set<string>
): number {
  let w = 0;
  if (watchIds.has(hit.id)) w += 2;
  if (hit.kind === "substance" && recentIds.has(hit.id)) w += 1;
  return w;
}

/**
 * Prefer-stable: partition by boost weight, preserve original relative order within each bucket.
 */
export function preferStableBoost(
  hits: SearchHit[],
  watchIds: Set<string>,
  recentIds: Set<string>
): SearchHit[] {
  if (hits.length <= 1) return hits;
  const annotated = hits.map((h, i) => ({
    h,
    i,
    w: boostWeight(h, watchIds, recentIds),
  }));
  annotated.sort((a, b) => {
    if (b.w !== a.w) return b.w - a.w;
    return a.i - b.i;
  });
  return annotated.map((x) => x.h);
}

export function isWatchedHit(hit: SearchHit, watchIds: Set<string>): boolean {
  return watchIds.has(hit.id);
}
