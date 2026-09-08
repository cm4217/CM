import Fuse from "fuse.js";
import { pinyin } from "pinyin-pro";
import {
  substances,
  impurities,
  referenceMaterials,
} from "@/data";
import { openSubstances } from "@/data/openSubstances.generated";
import { openDrugProducts } from "@/data/openDrugProducts.generated";
import {
  loadDrafts,
  loadUserImports,
  type IndexLayer,
} from "./runtimeIndex";
import type {
  ImpurityType,
  PharmacopoeiaCode,
  SearchHit,
  SubstanceType,
} from "./types";
import {
  expandQueryWithSynonyms,
  matchPinyinInitials,
  PINYIN_INITIALS,
} from "./synonyms";
import {
  buildSearchTerms,
  parseQuery,
  type ParsedQuery,
  type RelaxMode,
} from "./search/parseQuery";
import {
  buildFacets,
  classifyTier,
  hasDeepLinkFields,
  hasVerifiedDocIds,
  MATCH_REASON_ZH,
  rankDocs,
  type MatchTier,
  type RankableDoc,
  type SearchFacets,
} from "./search/rank";
import { meiliSearchCandidates, meiliConfigured } from "./search/meili";
import { buildEvidence } from "./search/evidence";

function norm(s: string) {
  return s.trim().toLowerCase();
}

function includes(hay: string | undefined, q: string) {
  if (!hay) return false;
  return norm(hay).includes(q);
}

function zhInitials(text: string): string {
  if (PINYIN_INITIALS[text]) return PINYIN_INITIALS[text];
  // 仅对汉字取首字母，避免名称中夹带的 NDMA/ASA 等拉丁缩写污染 initials
  const zhOnly = (text || "").replace(/[^一-鿿]/g, "");
  if (!zhOnly) return "";
  try {
    return pinyin(zhOnly, { pattern: "first", toneType: "none", type: "array" })
      .join("")
      .toLowerCase()
      .replace(/[^a-z]/g, "");
  } catch {
    return "";
  }
}

export interface SearchFilters {
  q?: string;
  pharmacopoeia?: PharmacopoeiaCode | "";
  type?: string;
  hasRS?: "yes" | "no" | "";
  hasCAS?: "yes" | "no" | "";
  hasDeepLink?: "yes" | "no" | "";
  impurityType?: ImpurityType | "";
  /** 杂质父品种 id */
  parentId?: string;
  /** 剂型分面（查询侧提示，可点击） */
  dosageForm?: string;
  molecularFormula?: string;
  pharmaVersion?: string;
  efficacy?: string;
  /** 放宽步骤：dosage | salt | fuzzy */
  relax?: string;
  /** 阻止自动放宽 */
  strict?: "1" | "";
  titleOnly?: "1" | "";
  /** curated = 仅精选种子；空/all = 含开放索引等 */
  indexSource?: "curated" | "open" | "user" | "draft" | "all" | "";
  /** 成药地区分面：US / EU / UK / JP / CN / WHO … */
  region?: string;
}

type Doc = RankableDoc & {
  subtitle?: string;
  badges: string[];
  blob: string;
  type?: string;
  unii?: string;
  epTextNumber?: string;
  uspDoi?: string;
  phIntDocPath?: string;
  summary?: string;
  parentNames?: string[];
  ichTags?: string[];
  substanceType?: SubstanceType;
  inn?: string;
  impurityPreview?: string[];
  description: string;
  inchiKey?: string;
  indexLayer: IndexLayer;
  brandName?: string;
  genericName?: string;
  strength?: string;
  dosageForm?: string;
  countryTags?: string[];
  regionTags?: string[];
  parentSubstanceId?: string;
};

