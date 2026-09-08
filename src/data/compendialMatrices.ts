import type { CopyrightStatus, PharmacopoeiaCode, Substance } from "@/lib/types";

/**
 * 多药典详细对照矩阵 — 示例数据 only。
 * 禁止粘贴 USP/EP/BP/ChP 法定性状 / 含量测定 / 接受标准原文。
 * 叙述与限度单元格须标注 DEMO，或仅用「有此项」/「—」元数据。
 */

export const COMPENDIAL_COLUMNS: PharmacopoeiaCode[] = [
  "ChP",
  "USP",
  "EP",
  "BP",
  "JP",
  "Ph.Int.",
];

export type CompendialMatrixRow = {
  key: string;
  labelZh: string;
  labelEn?: string;
  /** UI section grouping */
  section: "meta" | "narrative" | "counts" | "checks";
  values: Partial<Record<PharmacopoeiaCode, string>>;
  demo: true;
};

export type CompendialMatrix = {
  substanceId: string;
  /** Rich curated DEMO narrative / check rows (vs metadata-only skeleton) */
  rich: boolean;
  rows: CompendialMatrixRow[];
};

const D = true as const;

function row(
  key: string,
  labelZh: string,
  values: Partial<Record<PharmacopoeiaCode, string>>,
  section: CompendialMatrixRow["section"],
  labelEn?: string
): CompendialMatrixRow {
  return { key, labelZh, labelEn, section, values, demo: D };
}

/** Access chip from copyrightStatus / known portal model */
export function accessLabel(status: CopyrightStatus | undefined): {
  zh: "免费" | "订阅";
  tone: "green" | "amber";
} {
  if (status === "needs_license") return { zh: "订阅", tone: "amber" };
  // usable / link_only / missing → treat portal entry as free-ish
  return { zh: "免费", tone: "green" };
}

export function defaultAccessForCode(code: PharmacopoeiaCode): {
  zh: "免费" | "订阅";
  tone: "green" | "amber";
} {
  if (code === "USP" || code === "EP" || code === "BP") {
    return { zh: "订阅", tone: "amber" };
  }
  return { zh: "免费", tone: "green" };
}

