import { LS_WATCHLIST } from "./storageKeys";

export type WatchlistItem = {
  /** 输入原串 */
  query: string;
  /** 解析结果 */
  resolved:
    | {
        status: "matched";
        kind: "substance" | "impurity";
        id: string;
        nameZh: string;
        nameEn: string;
        inn?: string;
        cas?: string;
        unii?: string;
        coverage: string;
      }
    | {
        status: "external";
        nameHint: string;
        cas?: string;
        pubchemUrl?: string;
        note: string;
      }
    | { status: "unresolved"; note: string };
  addedAt: string;
};

export function loadWatchlist(): WatchlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_WATCHLIST);
    if (!raw) return [];
    return JSON.parse(raw) as WatchlistItem[];
  } catch {
    return [];
  }
}

export function saveWatchlist(items: WatchlistItem[]) {
  localStorage.setItem(LS_WATCHLIST, JSON.stringify(items));
}