function buildDocs(): Doc[] {
  const docs: Doc[] = [];
  const substanceById = new Map(substances.map((s) => [s.id, s]));
  const impurityById = new Map(impurities.map((i) => [i.id, i]));

  for (const s of substances) {
    const initials = zhInitials(s.nameZh);
    const anyRS =
      s.monographRefs.some((m) => m.hasRS) || s.relatedRSIds.length > 0;
    const pharmas = Array.from(
      new Set(s.monographRefs.map((m) => m.pharmacopoeia))
    ) as PharmacopoeiaCode[];
    const preview = s.relatedImpurityIds
      .map((id) => impurityById.get(id)?.nameZh)
      .filter(Boolean)
      .slice(0, 3) as string[];
    const synonyms = [
      ...(s.inn ? [s.inn] : []),
      ...s.aliases,
    ];
    docs.push({
      kind: "substance",
      id: s.id,
      titleZh: s.nameZh,
      titleEn: s.nameEn,
      subtitle: [s.inn, s.cas ? `CAS ${s.cas}` : null]
        .filter(Boolean)
        .join(" · "),
      badges: ["示例数据", s.type, ...pharmas],
      blob: [
        s.nameZh,
        s.nameEn,
        s.inn,
        s.cas,
        s.unii,
        ...s.aliases,
        initials,
      ]
        .filter(Boolean)
        .join(" "),
      synonyms,
      initials,
      pharmacopoeias: pharmas,
      hasRS: anyRS,
      hasVerifiedDocId: hasVerifiedDocIds({
        epIdStatus: s.epIdStatus,
        uspDoiStatus: s.uspDoiStatus,
        phIntIdStatus: s.phIntIdStatus,
        monographRefs: s.monographRefs,
      }),
      hasDeepLink: hasDeepLinkFields({
        epTextNumber: s.epTextNumber,
        uspDoi: s.uspDoi,
        phIntDocPath: s.phIntDocPath,
        unii: s.unii,
      }),
      type: s.type,
      impurityCount: s.relatedImpurityIds.length,
      cas: s.cas,
      unii: s.unii,
      epTextNumber: s.epTextNumber,
      uspDoi: s.uspDoi,
      phIntDocPath: s.phIntDocPath,
      summary: s.summaryZh,
      substanceType: s.type,
      inn: s.inn,
      impurityPreview: preview,
      inchiKey: s.inchiKey,
      description: s.summaryZh || "",
      molecularFormula: s.molecularFormula,
      pharmaVersions: Array.from(
        new Set(s.monographRefs.map((m) => m.version).filter(Boolean))
      ),
      efficacyStatuses: Array.from(
        new Set(s.monographRefs.map((m) => m.efficacy).filter(Boolean))
      ),
      indexLayer: "curated",
    });
  }
  for (const i of impurities) {
    const initials = zhInitials(i.nameZh);
    const parentNames = i.parentSubstanceIds
      .map((id) => substanceById.get(id)?.nameZh)
      .filter(Boolean) as string[];
    const synonyms = [
      ...(i.chemicalName ? [i.chemicalName] : []),
      ...i.namingCrosswalk.map((n) => n.name),
    ];
    docs.push({
      kind: "impurity",
      id: i.id,
      titleZh: i.nameZh,
      titleEn: i.nameEn,
      subtitle: [i.chemicalName, i.cas ? `CAS ${i.cas}` : null, i.type]
        .filter(Boolean)
        .join(" · "),
      badges: ["示例数据", "杂质", i.type, ...i.ichTags.slice(0, 2)],
      blob: [
        i.nameZh,
        i.nameEn,
        i.chemicalName,
        i.cas,
        i.type,
        ...i.namingCrosswalk.map((n) => n.name),
        ...parentNames,
        initials,
      ]
        .filter(Boolean)
        .join(" "),
      synonyms,
      initials,
      pharmacopoeias: i.namingCrosswalk.map((n) => n.system),
      hasRS: i.relatedRSIds.length > 0,
      hasVerifiedDocId: false,
      hasDeepLink: !!(i.cas || i.unii),
      type: "impurity",
      cas: i.cas,
      unii: i.unii,
      summary: i.summaryZh,
      impurityType: i.type,
      parentIds: i.parentSubstanceIds,
      parentNames,
      ichTags: i.ichTags,
      inchiKey: i.inchiKey,
      description: i.summaryZh || "",
      molecularFormula: i.molecularFormula,
      indexLayer: "curated",
    });
  }
  for (const r of referenceMaterials) {
    docs.push({
      kind: "rs",
      id: r.id,
      titleZh: r.nameZh,
      titleEn: r.nameEn,
      subtitle: `${r.issuer} · ${r.catalogCode}`,
      badges: ["示例数据", "对照品", r.issuer, r.status],
      blob: [r.nameZh, r.nameEn, r.catalogCode, r.issuer, r.cas, r.notes]
        .filter(Boolean)
        .join(" "),
      synonyms: [r.catalogCode, r.issuer].filter(Boolean),
      initials: "",
      pharmacopoeias: [],
      hasRS: true,
      hasVerifiedDocId: false,
      hasDeepLink: !!r.officialUrl,
      type: "rs",
      cas: r.cas,
      description: r.notes || "",
      indexLayer: "curated",
    });
  }

  // Open identity bulk (dedup vs curated by cas/unii/nameEn)
  // Map curated doc index for synonym merge when open row is deduped away
  const curatedDocByKey = new Map<string, Doc>();
  for (const d of docs) {
    if (d.kind !== "substance") continue;
    if (d.cas) curatedDocByKey.set("cas:" + norm(d.cas), d);
    if (d.unii) curatedDocByKey.set("unii:" + norm(d.unii), d);
    curatedDocByKey.set("en:" + norm(d.titleEn), d);
    curatedDocByKey.set("zh:" + norm(d.titleZh), d);
  }
  const curatedKeys = new Set(curatedDocByKey.keys());
  for (const o of openSubstances) {
    const keys = [
      o.cas ? "cas:" + norm(o.cas) : "",
      o.unii ? "unii:" + norm(o.unii) : "",
      "en:" + norm(o.nameEn),
      o.nameZh ? "zh:" + norm(o.nameZh) : "",
    ].filter(Boolean);
    if (keys.some((k) => curatedKeys.has(k))) {
      // Merge brand/INN synonyms into curated doc so Lipitor/Tamiflu/Glucophage still hit
      const target = keys.map((k) => curatedDocByKey.get(k)).find(Boolean);
      if (target && o.synonyms?.length) {
        const extra = o.synonyms.filter(Boolean);
        const set = new Set([...(target.synonyms || []), ...extra].map((s) => s.trim()));
        target.synonyms = Array.from(set);
        target.blob = [target.blob, ...extra].filter(Boolean).join(" ");
      }
      continue;
    }
    const titleZh = o.nameZh || o.nameEn;
    const initials = zhInitials(titleZh);
    const synonyms = [...(o.synonyms || [])];
    docs.push({
      kind: "substance",
      id: o.id,
      titleZh,
      titleEn: o.nameEn,
      subtitle: [o.cas ? `CAS ${o.cas}` : null, o.unii ? `UNII ${o.unii}` : null]
        .filter(Boolean)
        .join(" · "),
      badges: ["开放索引", "原料药", "identity"],
      blob: [titleZh, o.nameEn, o.cas, o.unii, ...synonyms, initials]
        .filter(Boolean)
        .join(" "),
      synonyms,
      initials,
      pharmacopoeias: [],
      hasRS: false,
      hasVerifiedDocId: false,
      hasDeepLink: !!o.unii,
      type: "API",
      cas: o.cas,
      unii: o.unii,
      inn: o.nameEn,
      summary: "开放原料药 / 物质身份索引（UNII·NDC·seed）· 非药典全文",
      substanceType: "API",
      description: "开放原料药 / 物质身份索引（UNII·NDC·seed）· 非药典全文",
      indexLayer: "open",
    });
  }

  // Global finished-drug products (openFDA NDC + multi-region + CN brands)
  for (const d of openDrugProducts) {
    const cnSyn = (d.synonyms || []).find((s) => /[\u4e00-\u9fff]/.test(s));
    const titleZh =
      (/[\u4e00-\u9fff]/.test(d.brandName || "") ? d.brandName : null) ||
      cnSyn ||
      d.brandName ||
      d.genericName;
    const titleEn = d.brandName || d.genericName;
    const initials = zhInitials(titleZh);
    const synonyms = [
      d.genericName,
      d.inn,
      d.brandName,
      ...(d.synonyms || []),
    ].filter(Boolean) as string[];
    const uniqSyn = Array.from(new Set(synonyms.map((s) => s.trim()).filter(Boolean)));
    const regions = Array.from(
      new Set([...(d.countryTags || []), ...(d.regionTags || [])].filter(Boolean))
    );
    const regionBadge = regions.filter((r) => r !== "global").slice(0, 3);
    docs.push({
      kind: "drug",
      id: d.id,
      titleZh,
      titleEn,
      subtitle: [
        d.genericName && d.genericName !== d.brandName ? d.genericName : null,
        d.strength || null,
        d.dosageForm || null,
        regionBadge.join("/") || null,
      ]
        .filter(Boolean)
        .join(" · "),
      badges: ["成药", "全球成药", ...regionBadge],
      blob: [
        d.brandName,
        d.genericName,
        d.inn,
        d.strength,
        d.dosageForm,
        d.unii,
        d.productNdc,
        d.labelerName,
        ...uniqSyn,
        ...regions,
        initials,
      ]
        .filter(Boolean)
        .join(" "),
      synonyms: uniqSyn,
      initials,
      pharmacopoeias: [],
      hasRS: false,
      hasVerifiedDocId: false,
      hasDeepLink: !!(d.unii || d.productNdc),
      type: "drug",
      cas: undefined,
      unii: d.unii,
      inn: d.inn || d.genericName,
      summary: "全球成药 / 成品制剂身份（多国开放目录 + 中文商品名）· 非药典全文",
      description: "全球成药 / 成品制剂身份（多国开放目录 + 中文商品名）· 非药典全文",
      indexLayer: "open",
      brandName: d.brandName,
      genericName: d.genericName,
      strength: d.strength,
      dosageForm: d.dosageForm,
      countryTags: d.countryTags,
      regionTags: regions,
      parentSubstanceId: d.parentSubstanceId,
    });
  }
  return docs;
}

