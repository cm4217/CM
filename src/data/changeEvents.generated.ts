import type { ChangeEvent } from "@/lib/types";

/**
 * 由 scripts/fetch-alert-sources.mjs 生成/维护。
 * 网络不可用时保留富化种子；勿写入专论全文。
 */
export const CHANGE_EVENTS_LAST_CHECKED = "2026-09-08T01:54:00.000Z";

export const generatedChangeEvents: ChangeEvent[] = [
  {
    id: "ce-gen-2026-ich-index",
    date: "2026-08-20",
    pharmacopoeia: "ICH",
    titleZh: "ICH 指导原则数据库索引刷新（生成种子）",
    titleEn: "ICH guidelines database index refresh (generated seed)",
    summaryZh:
      "脚本尝试探测 ICH 公开数据库入口后写入的示例事件。请人工核 database.ich.org 最新列表。",
    summaryEn: "Seed written after probing ICH public database entry.",
    severity: "info",
    officialUrl: "https://database.ich.org/",
    sourceKey: "ich-database",
    demoLabel: true,
  },
  {
    id: "ce-gen-2026-edqm-crs",
    date: "2026-07-15",
    pharmacopoeia: "EP",
    titleZh: "EDQM CRS 公开目录入口探测（生成种子）",
    titleEn: "EDQM CRS portal probe (generated seed)",
    summaryZh:
      "对 crs.edqm.eu 公开入口的可达性探测记录。批次/状态请以官方 CRS 商店为准。",
    summaryEn: "Reachability probe for EDQM CRS public portal.",
    relatedSubstanceIds: ["sub-aspirin"],
    severity: "info",
    officialUrl: "https://crs.edqm.eu/",
    sourceKey: "edqm-crs",
    demoLabel: true,
  },
  {
    id: "ce-gen-2026-fda-watch",
    date: "2026-06-01",
    pharmacopoeia: "FDA",
    titleZh: "FDA 亚硝胺指导页关注刷新（生成种子）",
    titleEn: "FDA nitrosamine guidance watch refresh (generated seed)",
    summaryZh: "公开指导原则页监控占位；AI 表与正文以 FDA 现行版为准。",
    summaryEn: "Placeholder watch on FDA public guidance page.",
    relatedImpurityIds: ["imp-aspirin-ndma"],
    severity: "watch",
    officialUrl:
      "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/control-nitrosamine-impurities-human-drugs",
    sourceKey: "fda-nitrosamine",
    demoLabel: true,
  },
];
