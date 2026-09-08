import type { IchLimitRow } from "@/lib/types";

/**
 * ICH / 亚硝胺限值【示例】数据。
 * 明确标记：示例/请核官方最新版 — 不替代 ICH、FDA、EMA 法定文本。
 */
export const ichLimits: IchLimitRow[] = [
  {
    id: "lim-q3c-methanol",
    category: "Q3C",
    nameZh: "甲醇",
    nameEn: "Methanol",
    cas: "67-56-1",
    exampleValue: "3000",
    unit: "ppm (PDE 示例量级)",
    classOrNote: "Class 2 · 示例 PDE 相关浓度",
    impurityTypes: ["residual_solvent"],
    officialUrls: [
      {
        label: "ICH Q3C (R8) 数据库",
        url: "https://database.ich.org/sites/default/files/ICH_Q3C-R8_Guideline_Step4_2021_0422.pdf",
      },
      { label: "ICH 数据库", url: "https://database.ich.org/" },
    ],
    disclaimerZh: "示例/请核官方最新版 — 溶剂分类与 PDE 以 ICH Q3C 现行版为准。",
    demoLabel: true,
  },
  {
    id: "lim-q3c-hexane",
    category: "Q3C",
    nameZh: "正己烷",
    nameEn: "Hexane",
    cas: "110-54-3",
    exampleValue: "290",
    unit: "ppm (PDE 示例量级)",
    classOrNote: "Class 2 · 示例",
    impurityTypes: ["residual_solvent"],
    officialUrls: [
      { label: "ICH Q3C", url: "https://database.ich.org/" },
    ],
    disclaimerZh: "示例/请核官方最新版",
    demoLabel: true,
  },
  {
    id: "lim-q3c-acetonitrile",
    category: "Q3C",
    nameZh: "乙腈",
    nameEn: "Acetonitrile",
    cas: "75-05-8",
    exampleValue: "410",
    unit: "ppm (PDE 示例量级)",
    classOrNote: "Class 2 · 示例",
    impurityTypes: ["residual_solvent"],
    officialUrls: [
      { label: "ICH Q3C", url: "https://database.ich.org/" },
    ],
    disclaimerZh: "示例/请核官方最新版",
    demoLabel: true,
  },
  {
    id: "lim-q3c-ethanol",
    category: "Q3C",
    nameZh: "乙醇",
    nameEn: "Ethanol",
    cas: "64-17-5",
    exampleValue: "5000",
    unit: "ppm (Class 3 示例量级)",
    classOrNote: "Class 3 · 示例",
    impurityTypes: ["residual_solvent"],
    officialUrls: [
      { label: "ICH Q3C", url: "https://database.ich.org/" },
    ],
    disclaimerZh: "示例/请核官方最新版",
    demoLabel: true,
  },
  {
    id: "lim-q3d-pb",
    category: "Q3D",
    nameZh: "铅",
    nameEn: "Lead (Pb)",
    cas: "7439-92-1",
    exampleValue: "5",
    unit: "µg/day (口服 PDE 示例)",
    classOrNote: "Class 1 · 示例 PDE",
    impurityTypes: ["elemental"],
    officialUrls: [
      {
        label: "ICH Q3D (R2)",
        url: "https://database.ich.org/sites/default/files/Q3D-R2_Guideline_Step4_2022_0322.pdf",
      },
      { label: "ICH 数据库", url: "https://database.ich.org/" },
    ],
    disclaimerZh: "示例/请核官方最新版 — 元素杂质 PDE 以 ICH Q3D 现行版为准。",
    demoLabel: true,
  },
  {
    id: "lim-q3d-as",
    category: "Q3D",
    nameZh: "砷",
    nameEn: "Arsenic (As)",
    cas: "7440-38-2",
    exampleValue: "15",
    unit: "µg/day (口服 PDE 示例)",
    classOrNote: "Class 1 · 示例 PDE",
    impurityTypes: ["elemental"],
    officialUrls: [
      { label: "ICH Q3D", url: "https://database.ich.org/" },
    ],
    disclaimerZh: "示例/请核官方最新版",
    demoLabel: true,
  },
  {
    id: "lim-q3d-cd",
    category: "Q3D",
    nameZh: "镉",
    nameEn: "Cadmium (Cd)",
    cas: "7440-43-9",
    exampleValue: "5",
    unit: "µg/day (口服 PDE 示例)",
    classOrNote: "Class 1 · 示例 PDE",
    impurityTypes: ["elemental"],
    officialUrls: [
      { label: "ICH Q3D", url: "https://database.ich.org/" },
    ],
    disclaimerZh: "示例/请核官方最新版",
    demoLabel: true,
  },
  {
    id: "lim-m7-ndma",
    category: "nitrosamine",
    nameZh: "N-亚硝基二甲胺（NDMA）",
    nameEn: "N-Nitrosodimethylamine (NDMA)",
    cas: "62-75-9",
    exampleValue: "96",
    unit: "ng/day (AI 示例量级)",
    classOrNote: "Cohort of concern · AI 示例（请核最新监管表）",
    impurityTypes: ["nitrosamine"],
    officialUrls: [
      { label: "ICH M7 (R2)", url: "https://database.ich.org/" },
      {
        label: "FDA Nitrosamine guidance",
        url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/control-nitrosamine-impurities-human-drugs",
      },
      {
        label: "EMA nitrosamines",
        url: "https://www.ema.europa.eu/en/human-regulatory-overview/post-authorisation/pharmacovigilance-post-authorisation/referral-procedures-human-medicines/nitrosamine-impurities",
      },
    ],
    disclaimerZh:
      "示例/请核官方最新版 — AI 与可接受摄入量以 FDA/EMA/ICH 最新指导原则为准，本站不替代药典/监管正文。",
    demoLabel: true,
  },
  {
    id: "lim-m7-ndea",
    category: "nitrosamine",
    nameZh: "N-亚硝基二乙胺（NDEA）",
    nameEn: "N-Nitrosodiethylamine (NDEA)",
    cas: "55-18-5",
    exampleValue: "26.5",
    unit: "ng/day (AI 示例量级)",
    classOrNote: "Cohort of concern · AI 示例",
    impurityTypes: ["nitrosamine"],
    officialUrls: [
      { label: "ICH M7", url: "https://database.ich.org/" },
      {
        label: "FDA Nitrosamine",
        url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/control-nitrosamine-impurities-human-drugs",
      },
    ],
    disclaimerZh: "示例/请核官方最新版",
    demoLabel: true,
  },
  {
    id: "lim-m7-nmba",
    category: "nitrosamine",
    nameZh: "NMBA（示例）",
    nameEn: "N-Nitroso-N-methyl-4-aminobutyric acid (NMBA)",
    cas: "61445-55-4",
    exampleValue: "96",
    unit: "ng/day (AI 示例量级)",
    classOrNote: "亚硝胺 AI 示例",
    impurityTypes: ["nitrosamine"],
    officialUrls: [
      {
        label: "FDA Nitrosamine",
        url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/control-nitrosamine-impurities-human-drugs",
      },
      { label: "EMA", url: "https://www.ema.europa.eu/en/human-regulatory-overview/post-authorisation/pharmacovigilance-post-authorisation/referral-procedures-human-medicines/nitrosamine-impurities" },
    ],
    disclaimerZh: "示例/请核官方最新版",
    demoLabel: true,
  },
  {
    id: "lim-m7-generic",
    category: "M7",
    nameZh: "ICH M7 可接受摄入量框架（通用示例）",
    nameEn: "ICH M7 Acceptable Intake framework (generic demo)",
    exampleValue: "见官方 M7 表",
    unit: "—",
    classOrNote: "M7 分类与 TTC / AI 框架 · 非具体化合物限度",
    impurityTypes: ["process", "degradation", "other"],
    officialUrls: [
      {
        label: "ICH M7 (R2) Guideline",
        url: "https://database.ich.org/sites/default/files/M7_R2_Guideline_Step4_2023_0209.pdf",
      },
      { label: "ICH 数据库", url: "https://database.ich.org/" },
    ],
    disclaimerZh: "示例/请核官方最新版 — 本行仅为框架索引，不含具体杂质 AI。",
    demoLabel: true,
  },
];

export function getLimitsForImpurityType(
  type: string,
  cas?: string
): IchLimitRow[] {
  return ichLimits.filter((row) => {
    if (cas && row.cas && row.cas === cas) return true;
    return row.impurityTypes?.includes(type as never) ?? false;
  });
}

export function getLimit(id: string) {
  return ichLimits.find((r) => r.id === id);
}