function buildRuntimeDocs(): Doc[] {
  const docs: Doc[] = [];
  try {
    for (const d of loadDrafts()) {
      const titleZh = d.nameZh || d.name;
      const titleEn = d.nameEn || d.name;
      const initials = zhInitials(titleZh);
      docs.push({
        kind: "substance",
        id: d.id,
        titleZh,
        titleEn,
        subtitle: [d.cas ? `CAS ${d.cas}` : null, d.unii ? `UNII ${d.unii}` : null]
          .filter(Boolean)
          .join(" · "),
        badges: ["缓存草稿", d.source || "draft"],
        blob: [titleZh, titleEn, d.cas, d.unii, d.smiles, initials]
          .filter(Boolean)
          .join(" "),
        synonyms: [d.name, d.nameEn, d.nameZh].filter(Boolean) as string[],
        initials,
        pharmacopoeias: [],
        hasRS: false,
        hasVerifiedDocId: false,
        hasDeepLink: !!(d.unii || d.cid),
        type: "other",
        cas: d.cas,
        unii: d.unii,
        summary: "站外解析缓存草稿 · 可晋升为种子",
        substanceType: "other",
        description: "站外解析缓存草稿 · 可晋升为种子",
        indexLayer: "draft",
      });
    }
  } catch {
    /* ignore fs errors (edge) */
  }
  try {
    for (const u of loadUserImports()) {
      const titleZh = u.nameZh || u.nameEn || u.id;
      const titleEn = u.nameEn || u.nameZh || u.id;
      const initials = zhInitials(titleZh);
      const synonyms = [...(u.synonyms || [])];
      docs.push({
        kind: "substance",
        id: u.id,
        titleZh,
        titleEn,
        subtitle: [u.cas ? `CAS ${u.cas}` : null, u.unii ? `UNII ${u.unii}` : null]
          .filter(Boolean)
          .join(" · "),
        badges: ["用户导入"],
        blob: [titleZh, titleEn, u.cas, u.unii, ...synonyms, initials]
          .filter(Boolean)
          .join(" "),
        synonyms,
        initials,
        pharmacopoeias: [],
        hasRS: false,
        hasVerifiedDocId: false,
        hasDeepLink: !!u.unii,
        type: "other",
        cas: u.cas,
        unii: u.unii,
        summary: "用户 CSV 导入 · 身份层",
        substanceType: "other",
        description: "用户 CSV 导入 · 身份层",
        indexLayer: "user",
      });
    }
  } catch {
    /* ignore */
  }
  return docs;
}

