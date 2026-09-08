import { substances } from "@/data";
import type { PharmacopoeiaCode } from "@/lib/types";
import { buildOfficialQueryLinks } from "@/lib/officialQueryLinks";
import { expandQueryWithSynonyms } from "@/lib/synonyms";

export type LookupResult = {
  query: string;
  found: boolean;
  id?: string;
  name?: string;
  nameZh?: string;
  nameEn?: string;
  cas?: string;
  unii?: string;
  pharmacopoeias: PharmacopoeiaCode[];
  impurityCount: number;
  urls: { label: string; url: string }[];
};

function norm(s: string) {
  return s.trim().toLowerCase();
}

export function lookupOne(raw: string): LookupResult {
  const q = raw.trim();
  if (!q) {
    return { query: raw, found: false, pharmacopoeias: [], impurityCount: 0, urls: [] };
  }
  const terms = expandQueryWithSynonyms(q).map(norm);
  for (const s of substances) {
    const fields = [s.nameZh, s.nameEn, s.inn, s.cas, s.unii, ...s.aliases]
      .filter(Boolean)
      .map((x) => norm(String(x)));
    if (fields.some((f) => terms.some((t) => f === t || f.includes(t)))) {
      const pharmacopoeias = Array.from(
        new Set(s.monographRefs.map((m) => m.pharmacopoeia))
      ) as PharmacopoeiaCode[];
      const links = buildOfficialQueryLinks({
        nameZh: s.nameZh,
        nameEn: s.nameEn,
        inn: s.inn,
        cas: s.cas,
        unii: s.unii,
        epTextNumber: s.epTextNumber,
        uspDoi: s.uspDoi,
        phIntDocPath: s.phIntDocPath,
      });
      return {
        query: q,
        found: true,
        id: s.id,
        name: `${s.nameZh} / ${s.nameEn}`,
        nameZh: s.nameZh,
        nameEn: s.nameEn,
        cas: s.cas,
        unii: s.unii,
        pharmacopoeias,
        impurityCount: s.relatedImpurityIds.length,
        urls: links.slice(0, 8).map((l) => ({ label: l.labelZh, url: l.url })),
      };
    }
  }
  return { query: q, found: false, pharmacopoeias: [], impurityCount: 0, urls: [] };
}

export function lookupMany(queries: string[]): LookupResult[] {
  return queries.map((q) => lookupOne(q));
}

export function lookupResultsToCsv(rows: LookupResult[]): string {
  const headers = [
    "query",
    "found",
    "nameZh",
    "nameEn",
    "cas",
    "unii",
    "pharmacopoeias",
    "impurityCount",
    "urls",
  ];
  const lines = [headers.join(",")];
  for (const r of rows) {
    const vals = [
      r.query,
      r.found ? "true" : "false",
      r.nameZh || "",
      r.nameEn || "",
      r.cas || "",
      r.unii || "",
      r.pharmacopoeias.join(";"),
      String(r.impurityCount),
      r.urls.map((u) => u.url).join(" | "),
    ];
    lines.push(vals.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","));
  }
  return lines.join("\n");
}
