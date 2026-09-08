import { substances, impurities } from "@/data";
import type { ChangeEvent } from "./types";
import type { WatchlistItem } from "./watchlistStorage";

export type ImpactHit = {
  query: string;
  nameZh: string;
  nameEn?: string;
  kind: "substance" | "impurity" | "external";
  id?: string;
  matchedOn: string[];
};

function tokensFromEvent(event: ChangeEvent, extraKeywords: string[] = []): string[] {
  const blob = [
    event.titleZh,
    event.titleEn,
    event.summaryZh,
    event.summaryEn,
    ...extraKeywords,
  ]
    .filter(Boolean)
    .join(" ");
  const raw = blob
    .split(/[\s,，、;；|/]+/)
    .map((x) => x.trim().toLowerCase())
    .filter((x) => x.length >= 2);
  return Array.from(new Set(raw));
}

function collectTerms(item: WatchlistItem): { label: string; terms: string[] } {
  const terms: string[] = [item.query];
  const r = item.resolved;
  if (r.status === "matched") {
    terms.push(r.nameZh, r.nameEn, r.cas || "", r.unii || "", r.inn || "");
    if (r.kind === "substance") {
      const s = substances.find((x) => x.id === r.id);
      if (s) terms.push(...s.aliases, s.inn || "", s.cas || "");
    } else {
      const i = impurities.find((x) => x.id === r.id);
      if (i) terms.push(i.chemicalName || "", i.cas || "");
    }
  } else if (r.status === "external") {
    terms.push(r.nameHint, r.cas || "");
  }
  return {
    label: r.status === "matched" ? r.nameZh : item.query,
    terms: terms.filter(Boolean).map((t) => t.toLowerCase()),
  };
}

/** Watchlist items whose names/aliases/CAS overlap event title/body/keywords. */
export function analyzeAlertImpact(
  event: ChangeEvent,
  watchlist: WatchlistItem[],
  extraKeywords: string[] = []
): ImpactHit[] {
  const eventTokens = tokensFromEvent(event, extraKeywords);
  const eventBlob = [
    event.titleZh,
    event.titleEn,
    event.summaryZh,
    event.summaryEn,
    ...extraKeywords,
  ]
    .join(" ")
    .toLowerCase();

  const relatedIds = new Set([
    ...(event.relatedSubstanceIds || []),
    ...(event.relatedImpurityIds || []),
  ]);

  const hits: ImpactHit[] = [];

  for (const item of watchlist) {
    const { terms } = collectTerms(item);
    const matchedOn: string[] = [];

    if (item.resolved.status === "matched" && relatedIds.has(item.resolved.id)) {
      matchedOn.push("事件关联 ID");
    }

    for (const t of terms) {
      if (t.length < 2) continue;
      if (eventBlob.includes(t) || eventTokens.some((et) => et === t || et.includes(t) || t.includes(et))) {
        matchedOn.push(t);
      }
    }

    if (matchedOn.length === 0) continue;

    const r = item.resolved;
    hits.push({
      query: item.query,
      nameZh: r.status === "matched" ? r.nameZh : r.status === "external" ? r.nameHint : item.query,
      nameEn: r.status === "matched" ? r.nameEn : undefined,
      kind: r.status === "matched" ? r.kind : "external",
      id: r.status === "matched" ? r.id : undefined,
      matchedOn: Array.from(new Set(matchedOn)).slice(0, 6),
    });
  }

  return hits;
}
