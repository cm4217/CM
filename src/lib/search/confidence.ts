import type { SearchHit } from "@/lib/types";
import type { MatchTier } from "./rank";

/** Minimum score margin (top1 − top2) to show Best Match Hero for non-exact tiers */
export const HERO_SCORE_MARGIN = 80;

const ALWAYS_HERO: Set<MatchTier> = new Set(["cas", "exact"]);

const TIER_BASE: Record<string, number> = {
  cas: 1000,
  exact: 900,
  synonym: 700,
  pinyin: 550,
  fuzzy: 400,
  relaxed: 300,
};

export function deriveScore(hit: SearchHit): number {
  if (typeof hit.rankScore === "number") return hit.rankScore;
  const base = hit.matchTier ? TIER_BASE[hit.matchTier] ?? 350 : 350;
  const coverage = Math.min(hit.pharmacopoeias?.length || 0, 6) * 12;
  return base + coverage + (hit.kind === "substance" ? 8 : 0);
}

export type HeroDecision = {
  showHero: boolean;
  margin: number;
  closeTop2: boolean;
  reason: "cas_exact" | "score_margin" | "ambiguous";
};

/**
 * Best Match confidence gate:
 * show Hero only when top score margin vs #2 exceeds threshold OR tier is cas/exact.
 */
export function decideHero(hits: SearchHit[]): HeroDecision {
  const top = hits[0];
  if (!top) {
    return { showHero: false, margin: 0, closeTop2: false, reason: "ambiguous" };
  }

  const s1 = deriveScore(top);
  const s2 = hits[1] ? deriveScore(hits[1]) : 0;
  const margin = hits[1] ? s1 - s2 : s1;

  if (top.matchTier && ALWAYS_HERO.has(top.matchTier)) {
    return {
      showHero: true,
      margin,
      closeTop2: margin < HERO_SCORE_MARGIN,
      reason: "cas_exact",
    };
  }

  if (margin >= HERO_SCORE_MARGIN) {
    return {
      showHero: true,
      margin,
      closeTop2: false,
      reason: "score_margin",
    };
  }

  return {
    showHero: false,
    margin,
    closeTop2: !!hits[1],
    reason: "ambiguous",
  };
}