/** Curated rich DEMO matrices (aspirin primary; a few peers lighter). */
const RICH: Record<string, CompendialMatrix> = {
  "sub-aspirin": {
    substanceId: "sub-aspirin",
    rich: true,
    rows: [
      row(
        "effectiveDate",
        "生效日期",
        {
          ChP: "2020-12（示例）",
          USP: "2024（示例）",
          EP: "11.0（示例）",
          BP: "2024（示例）",
          JP: "JP18（示例）",
          "Ph.Int.": "公开版（示例）",
        },
        "meta",
        "Effective (demo)"
      ),
      row(
        "monographId",
        "专论编号",
        {
          ChP: "示例·阿司匹林",
          USP: "DEMO DOI 占位",
          EP: "0309",
          BP: "示例编号",
          JP: "示例",
          "Ph.Int.": "Jb.6.1.5（示例）",
        },
        "meta",
        "Monograph id"
      ),
      row(
        "appearance",
        "性状",
        {
          ChP: "【示例】白色结晶或粉末",
          USP: "【示例】white crystals / powder",
          EP: "【示例】white crystalline powder",
          BP: "【示例】white crystalline powder",
          JP: "【示例】白色结晶性粉末",
          "Ph.Int.": "【示例】white powder",
        },
        "narrative",
        "Appearance (DEMO)"
      ),
      row(
        "assay",
        "含量测定",
        {
          ChP: "【示例】酸碱滴定法",
          USP: "【示例】滴定 / HPLC 示意",
          EP: "【示例】滴定法示意",
          BP: "【示例】滴定法示意",
          JP: "【示例】滴定法示意",
          "Ph.Int.": "【示例】assay 示意",
        },
        "narrative",
        "Assay (DEMO — not official limits)"
      ),
      row(
        "idMethods",
        "鉴别方法数",
        {
          ChP: "3（示例）",
          USP: "4（示例）",
          EP: "3（示例）",
          BP: "3（示例）",
          JP: "2（示例）",
          "Ph.Int.": "2（示例）",
        },
        "counts",
        "Identification methods (count)"
      ),
      row(
        "testCount",
        "检查项目数",
        {
          ChP: "6（示例）",
          USP: "7（示例）",
          EP: "6（示例）",
          BP: "6（示例）",
          JP: "5（示例）",
          "Ph.Int.": "4（示例）",
        },
        "counts",
        "Tests (count)"
      ),
      row(
        "freeSA",
        "游离水杨酸",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "有此项（示例）",
        },
        "checks",
        "Free salicylic acid (DEMO)"
      ),
      row(
        "lod",
        "干燥失重",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks",
        "Loss on drying (DEMO)"
      ),
      row(
        "roi",
        "炽灼残渣",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks",
        "Residue on ignition (DEMO)"
      ),
      row(
        "heavyMetals",
        "重金属",
        {
          ChP: "有此项（示例）",
          USP: "—",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks",
        "Heavy metals (DEMO)"
      ),
      row(
        "related",
        "有关物质",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "有此项（示例）",
        },
        "checks",
        "Related substances (DEMO)"
      ),
      row(
        "water",
        "水分",
        {
          ChP: "有此项（示例）",
          USP: "—",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "—",
          "Ph.Int.": "—",
        },
        "checks",
        "Water (DEMO)"
      ),
      row(
        "residualSolvents",
        "残留溶剂",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks",
        "Residual solvents (DEMO)"
      ),
      row(
        "clarity",
        "溶液澄清度",
        {
          ChP: "有此项（示例）",
          USP: "—",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks",
        "Clarity of solution (DEMO)"
      ),
    ],
  },
  "sub-ibuprofen": {
    substanceId: "sub-ibuprofen",
    rich: true,
    rows: [
      row(
        "effectiveDate",
        "生效日期",
        {
          ChP: "2020（示例）",
          USP: "2024（示例）",
          EP: "11.x（示例）",
          BP: "2024（示例）",
          "Ph.Int.": "公开版（示例）",
        },
        "meta"
      ),
      row(
        "appearance",
        "性状",
        {
          ChP: "【示例】白色结晶性粉末",
          USP: "【示例】white powder",
          EP: "【示例】white crystalline powder",
          BP: "【示例】white powder",
          "Ph.Int.": "【示例】white powder",
        },
        "narrative"
      ),
      row(
        "assay",
        "含量测定",
        {
          ChP: "【示例】滴定/色谱示意",
          USP: "【示例】HPLC 示意",
          EP: "【示例】滴定示意",
          BP: "【示例】滴定示意",
          "Ph.Int.": "【示例】assay 示意",
        },
        "narrative"
      ),
      row(
        "idMethods",
        "鉴别方法数",
        {
          ChP: "3（示例）",
          USP: "3（示例）",
          EP: "3（示例）",
          BP: "3（示例）",
          "Ph.Int.": "2（示例）",
        },
        "counts"
      ),
      row(
        "testCount",
        "检查项目数",
        {
          ChP: "5（示例）",
          USP: "5（示例）",
          EP: "5（示例）",
          BP: "4（示例）",
          "Ph.Int.": "3（示例）",
        },
        "counts"
      ),
      row(
        "related",
        "有关物质",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          "Ph.Int.": "有此项（示例）",
        },
        "checks"
      ),
      row(
        "lod",
        "干燥失重",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
    
      row(
        "water",
        "水分",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "—",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "residualSolvents",
        "残留溶剂",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "roi",
        "炽灼残渣",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "heavyMetals",
        "重金属",
        {
          ChP: "有此项（示例）",
          USP: "—",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),],
  },
  "sub-paracetamol": {
    substanceId: "sub-paracetamol",
    rich: true,
    rows: [
      row(
        "effectiveDate",
        "生效日期",
        {
          ChP: "2020（示例）",
          USP: "2024（示例）",
          EP: "11.x（示例）",
          BP: "2024（示例）",
          JP: "JP18（示例）",
        },
        "meta"
      ),
      row(
        "appearance",
        "性状",
        {
          ChP: "【示例】白色结晶或粉末",
          USP: "【示例】white crystalline powder",
          EP: "【示例】white crystalline powder",
          BP: "【示例】white powder",
          JP: "【示例】白色结晶性粉末",
        },
        "narrative"
      ),
      row(
        "assay",
        "含量测定",
        {
          ChP: "【示例】滴定示意",
          USP: "【示例】HPLC 示意",
          EP: "【示例】滴定示意",
          BP: "【示例】滴定示意",
          JP: "【示例】滴定示意",
        },
        "narrative"
      ),
      row(
        "idMethods",
        "鉴别方法数",
        {
          ChP: "3（示例）",
          USP: "3（示例）",
          EP: "3（示例）",
          BP: "3（示例）",
          JP: "2（示例）",
        },
        "counts"
      ),
      row(
        "testCount",
        "检查项目数",
        {
          ChP: "5（示例）",
          USP: "5（示例）",
          EP: "5（示例）",
          BP: "5（示例）",
          JP: "4（示例）",
        },
        "counts"
      ),
      row(
        "related",
        "有关物质",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
        },
        "checks"
      ),
      row(
        "lod",
        "干燥失重",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
        },
        "checks"
      ),
    
      row(
        "water",
        "水分",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "—",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "residualSolvents",
        "残留溶剂",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "roi",
        "炽灼残渣",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "heavyMetals",
        "重金属",
        {
          ChP: "有此项（示例）",
          USP: "—",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),],
  },
  "sub-amoxicillin": {
    substanceId: "sub-amoxicillin",
    rich: true,
    rows: [
      row(
        "effectiveDate",
        "生效日期",
        {
          ChP: "2020（示例）",
          USP: "2024（示例）",
          EP: "11.x（示例）",
          BP: "2024（示例）",
          JP: "JP18（示例）",
        },
        "meta"
      ),
      row(
        "appearance",
        "性状",
        {
          ChP: "【示例】白色或类白色粉末",
          USP: "【示例】white powder",
          EP: "【示例】white powder",
          BP: "【示例】white powder",
          JP: "【示例】白色粉末",
        },
        "narrative"
      ),
      row(
        "idMethods",
        "鉴别方法数",
        {
          ChP: "3（示例）",
          USP: "3（示例）",
          EP: "3（示例）",
          BP: "3（示例）",
          JP: "2（示例）",
        },
        "counts"
      ),
      row(
        "testCount",
        "检查项目数",
        {
          ChP: "5（示例）",
          USP: "4（示例）",
          EP: "5（示例）",
          BP: "4（示例）",
          JP: "4（示例）",
        },
        "counts"
      ),
      row(
        "related",
        "有关物质",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
        },
        "checks"
      ),
    
      row(
        "water",
        "水分",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "—",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "residualSolvents",
        "残留溶剂",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "roi",
        "炽灼残渣",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "heavyMetals",
        "重金属",
        {
          ChP: "有此项（示例）",
          USP: "—",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),],
  },
  "sub-omeprazole": {
    substanceId: "sub-omeprazole",
    rich: true,
    rows: [
      row(
        "effectiveDate",
        "生效日期",
        {
          ChP: "2020（示例）",
          USP: "2024（示例）",
          EP: "11.x（示例）",
          BP: "2024（示例）",
          JP: "JP18（示例）",
          "Ph.Int.": "公开版（示例）",
        },
        "meta"
      ),
      row(
        "monographId",
        "专论编号",
        {
          ChP: "示例编号",
          USP: "DEMO DOI 占位",
          EP: "示例",
          BP: "示例",
          JP: "示例",
          "Ph.Int.": "示例",
        },
        "meta"
      ),
      row(
        "appearance",
        "性状",
        {
          ChP: "【示例】白色或类白色粉末/结晶",
          USP: "【示例】white powder / crystals",
          EP: "【示例】white crystalline powder",
          BP: "【示例】white powder",
          JP: "【示例】白色结晶性粉末",
          "Ph.Int.": "【示例】white powder",
        },
        "narrative"
      ),
      row(
        "assay",
        "含量测定",
        {
          ChP: "【示例】滴定/HPLC 示意",
          USP: "【示例】HPLC 示意",
          EP: "【示例】滴定/色谱示意",
          BP: "【示例】滴定示意",
          JP: "【示例】滴定示意",
          "Ph.Int.": "【示例】assay 示意",
        },
        "narrative"
      ),
      row(
        "idMethods",
        "鉴别方法数",
        {
          ChP: "3（示例）",
          USP: "3（示例）",
          EP: "3（示例）",
          BP: "3（示例）",
          JP: "2（示例）",
          "Ph.Int.": "2（示例）",
        },
        "counts"
      ),
      row(
        "testCount",
        "检查项目数",
        {
          ChP: "6（示例）",
          USP: "5（示例）",
          EP: "6（示例）",
          BP: "5（示例）",
          JP: "4（示例）",
          "Ph.Int.": "3（示例）",
        },
        "counts"
      ),
      row(
        "related",
        "有关物质",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "有此项（示例）",
        },
        "checks"
      ),
      row(
        "lod",
        "干燥失重",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "roi",
        "炽灼残渣",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "heavyMetals",
        "重金属",
        {
          ChP: "有此项（示例）",
          USP: "—",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "water",
        "水分",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "—",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "residualSolvents",
        "残留溶剂",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "microbial",
        "微生物限度",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
    ],
  },
  "sub-metformin": {
    substanceId: "sub-metformin",
    rich: true,
    rows: [
      row(
        "effectiveDate",
        "生效日期",
        {
          ChP: "2020（示例）",
          USP: "2024（示例）",
          EP: "11.x（示例）",
          BP: "2024（示例）",
          JP: "JP18（示例）",
          "Ph.Int.": "公开版（示例）",
        },
        "meta"
      ),
      row(
        "monographId",
        "专论编号",
        {
          ChP: "示例编号",
          USP: "DEMO DOI 占位",
          EP: "示例",
          BP: "示例",
          JP: "示例",
          "Ph.Int.": "示例",
        },
        "meta"
      ),
      row(
        "appearance",
        "性状",
        {
          ChP: "【示例】白色或类白色粉末/结晶",
          USP: "【示例】white powder / crystals",
          EP: "【示例】white crystalline powder",
          BP: "【示例】white powder",
          JP: "【示例】白色结晶性粉末",
          "Ph.Int.": "【示例】white powder",
        },
        "narrative"
      ),
      row(
        "assay",
        "含量测定",
        {
          ChP: "【示例】滴定/HPLC 示意",
          USP: "【示例】HPLC 示意",
          EP: "【示例】滴定/色谱示意",
          BP: "【示例】滴定示意",
          JP: "【示例】滴定示意",
          "Ph.Int.": "【示例】assay 示意",
        },
        "narrative"
      ),
      row(
        "idMethods",
        "鉴别方法数",
        {
          ChP: "3（示例）",
          USP: "3（示例）",
          EP: "3（示例）",
          BP: "3（示例）",
          JP: "2（示例）",
          "Ph.Int.": "2（示例）",
        },
        "counts"
      ),
      row(
        "testCount",
        "检查项目数",
        {
          ChP: "6（示例）",
          USP: "5（示例）",
          EP: "6（示例）",
          BP: "5（示例）",
          JP: "4（示例）",
          "Ph.Int.": "3（示例）",
        },
        "counts"
      ),
      row(
        "related",
        "有关物质",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "有此项（示例）",
        },
        "checks"
      ),
      row(
        "lod",
        "干燥失重",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "roi",
        "炽灼残渣",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "heavyMetals",
        "重金属",
        {
          ChP: "有此项（示例）",
          USP: "—",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "water",
        "水分",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "—",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "residualSolvents",
        "残留溶剂",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "microbial",
        "微生物限度",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
    ],
  },
  "sub-atorvastatin": {
    substanceId: "sub-atorvastatin",
    rich: true,
    rows: [
      row(
        "effectiveDate",
        "生效日期",
        {
          ChP: "2020（示例）",
          USP: "2024（示例）",
          EP: "11.x（示例）",
          BP: "2024（示例）",
          JP: "JP18（示例）",
          "Ph.Int.": "公开版（示例）",
        },
        "meta"
      ),
      row(
        "monographId",
        "专论编号",
        {
          ChP: "示例编号",
          USP: "DEMO DOI 占位",
          EP: "示例",
          BP: "示例",
          JP: "示例",
          "Ph.Int.": "示例",
        },
        "meta"
      ),
      row(
        "appearance",
        "性状",
        {
          ChP: "【示例】白色或类白色粉末/结晶",
          USP: "【示例】white powder / crystals",
          EP: "【示例】white crystalline powder",
          BP: "【示例】white powder",
          JP: "【示例】白色结晶性粉末",
          "Ph.Int.": "【示例】white powder",
        },
        "narrative"
      ),
      row(
        "assay",
        "含量测定",
        {
          ChP: "【示例】滴定/HPLC 示意",
          USP: "【示例】HPLC 示意",
          EP: "【示例】滴定/色谱示意",
          BP: "【示例】滴定示意",
          JP: "【示例】滴定示意",
          "Ph.Int.": "【示例】assay 示意",
        },
        "narrative"
      ),
      row(
        "idMethods",
        "鉴别方法数",
        {
          ChP: "3（示例）",
          USP: "3（示例）",
          EP: "3（示例）",
          BP: "3（示例）",
          JP: "2（示例）",
          "Ph.Int.": "2（示例）",
        },
        "counts"
      ),
      row(
        "testCount",
        "检查项目数",
        {
          ChP: "6（示例）",
          USP: "5（示例）",
          EP: "6（示例）",
          BP: "5（示例）",
          JP: "4（示例）",
          "Ph.Int.": "3（示例）",
        },
        "counts"
      ),
      row(
        "related",
        "有关物质",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "有此项（示例）",
        },
        "checks"
      ),
      row(
        "lod",
        "干燥失重",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "roi",
        "炽灼残渣",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "heavyMetals",
        "重金属",
        {
          ChP: "有此项（示例）",
          USP: "—",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "water",
        "水分",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "—",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "residualSolvents",
        "残留溶剂",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "microbial",
        "微生物限度",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
    ],
  },
  "sub-amlodipine": {
    substanceId: "sub-amlodipine",
    rich: true,
    rows: [
      row(
        "effectiveDate",
        "生效日期",
        {
          ChP: "2020（示例）",
          USP: "2024（示例）",
          EP: "11.x（示例）",
          BP: "2024（示例）",
          JP: "JP18（示例）",
          "Ph.Int.": "公开版（示例）",
        },
        "meta"
      ),
      row(
        "monographId",
        "专论编号",
        {
          ChP: "示例编号",
          USP: "DEMO DOI 占位",
          EP: "示例",
          BP: "示例",
          JP: "示例",
          "Ph.Int.": "示例",
        },
        "meta"
      ),
      row(
        "appearance",
        "性状",
        {
          ChP: "【示例】白色或类白色粉末/结晶",
          USP: "【示例】white powder / crystals",
          EP: "【示例】white crystalline powder",
          BP: "【示例】white powder",
          JP: "【示例】白色结晶性粉末",
          "Ph.Int.": "【示例】white powder",
        },
        "narrative"
      ),
      row(
        "assay",
        "含量测定",
        {
          ChP: "【示例】滴定/HPLC 示意",
          USP: "【示例】HPLC 示意",
          EP: "【示例】滴定/色谱示意",
          BP: "【示例】滴定示意",
          JP: "【示例】滴定示意",
          "Ph.Int.": "【示例】assay 示意",
        },
        "narrative"
      ),
      row(
        "idMethods",
        "鉴别方法数",
        {
          ChP: "3（示例）",
          USP: "3（示例）",
          EP: "3（示例）",
          BP: "3（示例）",
          JP: "2（示例）",
          "Ph.Int.": "2（示例）",
        },
        "counts"
      ),
      row(
        "testCount",
        "检查项目数",
        {
          ChP: "6（示例）",
          USP: "5（示例）",
          EP: "6（示例）",
          BP: "5（示例）",
          JP: "4（示例）",
          "Ph.Int.": "3（示例）",
        },
        "counts"
      ),
      row(
        "related",
        "有关物质",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "有此项（示例）",
        },
        "checks"
      ),
      row(
        "lod",
        "干燥失重",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "roi",
        "炽灼残渣",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "heavyMetals",
        "重金属",
        {
          ChP: "有此项（示例）",
          USP: "—",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "water",
        "水分",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "—",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "residualSolvents",
        "残留溶剂",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "microbial",
        "微生物限度",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
    ],
  },
  "sub-losartan": {
    substanceId: "sub-losartan",
    rich: true,
    rows: [
      row(
        "effectiveDate",
        "生效日期",
        {
          ChP: "2020（示例）",
          USP: "2024（示例）",
          EP: "11.x（示例）",
          BP: "2024（示例）",
          JP: "JP18（示例）",
          "Ph.Int.": "公开版（示例）",
        },
        "meta"
      ),
      row(
        "monographId",
        "专论编号",
        {
          ChP: "示例编号",
          USP: "DEMO DOI 占位",
          EP: "示例",
          BP: "示例",
          JP: "示例",
          "Ph.Int.": "示例",
        },
        "meta"
      ),
      row(
        "appearance",
        "性状",
        {
          ChP: "【示例】白色或类白色粉末/结晶",
          USP: "【示例】white powder / crystals",
          EP: "【示例】white crystalline powder",
          BP: "【示例】white powder",
          JP: "【示例】白色结晶性粉末",
          "Ph.Int.": "【示例】white powder",
        },
        "narrative"
      ),
      row(
        "assay",
        "含量测定",
        {
          ChP: "【示例】滴定/HPLC 示意",
          USP: "【示例】HPLC 示意",
          EP: "【示例】滴定/色谱示意",
          BP: "【示例】滴定示意",
          JP: "【示例】滴定示意",
          "Ph.Int.": "【示例】assay 示意",
        },
        "narrative"
      ),
      row(
        "idMethods",
        "鉴别方法数",
        {
          ChP: "3（示例）",
          USP: "3（示例）",
          EP: "3（示例）",
          BP: "3（示例）",
          JP: "2（示例）",
          "Ph.Int.": "2（示例）",
        },
        "counts"
      ),
      row(
        "testCount",
        "检查项目数",
        {
          ChP: "6（示例）",
          USP: "5（示例）",
          EP: "6（示例）",
          BP: "5（示例）",
          JP: "4（示例）",
          "Ph.Int.": "3（示例）",
        },
        "counts"
      ),
      row(
        "related",
        "有关物质",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "有此项（示例）",
        },
        "checks"
      ),
      row(
        "lod",
        "干燥失重",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "roi",
        "炽灼残渣",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "heavyMetals",
        "重金属",
        {
          ChP: "有此项（示例）",
          USP: "—",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "water",
        "水分",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "—",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "residualSolvents",
        "残留溶剂",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "microbial",
        "微生物限度",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
    ],
  },
  "sub-metronidazole": {
    substanceId: "sub-metronidazole",
    rich: true,
    rows: [
      row(
        "effectiveDate",
        "生效日期",
        {
          ChP: "2020（示例）",
          USP: "2024（示例）",
          EP: "11.x（示例）",
          BP: "2024（示例）",
          JP: "JP18（示例）",
          "Ph.Int.": "公开版（示例）",
        },
        "meta"
      ),
      row(
        "monographId",
        "专论编号",
        {
          ChP: "示例编号",
          USP: "DEMO DOI 占位",
          EP: "示例",
          BP: "示例",
          JP: "示例",
          "Ph.Int.": "示例",
        },
        "meta"
      ),
      row(
        "appearance",
        "性状",
        {
          ChP: "【示例】白色或类白色粉末/结晶",
          USP: "【示例】white powder / crystals",
          EP: "【示例】white crystalline powder",
          BP: "【示例】white powder",
          JP: "【示例】白色结晶性粉末",
          "Ph.Int.": "【示例】white powder",
        },
        "narrative"
      ),
      row(
        "assay",
        "含量测定",
        {
          ChP: "【示例】滴定/HPLC 示意",
          USP: "【示例】HPLC 示意",
          EP: "【示例】滴定/色谱示意",
          BP: "【示例】滴定示意",
          JP: "【示例】滴定示意",
          "Ph.Int.": "【示例】assay 示意",
        },
        "narrative"
      ),
      row(
        "idMethods",
        "鉴别方法数",
        {
          ChP: "3（示例）",
          USP: "3（示例）",
          EP: "3（示例）",
          BP: "3（示例）",
          JP: "2（示例）",
          "Ph.Int.": "2（示例）",
        },
        "counts"
      ),
      row(
        "testCount",
        "检查项目数",
        {
          ChP: "6（示例）",
          USP: "5（示例）",
          EP: "6（示例）",
          BP: "5（示例）",
          JP: "4（示例）",
          "Ph.Int.": "3（示例）",
        },
        "counts"
      ),
      row(
        "related",
        "有关物质",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "有此项（示例）",
        },
        "checks"
      ),
      row(
        "lod",
        "干燥失重",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "roi",
        "炽灼残渣",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "heavyMetals",
        "重金属",
        {
          ChP: "有此项（示例）",
          USP: "—",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "water",
        "水分",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "—",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "residualSolvents",
        "残留溶剂",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "microbial",
        "微生物限度",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
    ],
  },
  "sub-caffeine": {
    substanceId: "sub-caffeine",
    rich: true,
    rows: [
      row(
        "effectiveDate",
        "生效日期",
        {
          ChP: "2020（示例）",
          USP: "2024（示例）",
          EP: "11.x（示例）",
          BP: "2024（示例）",
          JP: "JP18（示例）",
          "Ph.Int.": "公开版（示例）",
        },
        "meta"
      ),
      row(
        "monographId",
        "专论编号",
        {
          ChP: "示例编号",
          USP: "DEMO DOI 占位",
          EP: "示例",
          BP: "示例",
          JP: "示例",
          "Ph.Int.": "示例",
        },
        "meta"
      ),
      row(
        "appearance",
        "性状",
        {
          ChP: "【示例】白色或类白色粉末/结晶",
          USP: "【示例】white powder / crystals",
          EP: "【示例】white crystalline powder",
          BP: "【示例】white powder",
          JP: "【示例】白色结晶性粉末",
          "Ph.Int.": "【示例】white powder",
        },
        "narrative"
      ),
      row(
        "assay",
        "含量测定",
        {
          ChP: "【示例】滴定/HPLC 示意",
          USP: "【示例】HPLC 示意",
          EP: "【示例】滴定/色谱示意",
          BP: "【示例】滴定示意",
          JP: "【示例】滴定示意",
          "Ph.Int.": "【示例】assay 示意",
        },
        "narrative"
      ),
      row(
        "idMethods",
        "鉴别方法数",
        {
          ChP: "3（示例）",
          USP: "3（示例）",
          EP: "3（示例）",
          BP: "3（示例）",
          JP: "2（示例）",
          "Ph.Int.": "2（示例）",
        },
        "counts"
      ),
      row(
        "testCount",
        "检查项目数",
        {
          ChP: "6（示例）",
          USP: "5（示例）",
          EP: "6（示例）",
          BP: "5（示例）",
          JP: "4（示例）",
          "Ph.Int.": "3（示例）",
        },
        "counts"
      ),
      row(
        "related",
        "有关物质",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "有此项（示例）",
        },
        "checks"
      ),
      row(
        "lod",
        "干燥失重",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "roi",
        "炽灼残渣",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "heavyMetals",
        "重金属",
        {
          ChP: "有此项（示例）",
          USP: "—",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "water",
        "水分",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "—",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "residualSolvents",
        "残留溶剂",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "microbial",
        "微生物限度",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
    ],
  },
  "sub-ascorbic-acid": {
    substanceId: "sub-ascorbic-acid",
    rich: true,
    rows: [
      row(
        "effectiveDate",
        "生效日期",
        {
          ChP: "2020（示例）",
          USP: "2024（示例）",
          EP: "11.x（示例）",
          BP: "2024（示例）",
          JP: "JP18（示例）",
          "Ph.Int.": "公开版（示例）",
        },
        "meta"
      ),
      row(
        "monographId",
        "专论编号",
        {
          ChP: "示例编号",
          USP: "DEMO DOI 占位",
          EP: "示例",
          BP: "示例",
          JP: "示例",
          "Ph.Int.": "示例",
        },
        "meta"
      ),
      row(
        "appearance",
        "性状",
        {
          ChP: "【示例】白色或类白色粉末/结晶",
          USP: "【示例】white powder / crystals",
          EP: "【示例】white crystalline powder",
          BP: "【示例】white powder",
          JP: "【示例】白色结晶性粉末",
          "Ph.Int.": "【示例】white powder",
        },
        "narrative"
      ),
      row(
        "assay",
        "含量测定",
        {
          ChP: "【示例】滴定/HPLC 示意",
          USP: "【示例】HPLC 示意",
          EP: "【示例】滴定/色谱示意",
          BP: "【示例】滴定示意",
          JP: "【示例】滴定示意",
          "Ph.Int.": "【示例】assay 示意",
        },
        "narrative"
      ),
      row(
        "idMethods",
        "鉴别方法数",
        {
          ChP: "3（示例）",
          USP: "3（示例）",
          EP: "3（示例）",
          BP: "3（示例）",
          JP: "2（示例）",
          "Ph.Int.": "2（示例）",
        },
        "counts"
      ),
      row(
        "testCount",
        "检查项目数",
        {
          ChP: "6（示例）",
          USP: "5（示例）",
          EP: "6（示例）",
          BP: "5（示例）",
          JP: "4（示例）",
          "Ph.Int.": "3（示例）",
        },
        "counts"
      ),
      row(
        "related",
        "有关物质",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "有此项（示例）",
        },
        "checks"
      ),
      row(
        "lod",
        "干燥失重",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "roi",
        "炽灼残渣",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "heavyMetals",
        "重金属",
        {
          ChP: "有此项（示例）",
          USP: "—",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "water",
        "水分",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "—",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "residualSolvents",
        "残留溶剂",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "microbial",
        "微生物限度",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
    ],
  },
  "sub-diclofenac": {
    substanceId: "sub-diclofenac",
    rich: true,
    rows: [
      row(
        "effectiveDate",
        "生效日期",
        {
          ChP: "2020（示例）",
          USP: "2024（示例）",
          EP: "11.x（示例）",
          BP: "2024（示例）",
          JP: "JP18（示例）",
          "Ph.Int.": "公开版（示例）",
        },
        "meta"
      ),
      row(
        "monographId",
        "专论编号",
        {
          ChP: "示例编号",
          USP: "DEMO DOI 占位",
          EP: "示例",
          BP: "示例",
          JP: "示例",
          "Ph.Int.": "示例",
        },
        "meta"
      ),
      row(
        "appearance",
        "性状",
        {
          ChP: "【示例】白色或类白色粉末/结晶",
          USP: "【示例】white powder / crystals",
          EP: "【示例】white crystalline powder",
          BP: "【示例】white powder",
          JP: "【示例】白色结晶性粉末",
          "Ph.Int.": "【示例】white powder",
        },
        "narrative"
      ),
      row(
        "assay",
        "含量测定",
        {
          ChP: "【示例】滴定/HPLC 示意",
          USP: "【示例】HPLC 示意",
          EP: "【示例】滴定/色谱示意",
          BP: "【示例】滴定示意",
          JP: "【示例】滴定示意",
          "Ph.Int.": "【示例】assay 示意",
        },
        "narrative"
      ),
      row(
        "idMethods",
        "鉴别方法数",
        {
          ChP: "3（示例）",
          USP: "3（示例）",
          EP: "3（示例）",
          BP: "3（示例）",
          JP: "2（示例）",
          "Ph.Int.": "2（示例）",
        },
        "counts"
      ),
      row(
        "testCount",
        "检查项目数",
        {
          ChP: "6（示例）",
          USP: "5（示例）",
          EP: "6（示例）",
          BP: "5（示例）",
          JP: "4（示例）",
          "Ph.Int.": "3（示例）",
        },
        "counts"
      ),
      row(
        "related",
        "有关物质",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "有此项（示例）",
        },
        "checks"
      ),
      row(
        "lod",
        "干燥失重",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "roi",
        "炽灼残渣",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "heavyMetals",
        "重金属",
        {
          ChP: "有此项（示例）",
          USP: "—",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "water",
        "水分",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "—",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "residualSolvents",
        "残留溶剂",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "microbial",
        "微生物限度",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
    ],
  },
  "sub-ciprofloxacin": {
    substanceId: "sub-ciprofloxacin",
    rich: true,
    rows: [
      row(
        "effectiveDate",
        "生效日期",
        {
          ChP: "2020（示例）",
          USP: "2024（示例）",
          EP: "11.x（示例）",
          BP: "2024（示例）",
          JP: "JP18（示例）",
          "Ph.Int.": "公开版（示例）",
        },
        "meta"
      ),
      row(
        "monographId",
        "专论编号",
        {
          ChP: "示例编号",
          USP: "DEMO DOI 占位",
          EP: "示例",
          BP: "示例",
          JP: "示例",
          "Ph.Int.": "示例",
        },
        "meta"
      ),
      row(
        "appearance",
        "性状",
        {
          ChP: "【示例】白色或类白色粉末/结晶",
          USP: "【示例】white powder / crystals",
          EP: "【示例】white crystalline powder",
          BP: "【示例】white powder",
          JP: "【示例】白色结晶性粉末",
          "Ph.Int.": "【示例】white powder",
        },
        "narrative"
      ),
      row(
        "assay",
        "含量测定",
        {
          ChP: "【示例】滴定/HPLC 示意",
          USP: "【示例】HPLC 示意",
          EP: "【示例】滴定/色谱示意",
          BP: "【示例】滴定示意",
          JP: "【示例】滴定示意",
          "Ph.Int.": "【示例】assay 示意",
        },
        "narrative"
      ),
      row(
        "idMethods",
        "鉴别方法数",
        {
          ChP: "3（示例）",
          USP: "3（示例）",
          EP: "3（示例）",
          BP: "3（示例）",
          JP: "2（示例）",
          "Ph.Int.": "2（示例）",
        },
        "counts"
      ),
      row(
        "testCount",
        "检查项目数",
        {
          ChP: "6（示例）",
          USP: "5（示例）",
          EP: "6（示例）",
          BP: "5（示例）",
          JP: "4（示例）",
          "Ph.Int.": "3（示例）",
        },
        "counts"
      ),
      row(
        "related",
        "有关物质",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "有此项（示例）",
        },
        "checks"
      ),
      row(
        "lod",
        "干燥失重",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "roi",
        "炽灼残渣",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "heavyMetals",
        "重金属",
        {
          ChP: "有此项（示例）",
          USP: "—",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "water",
        "水分",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "—",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "residualSolvents",
        "残留溶剂",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "microbial",
        "微生物限度",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
    ],
  },
  "sub-levofloxacin": {
    substanceId: "sub-levofloxacin",
    rich: true,
    rows: [
      row(
        "effectiveDate",
        "生效日期",
        {
          ChP: "2020（示例）",
          USP: "2024（示例）",
          EP: "11.x（示例）",
          BP: "2024（示例）",
          JP: "JP18（示例）",
          "Ph.Int.": "公开版（示例）",
        },
        "meta"
      ),
      row(
        "monographId",
        "专论编号",
        {
          ChP: "示例编号",
          USP: "DEMO DOI 占位",
          EP: "示例",
          BP: "示例",
          JP: "示例",
          "Ph.Int.": "示例",
        },
        "meta"
      ),
      row(
        "appearance",
        "性状",
        {
          ChP: "【示例】白色或类白色粉末/结晶",
          USP: "【示例】white powder / crystals",
          EP: "【示例】white crystalline powder",
          BP: "【示例】white powder",
          JP: "【示例】白色结晶性粉末",
          "Ph.Int.": "【示例】white powder",
        },
        "narrative"
      ),
      row(
        "assay",
        "含量测定",
        {
          ChP: "【示例】滴定/HPLC 示意",
          USP: "【示例】HPLC 示意",
          EP: "【示例】滴定/色谱示意",
          BP: "【示例】滴定示意",
          JP: "【示例】滴定示意",
          "Ph.Int.": "【示例】assay 示意",
        },
        "narrative"
      ),
      row(
        "idMethods",
        "鉴别方法数",
        {
          ChP: "3（示例）",
          USP: "3（示例）",
          EP: "3（示例）",
          BP: "3（示例）",
          JP: "2（示例）",
          "Ph.Int.": "2（示例）",
        },
        "counts"
      ),
      row(
        "testCount",
        "检查项目数",
        {
          ChP: "6（示例）",
          USP: "5（示例）",
          EP: "6（示例）",
          BP: "5（示例）",
          JP: "4（示例）",
          "Ph.Int.": "3（示例）",
        },
        "counts"
      ),
      row(
        "related",
        "有关物质",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "有此项（示例）",
        },
        "checks"
      ),
      row(
        "lod",
        "干燥失重",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "roi",
        "炽灼残渣",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "heavyMetals",
        "重金属",
        {
          ChP: "有此项（示例）",
          USP: "—",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "water",
        "水分",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "—",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "residualSolvents",
        "残留溶剂",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "microbial",
        "微生物限度",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
    ],
  },
  "sub-warfarin": {
    substanceId: "sub-warfarin",
    rich: true,
    rows: [
      row(
        "effectiveDate",
        "生效日期",
        {
          ChP: "2020（示例）",
          USP: "2024（示例）",
          EP: "11.x（示例）",
          BP: "2024（示例）",
          JP: "JP18（示例）",
          "Ph.Int.": "公开版（示例）",
        },
        "meta"
      ),
      row(
        "monographId",
        "专论编号",
        {
          ChP: "示例编号",
          USP: "DEMO DOI 占位",
          EP: "示例",
          BP: "示例",
          JP: "示例",
          "Ph.Int.": "示例",
        },
        "meta"
      ),
      row(
        "appearance",
        "性状",
        {
          ChP: "【示例】白色或类白色粉末/结晶",
          USP: "【示例】white powder / crystals",
          EP: "【示例】white crystalline powder",
          BP: "【示例】white powder",
          JP: "【示例】白色结晶性粉末",
          "Ph.Int.": "【示例】white powder",
        },
        "narrative"
      ),
      row(
        "assay",
        "含量测定",
        {
          ChP: "【示例】滴定/HPLC 示意",
          USP: "【示例】HPLC 示意",
          EP: "【示例】滴定/色谱示意",
          BP: "【示例】滴定示意",
          JP: "【示例】滴定示意",
          "Ph.Int.": "【示例】assay 示意",
        },
        "narrative"
      ),
      row(
        "idMethods",
        "鉴别方法数",
        {
          ChP: "3（示例）",
          USP: "3（示例）",
          EP: "3（示例）",
          BP: "3（示例）",
          JP: "2（示例）",
          "Ph.Int.": "2（示例）",
        },
        "counts"
      ),
      row(
        "testCount",
        "检查项目数",
        {
          ChP: "6（示例）",
          USP: "5（示例）",
          EP: "6（示例）",
          BP: "5（示例）",
          JP: "4（示例）",
          "Ph.Int.": "3（示例）",
        },
        "counts"
      ),
      row(
        "related",
        "有关物质",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "有此项（示例）",
        },
        "checks"
      ),
      row(
        "lod",
        "干燥失重",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "roi",
        "炽灼残渣",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "heavyMetals",
        "重金属",
        {
          ChP: "有此项（示例）",
          USP: "—",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "water",
        "水分",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "—",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "residualSolvents",
        "残留溶剂",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "有此项（示例）",
          BP: "有此项（示例）",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
      row(
        "microbial",
        "微生物限度",
        {
          ChP: "有此项（示例）",
          USP: "有此项（示例）",
          EP: "—",
          BP: "—",
          JP: "有此项（示例）",
          "Ph.Int.": "—",
        },
        "checks"
      ),
    ],
  },
};

/** Metadata-only skeleton from monographRefs coverage (open-index / other seeds). */
export function buildMetadataMatrix(s: Substance): CompendialMatrix {
  const covered = new Set(s.monographRefs.map((m) => m.pharmacopoeia));
  if (s.phIntDocPath) covered.add("Ph.Int.");

  const has = (c: PharmacopoeiaCode) => (covered.has(c) ? "有此项" : "—");
  const vals = (): Partial<Record<PharmacopoeiaCode, string>> => {
    const o: Partial<Record<PharmacopoeiaCode, string>> = {};
    for (const c of COMPENDIAL_COLUMNS) o[c] = has(c);
    return o;
  };

  return {
    substanceId: s.id,
    rich: false,
    rows: [
      row(
        "coverage",
        "专论索引",
        vals(),
        "meta",
        "Monograph index present"
      ),
      row(
        "idMethods",
        "鉴别方法数",
        Object.fromEntries(
          COMPENDIAL_COLUMNS.map((c) => [c, covered.has(c) ? "—" : "—"])
        ) as Partial<Record<PharmacopoeiaCode, string>>,
        "counts"
      ),
      row(
        "testCount",
        "检查项目数",
        Object.fromEntries(
          COMPENDIAL_COLUMNS.map((c) => [c, "—"])
        ) as Partial<Record<PharmacopoeiaCode, string>>,
        "counts"
      ),
      row(
        "narrativeNote",
        "叙述/限度",
        Object.fromEntries(
          COMPENDIAL_COLUMNS.map((c) => [
            c,
            covered.has(c) ? "见官方原文" : "—",
          ])
        ) as Partial<Record<PharmacopoeiaCode, string>>,
        "narrative",
        "No DEMO narrative — open official links"
      ),
    ],
  };
}

export function getCompendialMatrix(s: Substance): CompendialMatrix {
  return RICH[s.id] ?? buildMetadataMatrix(s);
}

export function hasRichCompendialMatrix(id: string): boolean {
  return Boolean(RICH[id]?.rich);
}

export const RICH_COMPENDIAL_IDS = Object.keys(RICH);
