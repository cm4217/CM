import { LS_SEARCH_HISTORY } from "./storageKeys";

const MAX = 12;

export function loadSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_SEARCH_HISTORY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as string[];
    return Array.isArray(arr) ? arr.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function pushSearchHistory(q: string) {
  const t = q.trim();
  if (!t) return;
  const prev = loadSearchHistory().filter((x) => x.toLowerCase() !== t.toLowerCase());
  const next = [t, ...prev].slice(0, MAX);
  localStorage.setItem(LS_SEARCH_HISTORY, JSON.stringify(next));
}

export function clearSearchHistory() {
  localStorage.removeItem(LS_SEARCH_HISTORY);
}
