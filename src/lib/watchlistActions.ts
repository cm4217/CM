import { substances, impurities } from "@/data";
import {
  loadWatchlist,
  saveWatchlist,
  type WatchlistItem,
} from "./watchlistStorage";

function coverageOfSubstance(id: string): string {
  const s = substances.find((x) => x.id === id);
  if (!s) return "—";
  const ph = Array.from(new Set(s.monographRefs.map((m) => m.pharmacopoeia)));
  return `${ph.join("/")} · 专论 ${s.monographRefs.length} · 杂质 ${s.relatedImpurityIds.length}`;
}

/** Add a known seed substance to watchlist (dedupe by resolved id / query). */
export function addSubstanceToWatchlist(substanceId: string): {
  ok: boolean;
  message: string;
} {
  const s = substances.find((x) => x.id === substanceId);
  if (!s) return { ok: false, message: "物质未找到" };
  const items = loadWatchlist();
  const exists = items.some(
    (it) =>
      (it.resolved.status === "matched" &&
        it.resolved.kind === "substance" &&
        it.resolved.id === substanceId) ||
      it.query.trim().toLowerCase() === s.nameZh.toLowerCase() ||
      it.query.trim().toLowerCase() === s.nameEn.toLowerCase()
  );
  if (exists) return { ok: true, message: "已在关注列表" };

  const entry: WatchlistItem = {
    query: s.nameZh,
    resolved: {
      status: "matched",
      kind: "substance",
      id: s.id,
      nameZh: s.nameZh,
      nameEn: s.nameEn,
      inn: s.inn,
      cas: s.cas,
      unii: s.unii,
      coverage: coverageOfSubstance(s.id),
    },
    addedAt: new Date().toISOString(),
  };
  saveWatchlist([entry, ...items]);
  return { ok: true, message: "已加关注" };
}

export function addImpurityToWatchlist(impurityId: string): {
  ok: boolean;
  message: string;
} {
  const i = impurities.find((x) => x.id === impurityId);
  if (!i) return { ok: false, message: "杂质未找到" };
  const items = loadWatchlist();
  const exists = items.some(
    (it) =>
      (it.resolved.status === "matched" &&
        it.resolved.kind === "impurity" &&
        it.resolved.id === impurityId) ||
      it.query.trim().toLowerCase() === i.nameZh.toLowerCase()
  );
  if (exists) return { ok: true, message: "已在关注列表" };
  const entry: WatchlistItem = {
    query: i.nameZh,
    resolved: {
      status: "matched",
      kind: "impurity",
      id: i.id,
      nameZh: i.nameZh,
      nameEn: i.nameEn,
      cas: i.cas,
      unii: i.unii,
      coverage: `杂质 · ${i.type} · 父物质 ${i.parentSubstanceIds.length}`,
    },
    addedAt: new Date().toISOString(),
  };
  saveWatchlist([entry, ...items]);
  return { ok: true, message: "已加关注" };
}
