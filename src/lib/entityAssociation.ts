/**
 * Cross-module entity association helpers (identity layer only).
 * Joins substances ↔ impurities ↔ drugs ↔ alerts ↔ RS via id / CAS / UNII / INN.
 */
import {
  substances,
  openDrugProducts,
  referenceMaterials,
  mergedChangeEvents,
  getSubstance,
  getImpurity,
} from "@/data";
import type { ChangeEvent, ImpurityNode, Substance } from "@/lib/types";
import type { OpenDrugProductRecord } from "@/data/openDrugProducts.generated";

export type HubLink = {
  key: string;
  label: string;
  href: string;
  note?: string;
  tone?: "teal" | "sky" | "indigo" | "amber" | "rose" | "slate" | "violet";
};

export type RelatedDrugSummary = {
  id: string;
  brandName: string;
  genericName: string;
  inn?: string;
  strength?: string;
  dosageForm?: string;
  regionTags: string[];
  parentSubstanceId?: string;
  joinVia: "unii" | "inn" | "name" | "parentId";
};

function norm(s: string | undefined | null): string {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normUnii(s: string | undefined | null): string {
  return String(s || "")
    .trim()
    .toUpperCase();
}

let _byUnii: Map<string, Substance> | null = null;
let _byName: Map<string, Substance> | null = null;
let _drugsBySubstanceId: Map<string, RelatedDrugSummary[]> | null = null;

function ensureSubstanceIndexes() {
  if (_byUnii && _byName) return;
  _byUnii = new Map();
  _byName = new Map();
  for (const s of substances) {
    if (s.unii) _byUnii.set(normUnii(s.unii), s);
    for (const n of [s.nameEn, s.nameZh, s.inn, ...(s.aliases || [])]) {
      const k = norm(n);
      if (k && !_byName.has(k)) _byName.set(k, s);
    }
  }
}

/**
 * Resolve a finished-drug record to the best curated substance id.
 * Prefers UNII → exact name/INN → valid curated parentSubstanceId.
 */
export function resolveDrugParentSubstanceId(
  drug: Pick<
    OpenDrugProductRecord,
    | "parentSubstanceId"
    | "unii"
    | "parentUnii"
    | "inn"
    | "genericName"
    | "brandName"
    | "synonyms"
  >
): string | undefined {
  ensureSubstanceIndexes();
  const u = normUnii(drug.parentUnii || drug.unii);
  if (u && _byUnii!.has(u)) return _byUnii!.get(u)!.id;

  // Name match: INN / generic only — brand & free synonyms are too noisy
  for (const n of [drug.inn, drug.genericName]) {
    const k = norm(n);
    if (k && _byName!.has(k)) return _byName!.get(k)!.id;
  }

  if (drug.parentSubstanceId && getSubstance(drug.parentSubstanceId)) {
    return drug.parentSubstanceId;
  }
  return undefined;
}

export function resolveCuratedSubstanceByIds(opts: {
  cas?: string;
  unii?: string;
  inn?: string;
  names?: string[];
}): Substance | undefined {
  ensureSubstanceIndexes();
  const u = normUnii(opts.unii);
  if (u && _byUnii!.has(u)) return _byUnii!.get(u);
  for (const n of [opts.inn, ...(opts.names || [])]) {
    const k = norm(n);
    if (k && _byName!.has(k)) return _byName!.get(k);
  }
  if (opts.cas) {
    const cas = opts.cas.trim();
    return substances.find((s) => s.cas === cas);
  }
  return undefined;
}

function toSummary(
  d: OpenDrugProductRecord,
  joinVia: RelatedDrugSummary["joinVia"],
  parentSubstanceId?: string
): RelatedDrugSummary {
  return {
    id: d.id,
    brandName: d.brandName,
    genericName: d.genericName,
    inn: d.inn,
    strength: d.strength,
    dosageForm: d.dosageForm,
    regionTags: Array.from(
      new Set([...(d.regionTags || []), ...(d.countryTags || [])])
    ).slice(0, 4),
    parentSubstanceId: parentSubstanceId || d.parentSubstanceId,
    joinVia,
  };
}

function pushUnique(
  map: Map<string, RelatedDrugSummary[]>,
  sid: string,
  item: RelatedDrugSummary,
  cap = 24
) {
  const arr = map.get(sid) || [];
  if (arr.some((x) => x.id === item.id) || arr.length >= cap) {
    map.set(sid, arr);
    return;
  }
  arr.push(item);
  map.set(sid, arr);
}

function ensureDrugIndexes() {
  if (_drugsBySubstanceId) return;
  ensureSubstanceIndexes();
  _drugsBySubstanceId = new Map();
  for (const d of openDrugProducts) {
    const curated = resolveDrugParentSubstanceId(d);
    if (curated) {
      const sub = getSubstance(curated);
      let via: RelatedDrugSummary["joinVia"] = "name";
      const u = normUnii(d.parentUnii || d.unii);
      if (u && sub?.unii && normUnii(sub.unii) === u) via = "unii";
      else if (norm(d.inn) && norm(d.inn) === norm(sub?.inn)) via = "inn";
      else if (norm(d.genericName) && _byName!.get(norm(d.genericName))?.id === curated)
        via = "inn";
      pushUnique(_drugsBySubstanceId, curated, toSummary(d, via, curated));
    }
    // Do not index under raw open-* seed parents — many are seed mismatches
    // (e.g. Aspirin → open-embelia-ribes-whole). Only curated ids.
    if (
      d.parentSubstanceId &&
      d.parentSubstanceId !== curated &&
      getSubstance(d.parentSubstanceId)
    ) {
      pushUnique(
        _drugsBySubstanceId,
        d.parentSubstanceId,
        toSummary(d, "parentId", curated || d.parentSubstanceId)
      );
    }
  }
}

/** Related finished drugs for a curated (or open) substance, capped. */
export function findRelatedDrugsForSubstance(
  substanceId: string,
  limit = 8
): RelatedDrugSummary[] {
  ensureDrugIndexes();
  return (_drugsBySubstanceId!.get(substanceId) || []).slice(0, limit);
}

export function countRelatedDrugsForSubstance(substanceId: string): number {
  ensureDrugIndexes();
  return (_drugsBySubstanceId!.get(substanceId) || []).length;
}

export function alertsForSubstance(substanceId: string): ChangeEvent[] {
  return mergedChangeEvents().filter(
    (e) =>
      e.relatedSubstanceIds?.includes(substanceId) ||
      e.relatedImpurityIds?.some((iid) =>
        getImpurity(iid)?.parentSubstanceIds.includes(substanceId)
      )
  );
}

export function alertsForImpurity(impurityId: string): ChangeEvent[] {
  return mergedChangeEvents().filter((e) =>
    e.relatedImpurityIds?.includes(impurityId)
  );
}

export function rsForSubstance(substanceId: string) {
  return referenceMaterials.filter((r) => r.linkedSubstanceId === substanceId);
}

/** Module + entity hub chips for a curated substance detail page. */
export function buildSubstanceHubLinks(
  s: Substance,
  opts?: { relatedDrugCount?: number; alertCount?: number }
): HubLink[] {
  const id = encodeURIComponent(s.id);
  const innQ = encodeURIComponent(s.inn || s.nameEn || s.nameZh);
  const drugCount = opts?.relatedDrugCount ?? countRelatedDrugsForSubstance(s.id);
  const alertCount = opts?.alertCount ?? alertsForSubstance(s.id).length;
  return [
    {
      key: "compendial",
      label: "对照二级页",
      href: `/substances/${id}/compendial`,
      note: "多药典矩阵",
      tone: "sky",
    },
    {
      key: "graph",
      label: "杂质图谱",
      href: `/graph?focus=${id}`,
      note: `${s.relatedImpurityIds.length} 节点`,
      tone: "rose",
    },
    {
      key: "compare",
      label: "对比队列",
      href: `/compare?add=${id}`,
      note: "加入并打开",
      tone: "indigo",
    },
    {
      key: "watch",
      label: "关注",
      href: `/watchlist?substance=${id}`,
      note: "本地列表",
      tone: "teal",
    },
    {
      key: "alerts",
      label: "预警影响",
      href: `/alerts?substance=${id}`,
      note: alertCount ? `${alertCount} 条相关` : "修订提醒",
      tone: "amber",
    },
    {
      key: "rs",
      label: "对照品",
      href: `/reference-standards?q=${encodeURIComponent(s.nameZh || s.nameEn)}`,
      note: `${s.relatedRSIds.length || rsForSubstance(s.id).length} 关联`,
      tone: "teal",
    },
    {
      key: "limits",
      label: "限度",
      href: `/limits`,
      note: "ICH 示例",
      tone: "violet",
    },
    {
      key: "workbench",
      label: "工作台",
      href: `/workbench?focus=${id}`,
      note: "历史·队列",
      tone: "slate",
    },
    {
      key: "checklist",
      label: "核查清单",
      href: `/checklist?substance=${id}`,
      tone: "slate",
    },
    {
      key: "notes",
      label: "备注",
      href: `/notes?substance=${id}`,
      tone: "slate",
    },
    {
      key: "drugs",
      label: drugCount ? `成药同 INN（${drugCount}）` : "成药同 INN",
      href: `/search?q=${innQ}&type=drug&tab=drug`,
      note: s.inn || s.nameEn,
      tone: "indigo",
    },
    {
      key: "search",
      label: "检索本实体",
      href: `/search?q=${encodeURIComponent(s.cas || s.nameZh)}`,
      tone: "slate",
    },
    {
      key: "hhwyc",
      label: "化学预测 · HHWYC",
      href: "https://github.com/cm4217/HHWYC",
      note: "独立仓库 · CAS/UNII 远期对接",
      tone: "violet",
    },
  ];
}

export function buildImpurityHubLinks(i: ImpurityNode): HubLink[] {
  const id = encodeURIComponent(i.id);
  const parent = i.parentSubstanceIds[0];
  const alertCount = alertsForImpurity(i.id).length;
  const links: HubLink[] = [];
  for (const pid of i.parentSubstanceIds.slice(0, 4)) {
    const p = getSubstance(pid);
    if (!p) continue;
    links.push({
      key: `parent-${pid}`,
      label: `父物质 · ${p.nameZh}`,
      href: `/substances/${encodeURIComponent(pid)}`,
      note: p.nameEn,
      tone: "sky",
    });
  }
  links.push(
    {
      key: "limits",
      label: "相关限度",
      href: `/limits`,
      note: i.type,
      tone: "violet",
    },
    {
      key: "graph",
      label: "杂质图谱",
      href: parent ? `/graph?focus=${encodeURIComponent(parent)}` : `/graph`,
      tone: "rose",
    },
    {
      key: "alerts",
      label: "预警影响",
      href: `/alerts?impurity=${id}`,
      note: alertCount ? `${alertCount} 条` : undefined,
      tone: "amber",
    },
    {
      key: "rs",
      label: "对照品",
      href: `/reference-standards?q=${encodeURIComponent(i.nameZh || i.nameEn)}`,
      tone: "teal",
    },
    {
      key: "watch",
      label: "关注",
      href: `/watchlist?impurity=${id}`,
      tone: "teal",
    },
    {
      key: "workbench",
      label: "工作台",
      href: `/workbench`,
      tone: "slate",
    },
    {
      key: "search",
      label: "检索本杂质",
      href: `/search?q=${encodeURIComponent(i.cas || i.nameZh)}&tab=impurity`,
      tone: "slate",
    }
  );
  return links;
}

/** SERP “另见” chips between substance ↔ drugs on the same result page. */
export function alsoSeeForHit(hit: {
  kind: string;
  id: string;
  inn?: string;
  cas?: string;
  unii?: string;
  titleZh?: string;
  titleEn?: string;
  parentSubstanceId?: string;
  parentIds?: string[];
  parentNames?: string[];
  brandName?: string;
  genericName?: string;
}): HubLink[] {
  const out: HubLink[] = [];
  if (hit.kind === "substance") {
    const n = countRelatedDrugsForSubstance(hit.id);
    const q = encodeURIComponent(hit.inn || hit.titleEn || hit.titleZh || hit.id);
    if (n > 0) {
      out.push({
        key: "drugs",
        label: `另见成药 ${n}`,
        href: `/search?q=${q}&type=drug&tab=drug`,
        note: "同 INN/UNII",
        tone: "indigo",
      });
    }
    out.push({
      key: "hub",
      label: "实体枢纽",
      href: `/substances/${encodeURIComponent(hit.id)}#entity-hub`,
      tone: "teal",
    });
  } else if (hit.kind === "drug") {
    const parent =
      hit.parentSubstanceId && getSubstance(hit.parentSubstanceId)
        ? hit.parentSubstanceId
        : resolveDrugParentSubstanceId({
            parentSubstanceId: hit.parentSubstanceId,
            unii: hit.unii,
            inn: hit.inn,
            genericName: hit.genericName || hit.titleEn || "",
            brandName: hit.brandName || hit.titleZh || "",
            synonyms: [],
          });
    if (parent) {
      const s = getSubstance(parent);
      out.push({
        key: "parent",
        label: s ? `原料药 · ${s.nameZh}` : "原料药详情",
        href: `/substances/${encodeURIComponent(parent)}`,
        note: s?.inn || s?.nameEn,
        tone: "sky",
      });
      out.push({
        key: "compendial",
        label: "多药典对照",
        href: `/substances/${encodeURIComponent(parent)}/compendial`,
        tone: "sky",
      });
    } else if (hit.inn || hit.genericName) {
      const q = encodeURIComponent(hit.inn || hit.genericName || "");
      out.push({
        key: "search-api",
        label: "检索原料药",
        href: `/search?q=${q}&type=API&tab=substance`,
        tone: "slate",
      });
    }
  } else if (hit.kind === "impurity" && hit.parentIds?.length) {
    hit.parentIds.slice(0, 3).forEach((pid, i) => {
      out.push({
        key: `p-${pid}`,
        label: `父物质 · ${hit.parentNames?.[i] || pid}`,
        href: `/substances/${encodeURIComponent(pid)}`,
        tone: "sky",
      });
    });
  }
  return out;
}

export function labelForSubstanceId(id: string): string {
  const s = getSubstance(id);
  return s ? s.nameZh : id;
}

export function labelForImpurityId(id: string): string {
  const i = getImpurity(id);
  return i ? i.nameZh : id;
}
