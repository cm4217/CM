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

export type IndexLayer = "curated" | "user" | "draft" | "open";

export type RankableDoc = {
  kind: SearchHit["kind"];
  id: string;
  titleZh: string;
  titleEn: string;
  synonyms: string[];
  initials: string;
  cas?: string;
  unii?: string;
  pharmacopoeias: string[];
  hasRS: boolean;
  hasVerifiedDocId: boolean;
  hasDeepLink: boolean;
  impurityCount?: number;
  impurityType?: ImpurityType;
  fuseScore?: number; // lower better (fuse)
  matchedVia?: MatchTier;
  parentIds?: string[];
  parentNames?: string[];
  molecularFormula?: string;
  pharmaVersions?: string[];
  efficacyStatuses?: string[];
  /** curated > user > draft > open */
  indexLayer?: IndexLayer;
  brandName?: string;
  genericName?: string;
  dosageForm?: string;
  countryTags?: string[];
  regionTags?: string[];
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
  const names = [
    doc.titleZh,
    doc.titleEn,
    doc.brandName || "",
    doc.genericName || "",
    ...doc.synonyms,
  ]
    .filter(Boolean)
    .map(norm);
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

function uniiExactHit(doc: RankableDoc, raw: string): boolean {
  const q = norm(raw);
  if (!q || !doc.unii) return false;
  // bare UNII (10 alnum) or "unii:XXXX"
  const bare = q.replace(/^unii\s*[:=]?\s*/i, "").replace(/[\s-]/g, "");
  if (!/^[a-z0-9]{10}$/i.test(bare)) return false;
  return norm(doc.unii) === bare;
}

function brandOrInnExact(doc: RankableDoc, terms: string[]): "brand" | "inn" | null {
  const brand = norm(doc.brandName || "");
  const generic = norm(doc.genericName || "");
  for (const t of terms) {
    const n = norm(t);
    if (!n) continue;
    if (brand && brand === n) return "brand";
    // Chinese brand often sits only in synonyms / titleZh for drugs
    if (doc.kind === "drug") {
      const zh = norm(doc.titleZh);
      if (zh && zh === n && /[\u4e00-\u9fff]/.test(doc.titleZh)) return "brand";
    }
    if (generic && generic === n) return "inn";
  }
  return null;
}

export function classifyTier(
  doc: RankableDoc,
  ctx: RankContext
): MatchTier {
  if (casExactHit(doc, ctx.parsed.cas)) return "cas";
  if (uniiExactHit(doc, ctx.parsed.raw) || uniiExactHit(doc, ctx.parsed.core)) {
    return "exact";
  }
  const terms = [
    ctx.parsed.raw,
    ctx.parsed.core,
    ...ctx.parsed.zhParts,
    ...ctx.parsed.enParts,
  ].filter(Boolean);
  if (exactNameHit(doc, terms)) return "exact";
  if (brandOrInnExact(doc, terms)) return "exact";
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
  let reason = MATCH_REASON_ZH[tier];

  const terms = [
    ctx.parsed.raw,
    ctx.parsed.core,
    ...ctx.parsed.zhParts,
    ...ctx.parsed.enParts,
  ].filter(Boolean);

  // Exact ID boosts — CAS / UNII / brand / INN
  if (casExactHit(doc, ctx.parsed.cas)) {
    score += 120;
    reason = "CAS 精确";
  }
  if (uniiExactHit(doc, ctx.parsed.raw) || uniiExactHit(doc, ctx.parsed.core)) {
    score += 130;
    reason = "UNII 精确";
  }
  const brandInn = brandOrInnExact(doc, terms);
  if (brandInn === "brand") {
    score += 90;
    reason = "商品名精确";
  } else if (brandInn === "inn") {
    score += 70;
    reason = "INN/通用名精确";
  } else if (exactNameHit(doc, terms) && tier === "exact") {
    score += 55;
  }

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

  // 物质优先于成药优先于杂质优先于对照品（同档内）
  if (doc.kind === "substance") score += 8;
  else if (doc.kind === "drug") score += 6;
  else if (doc.kind === "impurity") score += 4;
  else if (doc.kind === "rs") score -= 30;

  // 索引层：精选种子优先，保证 golden / 精选不被开放库盖过
  const layerBoost: Record<string, number> = {
    curated: 200,
    user: 100,
    draft: 50,
    open: 0,
  };
  score += layerBoost[doc.indexLayer || "curated"] ?? 0;

  // Soft-penalize weak open-index fuzzy noise so curated / exact stay on top
  if (doc.indexLayer === "open" && (tier === "fuzzy" || tier === "relaxed")) {
    score -= 90;
  }
  if (doc.indexLayer === "open" && tier === "pinyin") {
    score -= 25;
  }
  // Extra curated sticky boost on fuzzy so demo goldens beat open tails on typos
  if ((doc.indexLayer || "curated") === "curated" && (tier === "fuzzy" || tier === "relaxed")) {
    score += 40;
  }

  // Prefer substance over drug when query has no dosage and names collide
  if (
    ctx.parsed.dosageForms.length === 0 &&
    doc.kind === "drug" &&
    (tier === "synonym" || tier === "fuzzy" || tier === "relaxed")
  ) {
    score -= 12;
  }

  if (ctx.parsed.dosageForms.length > 0) {
    if (doc.kind === "drug" && doc.dosageForm) {
      const df = doc.dosageForm.toLowerCase();
      const hit = ctx.parsed.dosageForms.some((f) => {
        const fl = f.toLowerCase();
        return (
          df.includes(fl) ||
          (fl === "tablet" && df.includes("tablet")) ||
          (fl === "片" && df.includes("tablet")) ||
          (fl === "capsule" && df.includes("capsule")) ||
          (fl === "胶囊" && df.includes("capsule")) ||
          (fl === "injection" && (df.includes("inject") || df.includes("solution")))
        );
      });
      if (hit) score += 50;
      else if (ctx.dosageMismatchPenalty) score -= 20;
    } else if (ctx.dosageMismatchPenalty && doc.kind !== "drug") {
      // 种子库为原料药索引，剂型查询命中原料 → 轻罚
      score -= 40;
    }
  }

  return {
    score,
    tier,
    reason,
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
  /** 杂质结果：父品种 */
  parentDrug: FacetBucket[];
  molecularFormula: FacetBucket[];
  pharmaVersion: FacetBucket[];
  efficacy: FacetBucket[];
  /** 索引来源：精选 / 开放等 */
  indexSource: FacetBucket[];
  /** 成药地区 */
  region: FacetBucket[];
};

const IMPURITY_TYPE_LABEL: Record<string, string> = {
  process: "工艺杂质",
  degradation: "降解杂质",
  nitrosamine: "亚硝胺",
  residual_solvent: "残留溶剂",
  elemental: "元素杂质",
  other: "其他",
};

function countMapToBuckets(
  map: Map<string, { label: string; count: number }>,
  limit = 12
): FacetBucket[] {
  return Array.from(map.entries())
    .map(([value, v]) => ({ value, label: v.label, count: v.count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "zh"))
    .slice(0, limit);
}

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
  const parentMap = new Map<string, { label: string; count: number }>();
  const formulaMap = new Map<string, { label: string; count: number }>();
  const versionMap = new Map<string, { label: string; count: number }>();
  const efficacyMap = new Map<string, { label: string; count: number }>();
  let curatedN = 0;
  let openN = 0;
  let userN = 0;
  let draftN = 0;
  const regionMap = new Map<string, { label: string; count: number }>();
  const REGION_LABEL: Record<string, string> = {
    US: "美国",
    EU: "欧盟",
    UK: "英国",
    JP: "日本",
    CN: "中国",
    WHO: "WHO基本药物",
    global: "全球",
  };

  for (const h of hits) {
    const layer = h.indexLayer || "curated";
    if (layer === "open") openN++;
    else if (layer === "user") userN++;
    else if (layer === "draft") draftN++;
    else curatedN++;
    if (h.cas) withCas++;
    else withoutCas++;
    const deep = !!(h.epTextNumber || h.uspDoi || h.phIntDocPath || h.unii || h.hasDeepLink);
    if (deep) withDeep++;
    else withoutDeep++;
    if (h.kind === "impurity" && h.impurityType) {
      impTypeCounts.set(
        h.impurityType,
        (impTypeCounts.get(h.impurityType) || 0) + 1
      );
    }
    if (h.kind === "impurity") {
      const ids = h.parentIds || [];
      const names = h.parentNames || [];
      for (let i = 0; i < Math.max(ids.length, names.length); i++) {
        const id = ids[i] || names[i];
        const label = names[i] || ids[i] || id;
        if (!id) continue;
        const prev = parentMap.get(id);
        if (prev) prev.count++;
        else parentMap.set(id, { label: `父品种：${label}`, count: 1 });
      }
    }
    if (h.molecularFormula) {
      const f = h.molecularFormula;
      const prev = formulaMap.get(f);
      if (prev) prev.count++;
      else formulaMap.set(f, { label: f, count: 1 });
    }
    for (const v of h.pharmaVersions || []) {
      const prev = versionMap.get(v);
      if (prev) prev.count++;
      else versionMap.set(v, { label: v, count: 1 });
    }
    for (const e of h.efficacyStatuses || []) {
      const prev = efficacyMap.get(e);
      if (prev) prev.count++;
      else efficacyMap.set(e, { label: e, count: 1 });
    }
    if (h.kind === "drug") {
      for (const r of [...(h.countryTags || []), ...(h.regionTags || [])]) {
        if (!r || r === "global") continue;
        const prev = regionMap.get(r);
        const label = REGION_LABEL[r] || r;
        if (prev) prev.count++;
        else regionMap.set(r, { label: `地区：${label}`, count: 1 });
      }
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
    parentDrug: countMapToBuckets(parentMap),
    molecularFormula: countMapToBuckets(formulaMap),
    pharmaVersion: countMapToBuckets(versionMap),
    efficacy: countMapToBuckets(efficacyMap),
    indexSource: [
      { value: "curated", label: "仅精选种子", count: curatedN },
      { value: "open", label: "开放索引", count: openN },
      { value: "user", label: "用户导入", count: userN },
      { value: "draft", label: "缓存草稿", count: draftN },
    ].filter((b) => b.count > 0),
    region: countMapToBuckets(regionMap, 10),
  };
}

export type { PharmacopoeiaCode };