const STATIC_DOCS = buildDocs();

function getAllDocs(): Doc[] {
  return [...STATIC_DOCS, ...buildRuntimeDocs()];
}

/** @deprecated use getAllDocs — kept for sync fuse base */
const ALL_DOCS = STATIC_DOCS;

const FUSE_KEYS = [
  { name: "titleZh", weight: 0.28 },
  { name: "titleEn", weight: 0.2 },
  { name: "synonyms", weight: 0.22 },
  { name: "inn", weight: 0.12 },
  { name: "cas", weight: 0.08 },
  { name: "unii", weight: 0.06 },
  { name: "brandName", weight: 0.08 },
  { name: "genericName", weight: 0.06 },
  { name: "initials", weight: 0.06 },
  { name: "description", weight: 0.04 },
  { name: "blob", weight: 0.08 },
];

function makeFuse(threshold: number) {
  return new Fuse(ALL_DOCS, {
    keys: FUSE_KEYS,
    threshold,
    ignoreLocation: true,
    includeScore: true,
    useTokenSearch: true,
  });
}

const fuseStrict = makeFuse(0.4);
const fuseLoose = makeFuse(0.55);

function toHit(
  d: Doc,
  extra?: { matchTier?: MatchTier; matchReason?: string; rankScore?: number }
): SearchHit {
  const matchTier = extra?.matchTier;
  const matchReason = extra?.matchReason;
  const evidence = buildEvidence({
    kind: d.kind,
    matchTier,
    matchReason,
    cas: d.cas,
    unii: d.unii,
    pharmacopoeias: d.pharmacopoeias as PharmacopoeiaCode[] | undefined,
    pharmaVersions: d.pharmaVersions,
    ichTags: d.ichTags,
    hasRS: d.hasRS,
    hasDeepLink: d.hasDeepLink,
    epTextNumber: d.epTextNumber,
    uspDoi: d.uspDoi,
    molecularFormula: d.molecularFormula,
    impurityType: d.impurityType,
  });
  return {
    kind: d.kind,
    id: d.id,
    titleZh: d.titleZh,
    titleEn: d.titleEn,
    subtitle: d.subtitle,
    badges: d.badges,
    pharmacopoeias: d.pharmacopoeias as PharmacopoeiaCode[] | undefined,
    impurityCount: d.impurityCount,
    hasRS: d.hasRS,
    cas: d.cas,
    unii: d.unii,
    epTextNumber: d.epTextNumber,
    uspDoi: d.uspDoi,
    phIntDocPath: d.phIntDocPath,
    summary: d.summary,
    impurityType: d.impurityType,
    parentIds: d.parentIds,
    parentNames: d.parentNames,
    molecularFormula: d.molecularFormula,
    pharmaVersions: d.pharmaVersions,
    efficacyStatuses: d.efficacyStatuses,
    ichTags: d.ichTags,
    substanceType: d.substanceType,
    inn: d.inn,
    impurityPreview: d.impurityPreview,
    matchTier,
    matchReason,
    hasDeepLink: d.hasDeepLink,
    inchiKey: d.inchiKey,
    rankScore: extra?.rankScore,
    evidence,
    indexLayer: d.indexLayer,
    brandName: d.brandName,
    genericName: d.genericName,
    strength: d.strength,
    dosageForm: d.dosageForm,
    countryTags: d.countryTags,
    regionTags: d.regionTags || d.countryTags,
    parentSubstanceId: d.parentSubstanceId,
  };
}

