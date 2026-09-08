import type { ImpurityNode, Substance } from "@/lib/types";
import { substances, impurities } from "@/data";
import { buildOfficialQueryLinks } from "@/lib/officialQueryLinks";

export type ImpurityExportRow = {
  parentId: string;
  parentNameZh: string;
  parentNameEn: string;
  parentCas: string;
  impurityId: string;
  impurityNameZh: string;
  impurityNameEn: string;
  cas: string;
  type: string;
  ichTags: string;
  unii: string;
  officialLinksReminder: string;
};

function officialReminder(s: Substance): string {
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
  return links
    .slice(0, 6)
    .map((l) => `${l.labelZh}: ${l.url}`)
    .join(" | ");
}

export function buildImpurityRowsForSubstance(s: Substance): ImpurityExportRow[] {
  const reminder = officialReminder(s);
  return s.relatedImpurityIds
    .map((id) => impurities.find((i) => i.id === id))
    .filter((i): i is ImpurityNode => !!i)
    .map((i) => ({
      parentId: s.id,
      parentNameZh: s.nameZh,
      parentNameEn: s.nameEn,
      parentCas: s.cas || "",
      impurityId: i.id,
      impurityNameZh: i.nameZh,
      impurityNameEn: i.nameEn,
      cas: i.cas || "",
      type: i.type,
      ichTags: (i.ichTags || []).join(";"),
      unii: i.unii || "",
      officialLinksReminder: reminder,
    }));
}

export function buildImpurityRowsForWatchlist(substanceIds: string[]): ImpurityExportRow[] {
  const rows: ImpurityExportRow[] = [];
  const seen = new Set<string>();
  for (const id of substanceIds) {
    const s = substances.find((x) => x.id === id);
    if (!s) continue;
    for (const row of buildImpurityRowsForSubstance(s)) {
      const key = `${row.parentId}::${row.impurityId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
    }
  }
  return rows;
}

const CSV_HEADERS = [
  "parent",
  "parentEn",
  "parentCas",
  "impurityZh",
  "impurityEn",
  "cas",
  "type",
  "ichTags",
  "unii",
  "officialLinksReminder",
] as const;

export function impurityRowsToCsv(rows: ImpurityExportRow[]): string {
  const lines = [CSV_HEADERS.join(",")];
  for (const r of rows) {
    const vals = [
      r.parentNameZh,
      r.parentNameEn,
      r.parentCas,
      r.impurityNameZh,
      r.impurityNameEn,
      r.cas,
      r.type,
      r.ichTags,
      r.unii,
      r.officialLinksReminder,
    ];
    lines.push(
      vals.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
    );
  }
  return lines.join("\n");
}

/** FHIR-ish SubstanceDefinition stub — 非正式申报件 (FDA PQ-CMC inspired, NOT compliant) */
export function buildFhirIshDraft(s: Substance, related: ImpurityNode[]) {
  return {
    resourceType: "SubstanceDefinition",
    meta: {
      tag: [
        {
          system: "https://example.local/pharmacopoeia-mvp",
          code: "non-regulatory-draft",
          display: "非正式申报件 / NOT for regulatory submission",
        },
      ],
    },
    status: "draft",
    note: [
      {
        text: "基于 FDA PQ-CMC 概念的 FHIR-ish JSON 草稿，非正式申报件，不宣称合规。仅含 name/UNII/SMILES 级字段。",
      },
    ],
    identifier: s.unii
      ? [{ system: "http://fdasis.nlm.nih.gov", value: s.unii }]
      : undefined,
    name: [
      { name: s.nameEn, language: "en" },
      { name: s.nameZh, language: "zh" },
    ],
    structure: s.smiles
      ? {
          representation: [
            {
              representation: s.smiles,
              format: { coding: [{ code: "SMILES", display: "SMILES" }] },
            },
          ],
        }
      : undefined,
    moiety: related.map((i) => ({
      name: i.nameEn,
      identifier: i.unii
        ? { system: "http://fdasis.nlm.nih.gov", value: i.unii }
        : undefined,
      molecularStructure: i.smiles
        ? {
            representation: [
              {
                representation: i.smiles,
                format: { coding: [{ code: "SMILES" }] },
              },
            ],
          }
        : undefined,
      measurementType: { text: i.type },
      amount: { text: `CAS ${i.cas || "n/a"}; ICH ${(i.ichTags || []).join(",")}` },
    })),
    _disclaimerZh:
      "非正式申报件 · FHIR-ish stub · based on FDA PQ-CMC concepts but NOT claiming compliance",
  };
}

export function downloadText(filename: string, content: string, mime: string) {
  if (typeof document === "undefined") return;
  const blob = new Blob(["\ufeff" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
