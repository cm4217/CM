import { LS_SESSION_COOCCUR } from "./storageKeys";

/** Same-session co-occurrence of substance/impurity ids (simple local counter). */
type Store = Record<string, Record<string, number>>;

function load(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(LS_SESSION_COOCCUR);
    if (!raw) return {};
    return JSON.parse(raw) as Store;
  } catch {
    return {};
  }
}

function save(s: Store) {
  sessionStorage.setItem(LS_SESSION_COOCCUR, JSON.stringify(s));
}

/** Record that user viewed/clicked `id`, co-occurring with current session focus ids. */
export function recordCooccur(id: string, peers: string[] = []) {
  if (typeof window === "undefined" || !id) return;
  const s = load();
  const all = Array.from(new Set([id, ...peers.filter(Boolean)]));
  for (let i = 0; i < all.length; i++) {
    for (let j = 0; j < all.length; j++) {
      if (i === j) continue;
      const a = all[i];
      const b = all[j];
      if (!s[a]) s[a] = {};
      s[a][b] = (s[a][b] || 0) + 1;
    }
  }
  // also bump last-viewed alone so future peers link
  if (!s[id]) s[id] = {};
  save(s);
}

export function relatedByCooccur(id: string, limit = 6): string[] {
  const s = load();
  const row = s[id] || {};
  return Object.entries(row)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
    .slice(0, limit);
}
