/**
 * 分层排序：exact > synonym > pinyin > fuzzy
 * 加权：药典覆盖、hasRS、已核验文档 ID；剂型不匹配降权。
 */

import type { ImpurityType, PharmacopoeiaCode, SearchHit } from "@/lib/types";
import type { ParsedQuery } from "./parseQuery";

export type MatchTier = "exact" | "cas" | "synonym" | "pinyin" | "fuzzy" | "relaxed";

export const MATCH_REASON_ZH: Record<MatchTier, string> = {
  exact: "精确名称",
  cas: "CAS 精确",
  synonym: "同义词",
  pinyin: "拼音首字母",
  fuzzy: "模糊匹配",
  relaxed: "放宽匹配",
};

export type RankableDoc = {
  kind: SearchHit["kind"];
  id: string;
  titleZh: string;
  titleEn: string;
  synonyms: string[];
  initials: string;
  cas?: string;
  pharmacopoeias: string[];
  hasRS: boolean;
  hasVerifiedDocId: boolean;
  hasDeepLink: boolean;
  impurityCount?: number;
  impurityType?: ImpurityType;
  fuseScore?: number; // lower better (fuse)
  matchedVia?: MatchTier;
};

export type RankContext = {
  parsed: ParsedQuery;
  synonymTerms: Set<string>;
  /** 查询含剂型但文档为原料/杂质（无剂型字段）→ 轻度降权提示 */
  dosageMismatchPenalty: boolean;
  relaxed: boolean;
};

function norm(s: string) {
  return s.trim().toLowerCase();
}

function exactNameHit(doc: RankableDoc, terms: string[]): boolean {
  const names = [doc.titleZh, doc.titleEn, ...doc.synonyms].map(norm);
  return terms.some((t) => {
    const n = norm(t);
    return names.some((name) => name === n);
  });
}

function synonymHit(doc: RankableDoc, synonymTerms: Set<string>): boolean {
  const names = [doc.titleZh, doc.titleEn, ...doc.synonyms].map(norm);
  for (const s of Array.from(synonymTerms)) {
    const n = norm(s);
    if (names.some((name) => name === n || name.includes(n) || n.includes(name))) {
      return true;
    }
  }
  return false;
}

function pinyinHit(doc: RankableDoc, q: string): boolean {
  const qq = norm(q).replace(/\s+/g, "");
  if (!qq || !/^[a-z]+$/.test(qq)) return false;
  return !!(doc.initials && doc.initials.includes(qq));
}

function casExactHit(doc: RankableDoc, cas?: string): boolean {
  if (!cas || !doc.cas) return false;
  return norm(doc.cas) === norm(cas);
}

export function classifyTier(
  doc: RankableDoc,
  ctx: RankContext
): MatchTier {
  if (casExactHit(doc, ctx.parsed.cas)) return "cas";
  const terms = [
    ctx.parsed.raw,
    ctx.parsed.core,
    ...ctx.parsed.zhParts,
    ...ctx.parsed.enParts,
  ].filter(Boolean);
  if (exactNameHit(doc, terms)) return "exact";
  if (synonymHit(doc, ctx.synonymTerms)) return "synonym";
  if (
    pinyinHit(doc, ctx.parsed.raw) ||
    pinyinHit(doc, ctx.parsed.core) ||
    ctx.parsed.tokens.some((t) => pinyinHit(doc, t))
  ) {
    return "pinyin";
  }
  if (ctx.relaxed) return "relaxed";
  return "fuzzy";
}

const TIER_BASE: Record<MatchTier, number> = {
  cas: 1000,
  exact: 900,
  synonym: 700,
  pinyin: 550,
  fuzzy: 400,
  relaxed: 300,
};