function casFastPath(cas: string): Doc[] {
  const n = norm(cas);
  return getAllDocs().filter(
    (d) =>
      (d.kind === "substance" || d.kind === "impurity" || d.kind === "drug") &&
      d.cas &&
      norm(d.cas) === n
  );
}

function uniiFastPath(unii: string): Doc[] {
  const n = norm(unii);
  return getAllDocs().filter((d) => d.unii && norm(d.unii) === n);
}

function collectCandidates(
  terms: string[],
  fuse: Fuse<Doc>
): Map<string, { doc: Doc; fuseScore?: number; via?: MatchTier }> {
  const seen = new Map<string, { doc: Doc; fuseScore?: number; via?: MatchTier }>();
  const allDocs = getAllDocs();

  const put = (d: Doc, fuseScore?: number, via?: MatchTier) => {
    const k = `${d.kind}:${d.id}`;
    const prev = seen.get(k);
    if (!prev) {
      seen.set(k, { doc: d, fuseScore, via });
      return;
    }
    if (
      typeof fuseScore === "number" &&
      (prev.fuseScore === undefined || fuseScore < prev.fuseScore)
    ) {
      prev.fuseScore = fuseScore;
    }
    if (via && (!prev.via || tierRank(via) > tierRank(prev.via))) {
      prev.via = via;
    }
  };

  for (const term of terms) {
    const results = fuse.search(term, { limit: 80 });
    for (const r of results) {
      put(r.item, r.score, undefined);
    }
    for (const d of allDocs) {
      if (
        matchPinyinInitials(d.titleZh, term) ||
        (d.initials && d.initials.includes(norm(term).replace(/\s+/g, "")))
      ) {
        put(d, undefined, "pinyin");
      }
    }
    const n = norm(term);
    for (const d of allDocs) {
      if (
        includes(d.blob, n) ||
        includes(d.titleZh, n) ||
        includes(d.titleEn, n) ||
        d.synonyms.some((s) => includes(s, n))
      ) {
        put(d, undefined, undefined);
      }
    }
  }
  return seen;
}

function tierRank(t: MatchTier): number {
  const order: MatchTier[] = ["cas", "exact", "synonym", "pinyin", "fuzzy", "relaxed"];
  return order.length - order.indexOf(t);
}

function applyTypeFilters(d: Doc, filters: SearchFilters): boolean {
  const typeFilter = (filters.type || "").trim();
  const wantSubstances =
    !typeFilter ||
    ["API", "excipient", "biological", "herb", "other"].includes(typeFilter);
  const wantImpurities = !typeFilter || typeFilter === "impurity";
  const wantRS = !typeFilter || typeFilter === "rs";
  const wantDrugs = !typeFilter || typeFilter === "drug" || typeFilter === "product";

  if (d.kind === "substance" && !wantSubstances) return false;
  if (d.kind === "impurity" && !wantImpurities) return false;
  if (d.kind === "rs" && !wantRS) return false;
  if (d.kind === "drug" && !wantDrugs) return false;
  if (typeFilter && d.kind === "substance" && typeFilter !== d.type) return false;
  if (typeFilter === "drug" || typeFilter === "product") {
    if (d.kind !== "drug") return false;
  }

  if (filters.pharmacopoeia) {
    if (d.kind === "rs" || d.kind === "drug") return false;
    if (d.kind === "substance" && !d.pharmacopoeias.includes(filters.pharmacopoeia))
      return false;
    if (d.kind === "impurity") {
      const parents = substances.filter((s) =>
        impurities.find((i) => i.id === d.id)?.parentSubstanceIds.includes(s.id)
      );
      const parentHas = parents.some((s) =>
        s.monographRefs.some((m) => m.pharmacopoeia === filters.pharmacopoeia)
      );
      const cwHas = d.pharmacopoeias.includes(filters.pharmacopoeia);
      if (!parentHas && !cwHas) return false;
    }
  }

  if (filters.hasRS === "yes" && !d.hasRS) return false;
  if (filters.hasRS === "no" && d.hasRS) return false;

  if (filters.hasCAS === "yes" && !d.cas) return false;
  if (filters.hasCAS === "no" && d.cas) return false;

  if (filters.hasDeepLink === "yes" && !d.hasDeepLink) return false;
  if (filters.hasDeepLink === "no" && d.hasDeepLink) return false;

  if (filters.impurityType) {
    if (d.kind !== "impurity" || d.impurityType !== filters.impurityType) return false;
  }

  if (filters.parentId) {
    if (d.kind !== "impurity" || !(d.parentIds || []).includes(filters.parentId)) {
      return false;
    }
  }

  if (filters.molecularFormula) {
    if (!d.molecularFormula || d.molecularFormula !== filters.molecularFormula) {
      return false;
    }
  }

  if (filters.pharmaVersion) {
    if (!(d.pharmaVersions || []).includes(filters.pharmaVersion)) return false;
  }

  if (filters.efficacy) {
    if (!(d.efficacyStatuses || []).includes(filters.efficacy)) return false;
  }

  if (filters.dosageForm) {
    if (d.kind === "drug") {
      if (!d.dosageForm || norm(d.dosageForm) !== norm(filters.dosageForm)) return false;
    }
    // 原料/杂质：查询侧分面高亮，不强制过滤
  }
  // 保留 filters.dosageForm 供 UI / URL

  if (filters.region) {
    const want = norm(filters.region);
    const tags = [...(d.countryTags || []), ...(d.regionTags || [])].map(norm);
    if (!tags.includes(want)) return false;
  }

  const src = (filters.indexSource || "").trim();
  if (src && src !== "all") {
    const layer = d.indexLayer || "curated";
    if (src === "curated") {
      if (layer !== "curated") return false;
    } else if (layer !== src) {
      return false;
    }
  }

  return true;
}

