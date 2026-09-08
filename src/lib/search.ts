import {
  substances,
  impurities,
  referenceMaterials,
} from "@/data";
import type { PharmacopoeiaCode, SearchHit } from "./types";

function norm(s: string) {
  return s.trim().toLowerCase();
}

function includes(hay: string | undefined, q: string) {
  if (!hay) return false;
  return norm(hay).includes(q);
}

export interface SearchFilters {
  q?: string;
  pharmacopoeia?: PharmacopoeiaCode | "";
  type?: string;
  hasRS?: "yes" | "no" | "";
}

export function searchAll(filters: SearchFilters): SearchHit[] {
  const q = norm(filters.q || "");
  const typeFilter = (filters.type || "").trim();
  const hits: SearchHit[] = [];

  const wantSubstances =
    !typeFilter ||
    ["API", "excipient", "biological", "herb", "other"].includes(typeFilter);
  const wantImpurities = !typeFilter || typeFilter === "impurity";
  const wantRS = !typeFilter || typeFilter === "rs";

  if (wantSubstances) {
    for (const s of substances) {
      const textMatch =
        !q ||
        includes(s.nameZh, q) ||
        includes(s.nameEn, q) ||
        includes(s.inn, q) ||
        includes(s.cas, q) ||
        includes(s.unii, q) ||
        s.aliases.some((a) => includes(a, q));

      if (!textMatch) continue;

      if (typeFilter && typeFilter !== s.type) continue;

      if (filters.pharmacopoeia) {
        const hasPh = s.monographRefs.some(
          (m) => m.pharmacopoeia === filters.pharmacopoeia
        );
        if (!hasPh) continue;
      }

      const anyRS =
        s.monographRefs.some((m) => m.hasRS) || s.relatedRSIds.length > 0;
      if (filters.hasRS === "yes" && !anyRS) continue;
      if (filters.hasRS === "no" && anyRS) continue;

      hits.push({
        kind: "substance",
        id: s.id,
        titleZh: s.nameZh,
        titleEn: s.nameEn,
        subtitle: [s.inn, s.cas ? `CAS ${s.cas}` : null]
          .filter(Boolean)
          .join(" · "),
        badges: [
          "示例数据",
          s.type,
          ...Array.from(new Set(s.monographRefs.map((m) => m.pharmacopoeia))),
        ],
      });
    }
  }

  if (wantImpurities) {
    for (const i of impurities) {
      const textMatch =
        !q ||
        includes(i.nameZh, q) ||
        includes(i.nameEn, q) ||
        includes(i.chemicalName, q) ||
        includes(i.cas, q) ||
        i.namingCrosswalk.some((n) => includes(n.name, q));

      if (!textMatch) continue;

      if (filters.pharmacopoeia) {
        const parents = substances.filter((s) =>
          i.parentSubstanceIds.includes(s.id)
        );
        const parentHas = parents.some((s) =>
          s.monographRefs.some((m) => m.pharmacopoeia === filters.pharmacopoeia)
        );
        const cwHas = i.namingCrosswalk.some(
          (n) => n.system === filters.pharmacopoeia
        );
        if (!parentHas && !cwHas) continue;
      }

      if (filters.hasRS === "yes" && i.relatedRSIds.length === 0) continue;
      if (filters.hasRS === "no" && i.relatedRSIds.length > 0) continue;

      hits.push({
        kind: "impurity",
        id: i.id,
        titleZh: i.nameZh,
        titleEn: i.nameEn,
        subtitle: [i.chemicalName, i.cas ? `CAS ${i.cas}` : null, i.type]
          .filter(Boolean)
          .join(" · "),
        badges: ["示例数据", "杂质", i.type, ...i.ichTags.slice(0, 2)],
      });
    }
  }

  if (wantRS) {
    for (const r of referenceMaterials) {
      const textMatch =
        !q ||
        includes(r.nameZh, q) ||
        includes(r.nameEn, q) ||
        includes(r.catalogCode, q) ||
        includes(r.cas, q) ||
        includes(r.issuer, q);

      if (!textMatch) continue;
      if (filters.hasRS === "no") continue;

      hits.push({
        kind: "rs",
        id: r.id,
        titleZh: r.nameZh,
        titleEn: r.nameEn,
        subtitle: `${r.issuer} · ${r.catalogCode}`,
        badges: ["示例数据", "对照品", r.issuer, r.status],
      });
    }
  }

  return hits;
}
