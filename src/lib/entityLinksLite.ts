/**
 * Client-safe entity link helpers.
 * Import curated seeds only — never openDrugProducts (keeps SERP bundle small).
 */
import { substances } from "@/data/substances";
import { impurities } from "@/data/impurities";
export type HubLink = {
  key: string;
  label: string;
  href: string;
  note?: string;
  tone?: "teal" | "sky" | "indigo" | "amber" | "rose" | "slate" | "violet";
};

export function labelForSubstanceId(id: string): string {
  const s = substances.find((x) => x.id === id);
  return s ? s.nameZh : id;
}

export function labelForImpurityId(id: string): string {
  const i = impurities.find((x) => x.id === id);
  return i ? i.nameZh : id;
}

function resolveCuratedParent(hit: {
  parentSubstanceId?: string;
  unii?: string;
  inn?: string;
  genericName?: string;
  titleEn?: string;
}): string | undefined {
  if (hit.parentSubstanceId && substances.some((s) => s.id === hit.parentSubstanceId)) {
    return hit.parentSubstanceId;
  }
  const unii = (hit.unii || "").toUpperCase();
  if (unii) {
    const byU = substances.find((s) => s.unii && s.unii.toUpperCase() === unii);
    if (byU) return byU.id;
  }
  const inn = (hit.inn || hit.genericName || hit.titleEn || "").toLowerCase().trim();
  if (inn) {
    const byN = substances.find((s) => {
      const names = [s.nameEn, s.nameZh, s.inn, ...(s.aliases || [])]
        .filter(Boolean)
        .map((x) => String(x).toLowerCase());
      return names.includes(inn);
    });
    if (byN) return byN.id;
  }
  return undefined;
}

/** SERP “另见” — hit fields + curated seed only. */
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
    const q = encodeURIComponent(hit.inn || hit.titleEn || hit.titleZh || hit.id);
    out.push({
      key: "drugs",
      label: "另见成药",
      href: `/search?q=${q}&type=drug`,
      note: "同 INN/名称",
      tone: "indigo",
    });
    out.push({
      key: "hub",
      label: "实体枢纽",
      href: `/substances/${encodeURIComponent(hit.id)}#entity-hub`,
      tone: "teal",
    });
    out.push({
      key: "graph",
      label: "杂质图谱",
      href: `/graph?focus=${encodeURIComponent(hit.id)}`,
      tone: "rose",
    });
  } else if (hit.kind === "drug") {
    const parent = resolveCuratedParent(hit);
    if (parent) {
      const s = substances.find((x) => x.id === parent);
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
        href: `/search?q=${q}&type=API`,
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