export type RelaxationChip = {
  id: "dosage" | "salt" | "fuzzy";
  label: string;
  detail?: string;
};

export type SearchResponse = {
  hits: SearchHit[];
  parsed: ParsedQuery;
  appliedRelax: RelaxationChip[];
  availableRelax: RelaxationChip[];
  facets: SearchFacets;
  /** 严格模式未放宽前的命中数 */
  strictHitCount: number;
};


/** 英文查询时用站内 EN/INN 扩展同义，配合 /api/resolve UI 面板 */
function englishLocalExtras(q: string): string[] {
  const raw = q.trim();
  const latin = (raw.match(/[A-Za-z]/g) || []).length;
  if (latin < Math.max(2, raw.length * 0.45)) return [];
  const n = norm(raw);
  const out: string[] = [];
  for (const s of substances) {
    const keys = [s.nameEn, s.inn, ...s.aliases].filter(Boolean) as string[];
    if (keys.some((k) => norm(k) === n || norm(k).includes(n) || n.includes(norm(k)))) {
      out.push(s.nameZh, s.nameEn, ...(s.inn ? [s.inn] : []));
    }
  }
  return Array.from(new Set(out));
}

const FEW = 3;

function parseRelaxParam(relax?: string): Set<string> {
  if (!relax) return new Set();
  return new Set(
    relax
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

function runOnce(
  filters: SearchFilters,
  parsed: ParsedQuery,
  relax: RelaxMode,
  synonymExtras: string[]
): SearchHit[] {
  const fuse = relax.looseFuzzy ? fuseLoose : fuseStrict;

  // CAS 精确快路径
  if (parsed.cas && parsed.casValid !== false) {
    const casHits = casFastPath(parsed.cas).filter((d) =>
      applyTypeFilters(d, filters)
    );
    if (casHits.length > 0 && (parsed.isCasQuery || casHits.length <= 5)) {
      const synonymTerms = new Set(synonymExtras.map(norm));
      const rankable: RankableDoc[] = casHits.map((d) => ({
        ...d,
        matchedVia: "cas" as MatchTier,
        fuseScore: 0,
      }));
      const ranked = rankDocs(rankable, {
        parsed,
        synonymTerms,
        dosageMismatchPenalty: parsed.dosageForms.length > 0,
        relaxed: relax.looseFuzzy,
      });
      return ranked.map((r) =>
        toHit(r.doc as Doc, {
          matchTier: "cas",
          matchReason: MATCH_REASON_ZH.cas,
          rankScore: r.score,
        })
      );
    }
  }

  // UNII 精确快路径（10 位字母数字）
  const rawQ = (parsed.raw || "").trim();
  if (/^[A-Za-z0-9]{10}$/.test(rawQ)) {
    const uniiHits = uniiFastPath(rawQ).filter((d) => applyTypeFilters(d, filters));
    if (uniiHits.length > 0) {
      const synonymTerms = new Set(synonymExtras.map(norm));
      const rankable: RankableDoc[] = uniiHits.map((d) => ({
        ...d,
        matchedVia: "exact" as MatchTier,
        fuseScore: 0,
      }));
      const ranked = rankDocs(rankable, {
        parsed,
        synonymTerms,
        dosageMismatchPenalty: false,
        relaxed: relax.looseFuzzy,
      });
      return ranked.map((r) =>
        toHit(r.doc as Doc, {
          matchTier: "exact",
          matchReason: "UNII 精确",
          rankScore: r.score,
        })
      );
    }
  }

  const baseTerms = buildSearchTerms(parsed, relax);
  const terms = Array.from(
    new Set([
      ...baseTerms,
      ...synonymExtras.flatMap((t) =>
        buildSearchTerms(parseQuery(t), {
          stripDosage: relax.stripDosage,
          stripSalt: relax.stripSalt,
          looseFuzzy: false,
        })
      ),
    ])
  );

  if (!filters.q?.trim()) {
    const src = (filters.indexSource || "").trim();
    const docs = getAllDocs().filter((d) => {
      if (!applyTypeFilters(d, filters)) return false;
      // 无关键词时默认不倾倒开放 bulk，除非显式 indexSource=open|all
      if (d.indexLayer === "open" && src !== "open" && src !== "all") return false;
      return true;
    });
    return docs.map((d) => toHit(d));
  }

  const seen = collectCandidates(terms, fuse);
  const synonymTerms = new Set(synonymExtras.map(norm));

  const docs: RankableDoc[] = [];
  for (const { doc, fuseScore, via } of Array.from(seen.values())) {
    if (!applyTypeFilters(doc, filters)) continue;
    const ctx = {
      parsed,
      synonymTerms,
      dosageMismatchPenalty: parsed.dosageForms.length > 0,
      relaxed: relax.looseFuzzy,
    };
    const classified = classifyTier(
      { ...doc, fuseScore, matchedVia: via },
      ctx
    );
    // 取 via / classify 中更强的一层，避免错误 pinyin via 压过 synonym
    const tier =
      via && tierRank(via) > tierRank(classified) ? via : classified;
    docs.push({
      ...doc,
      fuseScore,
      matchedVia: tier,
    });
  }

  const ranked = rankDocs(docs, {
    parsed,
    synonymTerms,
    dosageMismatchPenalty: parsed.dosageForms.length > 0,
    relaxed: relax.looseFuzzy,
  });

  return ranked.map((r) =>
    toHit(r.doc as Doc, {
      matchTier: r.tier,
      matchReason: r.reason,
      rankScore: r.score,
    })
  );
}

/**
 * 完整检索（含解析、放宽、分面）。页面与 eval 使用此接口。
 */
export function searchWithMeta(filters: SearchFilters): SearchResponse {
  const qRaw = (filters.q || "").trim();
  const parsed = parseQuery(qRaw);
  const synonymExtras = qRaw
    ? Array.from(new Set([...expandQueryWithSynonyms(qRaw), ...englishLocalExtras(qRaw)]))
    : [];
  const requested = parseRelaxParam(filters.relax);
  const strict = filters.strict === "1";

  const available: RelaxationChip[] = [];
  if (parsed.dosageForms.length) {
    available.push({
      id: "dosage",
      label: "去掉剂型",
      detail: parsed.dosageForms.join("、"),
    });
  }
  if (parsed.saltHydrateStripped.length) {
    available.push({
      id: "salt",
      label: "去掉盐/水合物",
      detail: parsed.saltHydrateStripped.join("、"),
    });
  }
  available.push({ id: "fuzzy", label: "放宽模糊匹配" });

  // 严格基线（不剥离、不放宽）
  const strictHits = runOnce(
    filters,
    parsed,
    { stripDosage: false, stripSalt: false, looseFuzzy: false },
    synonymExtras
  );

  let mode: RelaxMode = {
    stripDosage: false,
    stripSalt: false,
    looseFuzzy: false,
  };
  const applied: RelaxationChip[] = [];

  if (!strict && qRaw) {
    // URL 显式 relax，或自动递进
    const want = new Set(requested);
    if (want.size === 0 && strictHits.length < FEW) {
      // 自动：dosage → salt → fuzzy
      if (parsed.dosageForms.length) want.add("dosage");
      if (parsed.saltHydrateStripped.length && (strictHits.length < FEW || want.has("dosage"))) {
        // 先试 dosage，仍少再加 salt
      }
      if (parsed.dosageForms.length) {
        const afterDos = runOnce(
          filters,
          parsed,
          { stripDosage: true, stripSalt: false, looseFuzzy: false },
          synonymExtras
        );
        if (afterDos.length > strictHits.length || strictHits.length < FEW) {
          want.add("dosage");
          if (afterDos.length < FEW && parsed.saltHydrateStripped.length) {
            want.add("salt");
            const afterSalt = runOnce(
              filters,
              parsed,
              { stripDosage: true, stripSalt: true, looseFuzzy: false },
              synonymExtras
            );
            if (afterSalt.length < FEW) want.add("fuzzy");
          } else if (afterDos.length < FEW) {
            want.add("fuzzy");
          }
        }
      } else if (parsed.saltHydrateStripped.length) {
        want.add("salt");
        const afterSalt = runOnce(
          filters,
          parsed,
          { stripDosage: false, stripSalt: true, looseFuzzy: false },
          synonymExtras
        );
        if (afterSalt.length < FEW) want.add("fuzzy");
      } else if (strictHits.length < FEW) {
        want.add("fuzzy");
      }
    }

    mode = {
      stripDosage: want.has("dosage"),
      stripSalt: want.has("salt"),
      looseFuzzy: want.has("fuzzy"),
    };
    for (const chip of available) {
      if (want.has(chip.id)) applied.push(chip);
    }
  } else if (requested.size) {
    mode = {
      stripDosage: requested.has("dosage"),
      stripSalt: requested.has("salt"),
      looseFuzzy: requested.has("fuzzy"),
    };
    for (const chip of available) {
      if (requested.has(chip.id)) applied.push(chip);
    }
  }

  // 日常有剂型/盐时：即便命中不少，也用 core 提升召回，但仍标为已应用剥离（可移除）
  // 仅当用户未 strict 且未显式清空时，对「阿司匹林片」类查询默认剥离剂型参与匹配
  if (!strict && qRaw && requested.size === 0 && applied.length === 0) {
    if (parsed.dosageForms.length) {
      mode.stripDosage = true;
      applied.push(available.find((c) => c.id === "dosage")!);
    }
    if (parsed.saltHydrateStripped.length) {
      mode.stripSalt = true;
      applied.push(available.find((c) => c.id === "salt")!);
    }
  }

  const hits =
    !qRaw || (applied.length === 0 && !mode.looseFuzzy)
      ? strictHits
      : runOnce(filters, parsed, mode, synonymExtras);

  // titleOnly：压缩摘要等字段（UI 侧也会处理；此处去掉 summary 以减轻）
  const outHits =
    filters.titleOnly === "1"
      ? hits.map((h) => ({ ...h, summary: undefined, subtitle: undefined }))
      : hits;

  const facets = buildFacets(outHits, parsed);

  return {
    hits: outHits,
    parsed,
    appliedRelax: applied.filter(Boolean),
    availableRelax: available,
    facets,
    strictHitCount: strictHits.length,
  };
}


/**
 * 异步检索：若配置 MEILI_HOST 则先取 Meili 候选再 rank；失败则与 searchWithMeta 相同（fuse）。
 * 英文查询时可传入 rxnormExtras 作为额外同义扩展（由页面/resolve 注入）。
 */
export async function searchWithMetaAsync(
  filters: SearchFilters,
  opts?: { rxnormExtras?: string[] }
): Promise<SearchResponse & { backend: "meili+rank" | "fuse+rank" }> {
  const qRaw = (filters.q || "").trim();
  let backend: "meili+rank" | "fuse+rank" = "fuse+rank";

  if (qRaw && meiliConfigured()) {
    const refs = await meiliSearchCandidates(qRaw, 50);
    if (refs && refs.length) {
      const byKey = new Map(ALL_DOCS.map((d) => [`${d.kind}:${d.id}`, d]));
      // Meili docs use entityId in index but id field is kind:entityId — map both
      const candDocs: Doc[] = [];
      const seen = new Set<string>();
      for (const r of refs) {
        const k1 = `${r.kind}:${r.id}`;
        // indexer stores id as "substance:sub-aspirin" and entityId separately;
        // meili returns kind + id where id may be full key or entity id
        let doc =
          byKey.get(k1) ||
          byKey.get(r.id) ||
          ALL_DOCS.find((d) => d.kind === r.kind && d.id === r.id);
        if (!doc && r.id.includes(":")) {
          const [, eid] = r.id.split(":");
          doc = byKey.get(`${r.kind}:${eid}`);
        }
        if (!doc) continue;
        const k = `${doc.kind}:${doc.id}`;
        if (seen.has(k)) continue;
        seen.add(k);
        if (applyTypeFilters(doc, filters)) candDocs.push(doc);
      }
      if (candDocs.length) {
        const parsed = parseQuery(qRaw);
        const synonymExtras = [
          ...expandQueryWithSynonyms(qRaw),
          ...(opts?.rxnormExtras || []),
        ];
        const synonymTerms = new Set(synonymExtras.map(norm));
        const rankable: RankableDoc[] = candDocs.map((d) => ({ ...d }));
        const ranked = rankDocs(rankable, {
          parsed,
          synonymTerms,
          dosageMismatchPenalty: parsed.dosageForms.length > 0,
          relaxed: false,
        });
        const hits = ranked.map((r) => {
          const tier = classifyTier(r.doc, {
            parsed,
            synonymTerms,
            dosageMismatchPenalty: parsed.dosageForms.length > 0,
            relaxed: false,
          });
          return toHit(r.doc as Doc, {
            matchTier: r.tier || tier,
            matchReason: r.reason,
            rankScore: r.score,
          });
        });
        const outHits =
          filters.titleOnly === "1"
            ? hits.map((h) => ({ ...h, summary: undefined, subtitle: undefined }))
            : hits;
        const facets = buildFacets(outHits, parsed);
        backend = "meili+rank";
        return {
          hits: outHits,
          parsed,
          appliedRelax: [],
          availableRelax: [],
          facets,
          strictHitCount: outHits.length,
          backend,
        };
      }
    }
  }

  // fuse path — merge rxnorm extras into synonym expansion via filters.q augmentation
  const base = searchWithMeta(
    opts?.rxnormExtras?.length
      ? {
          ...filters,
          // extras applied by re-running with expanded q terms inside runOnce via synonym
        }
      : filters
  );
  if (opts?.rxnormExtras?.length && qRaw) {
    // Re-run with extras injected
    const parsed = parseQuery(qRaw);
    const synonymExtras = [
      ...expandQueryWithSynonyms(qRaw),
      ...opts.rxnormExtras,
    ];
    const hits = runOnce(
      filters,
      parsed,
      { stripDosage: true, stripSalt: true, looseFuzzy: false },
      synonymExtras
    );
    const facets = buildFacets(hits, parsed);
    return {
      ...base,
      hits,
      facets,
      backend: "fuse+rank",
    };
  }
  return { ...base, backend };
}

/** 兼容旧调用：仅返回 hits */
export function searchAll(filters: SearchFilters): SearchHit[] {
  return searchWithMeta(filters).hits;
}

export type { ParsedQuery, SearchFacets, MatchTier };
