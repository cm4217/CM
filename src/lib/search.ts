import Fuse from "fuse.js";
import { pinyin } from "pinyin-pro";
import {
  substances,
  impurities,
  referenceMaterials,
} from "@/data";
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

function norm(s: string) {
  return s.trim().toLowerCase();
}

function includes(hay: string | undefined, q: string) {
  if (!hay) return false;
  return norm(hay).includes(q);
}

function zhInitials(text: string): string {
  if (PINYIN_INITIALS[text]) return PINYIN_INITIALS[text];
  try {
    return pinyin(text, { pattern: "first", toneType: "none", type: "array" })
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
}

type Doc = {
  kind: SearchHit["kind"];
  id: string;
  titleZh: string;
  titleEn: string;
  subtitle?: string;
  badges: string[];
  blob: string;
  initials: string;
  pharmacopoeias: string[];
  hasRS: boolean;
  type?: string;
  impurityCount?: number;
  cas?: string;
  unii?: string;
  summary?: string;
  impurityType?: ImpurityType;
  parentNames?: string[];
  ichTags?: string[];
  substanceType?: SubstanceType;
  inn?: string;
};

function buildDocs(): Doc[] {
  const docs: Doc[] = [];
  const substanceById = new Map(substances.map((s) => [s.id, s]));

  for (const s of substances) {
    const initials = zhInitials(s.nameZh);
    const anyRS =
      s.monographRefs.some((m) => m.hasRS) || s.relatedRSIds.length > 0;
    const pharmas = Array.from(
      new Set(s.monographRefs.map((m) => m.pharmacopoeia))
    ) as PharmacopoeiaCode[];
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
      initials,
      pharmacopoeias: pharmas,
      hasRS: anyRS,
      type: s.type,
      impurityCount: s.relatedImpurityIds.length,
      cas: s.cas,
      unii: s.unii,
      summary: s.summaryZh,
      substanceType: s.type,
      inn: s.inn,
    });
  }
  for (const i of impurities) {
    const initials = zhInitials(i.nameZh);
    const parentNames = i.parentSubstanceIds
      .map((id) => substanceById.get(id)?.nameZh)
      .filter(Boolean) as string[];
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
      initials,
      pharmacopoeias: i.namingCrosswalk.map((n) => n.system),
      hasRS: i.relatedRSIds.length > 0,
      type: "impurity",
      cas: i.cas,
      unii: i.unii,
      summary: i.summaryZh,
      impurityType: i.type,
      parentNames,
      ichTags: i.ichTags,
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
      initials: "",
      pharmacopoeias: [],
      hasRS: true,
      type: "rs",
      cas: r.cas,
    });
  }
  return docs;
}

const ALL_DOCS = buildDocs();

const fuse = new Fuse(ALL_DOCS, {
  keys: [
    { name: "titleZh", weight: 0.35 },
    { name: "titleEn", weight: 0.25 },
    { name: "blob", weight: 0.3 },
    { name: "initials", weight: 0.1 },
  ],
  threshold: 0.4,
  ignoreLocation: true,
  includeScore: true,
});

function toHit(d: Doc): SearchHit {
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
    summary: d.summary,
    impurityType: d.impurityType,
    parentNames: d.parentNames,
    ichTags: d.ichTags,
    substanceType: d.substanceType,
    inn: d.inn,
  };
}

export function searchAll(filters: SearchFilters): SearchHit[] {
  const qRaw = (filters.q || "").trim();
  const typeFilter = (filters.type || "").trim();
  const wantSubstances =
    !typeFilter ||
    ["API", "excipient", "biological", "herb", "other"].includes(typeFilter);
  const wantImpurities = !typeFilter || typeFilter === "impurity";
  const wantRS = !typeFilter || typeFilter === "rs";

  let candidates: Doc[] = ALL_DOCS;

  if (qRaw) {
    const expanded = expandQueryWithSynonyms(qRaw);
    const seen = new Map<string, Doc>();
    for (const term of expanded) {
      const results = fuse.search(term, { limit: 40 });
      for (const r of results) {
        const k = `${r.item.kind}:${r.item.id}`;
        if (!seen.has(k)) seen.set(k, r.item);
      }
      for (const d of ALL_DOCS) {
        if (
          matchPinyinInitials(d.titleZh, term) ||
          (d.initials && d.initials.includes(norm(term).replace(/\s+/g, "")))
        ) {
          const k = `${d.kind}:${d.id}`;
          if (!seen.has(k)) seen.set(k, d);
        }
      }
      const n = norm(term);
      for (const d of ALL_DOCS) {
        if (includes(d.blob, n) || includes(d.titleZh, n) || includes(d.titleEn, n)) {
          const k = `${d.kind}:${d.id}`;
          if (!seen.has(k)) seen.set(k, d);
        }
      }
    }
    candidates = Array.from(seen.values());
  }

  const hits: SearchHit[] = [];
  for (const d of candidates) {
    if (d.kind === "substance" && !wantSubstances) continue;
    if (d.kind === "impurity" && !wantImpurities) continue;
    if (d.kind === "rs" && !wantRS) continue;
    if (typeFilter && d.kind === "substance" && typeFilter !== d.type) continue;

    if (filters.pharmacopoeia) {
      if (d.kind === "rs") continue;
      if (d.kind === "substance" && !d.pharmacopoeias.includes(filters.pharmacopoeia))
        continue;
      if (d.kind === "impurity") {
        const parents = substances.filter((s) =>
          impurities.find((i) => i.id === d.id)?.parentSubstanceIds.includes(s.id)
        );
        const parentHas = parents.some((s) =>
          s.monographRefs.some((m) => m.pharmacopoeia === filters.pharmacopoeia)
        );
        const cwHas = d.pharmacopoeias.includes(filters.pharmacopoeia);
        if (!parentHas && !cwHas) continue;
      }
    }

    if (filters.hasRS === "yes" && !d.hasRS) continue;
    if (filters.hasRS === "no" && d.hasRS) continue;

    hits.push(toHit(d));
  }

  return hits;
}