export function scoreDoc(doc: RankableDoc, ctx: RankContext): {
  score: number;
  tier: MatchTier;
  reason: string;
} {
  const tier = doc.matchedVia || classifyTier(doc, ctx);
  let score = TIER_BASE[tier];

  // fuse：分数越低越好 → 转为加分
  if (typeof doc.fuseScore === "number") {
    score += Math.max(0, (1 - doc.fuseScore) * 80);
  }

  // 药典覆盖
  score += Math.min(doc.pharmacopoeias.length, 6) * 12;

  // hasRS 仅对物质/杂质加权；对照品本身即 RS，避免盖过化学实体
  if (doc.hasRS && doc.kind !== "rs") score += 25;
  if (doc.hasVerifiedDocId) score += 35;
  if (doc.hasDeepLink && doc.kind !== "rs") score += 15;

  // 物质优先于杂质优先于对照品（同档内）
  if (doc.kind === "substance") score += 8;
  else if (doc.kind === "impurity") score += 4;
  else if (doc.kind === "rs") score -= 30;

  if (ctx.dosageMismatchPenalty && ctx.parsed.dosageForms.length > 0) {
    // 种子库为原料药索引，剂型查询命中原料 → 轻罚
    score -= 40;
  }

  return {
    score,
    tier,
    reason: MATCH_REASON_ZH[tier],
  };
}

export function rankDocs(
  docs: RankableDoc[],
  ctx: RankContext
): { doc: RankableDoc; score: number; tier: MatchTier; reason: string }[] {
  const scored = docs.map((doc) => {
    const r = scoreDoc(doc, ctx);
    return { doc, ...r };
  });
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // 稳定：药典数、名称
    const pc =
      (b.doc.pharmacopoeias?.length || 0) - (a.doc.pharmacopoeias?.length || 0);
    if (pc !== 0) return pc;
    return a.doc.titleZh.localeCompare(b.doc.titleZh, "zh");
  });
  return scored;
}

export function hasVerifiedDocIds(opts: {
  epIdStatus?: string;
  uspDoiStatus?: string;
  phIntIdStatus?: string;
  monographRefs?: { idStatus?: string }[];
}): boolean {
  if (opts.epIdStatus === "verified") return true;
  if (opts.uspDoiStatus === "verified") return true;
  if (opts.phIntIdStatus === "verified") return true;
  return !!(opts.monographRefs || []).some((m) => m.idStatus === "verified");
}

export function hasDeepLinkFields(opts: {
  epTextNumber?: string;
  uspDoi?: string;
  phIntDocPath?: string;
  unii?: string;
}): boolean {
  return !!(opts.epTextNumber || opts.uspDoi || opts.phIntDocPath || opts.unii);
}

export type FacetBucket = { value: string; label: string; count: number };

export type SearchFacets = {
  dosageForm: FacetBucket[];
  hasCAS: FacetBucket[];
  hasDeepLink: FacetBucket[];
  impurityType: FacetBucket[];
};

const IMPURITY_TYPE_LABEL: Record<string, string> = {
  process: "工艺杂质",
  degradation: "降解杂质",
  nitrosamine: "亚硝胺",
  residual_solvent: "残留溶剂",
  elemental: "元素杂质",
  other: "其他",
};

export function buildFacets(
  hits: SearchHit[],
  parsed: ParsedQuery
): SearchFacets {
  const dosageForm: FacetBucket[] = parsed.dosageForms.map((f) => ({
    value: f,
    label: `剂型：${f}`,
    count: hits.length,
  }));

  let withCas = 0;
  let withoutCas = 0;
  let withDeep = 0;
  let withoutDeep = 0;
  const impTypeCounts = new Map<string, number>();

  for (const h of hits) {
    if (h.cas) withCas++;
    else withoutCas++;
    const deep = !!(h.epTextNumber || h.uspDoi || h.phIntDocPath || h.unii);
    if (deep) withDeep++;
    else withoutDeep++;
    if (h.kind === "impurity" && h.impurityType) {
      impTypeCounts.set(
        h.impurityType,
        (impTypeCounts.get(h.impurityType) || 0) + 1
      );
    }
  }

  return {
    dosageForm,
    hasCAS: [
      { value: "yes", label: "有 CAS", count: withCas },
      { value: "no", label: "无 CAS", count: withoutCas },
    ].filter((b) => b.count > 0),
    hasDeepLink: [
      { value: "yes", label: "有文档直达", count: withDeep },
      { value: "no", label: "无文档直达", count: withoutDeep },
    ].filter((b) => b.count > 0),
    impurityType: Array.from(impTypeCounts.entries()).map(([value, count]) => ({
      value,
      label: IMPURITY_TYPE_LABEL[value] || value,
      count,
    })),
  };
}

export type { PharmacopoeiaCode };
