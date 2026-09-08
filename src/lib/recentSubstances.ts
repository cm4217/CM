import { LS_RECENT_SUBSTANCES } from "./storageKeys";

const MAX = 20;

export function loadRecentSubstanceIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_RECENT_SUBSTANCES);
    if (!raw) return [];
    const arr = JSON.parse(raw) as string[];
    return Array.isArray(arr) ? arr.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function pushRecentSubstanceId(id: string) {
  const t = (id || "").trim();
  if (!t || typeof window === "undefined") return;
  const prev = loadRecentSubstanceIds().filter((x) => x !== t);
  const next = [t, ...prev].slice(0, MAX);
  localStorage.setItem(LS_RECENT_SUBSTANCES, JSON.stringify(next));
}
