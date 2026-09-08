import type { AlertSourceMeta } from "@/lib/types";

/** 官方公告/目录页元数据（供订阅说明与筛选；不抓取付费专论正文） */
export const alertSources: AlertSourceMeta[] = [
  {
    key: "ich-database",
    nameZh: "ICH 指导原则数据库",
    nameEn: "ICH Guidelines Database",
    url: "https://database.ich.org/",
    notesZh: "公开 PDF / 指南列表；建议人工或 RSS/cron 监控更新。",
  },
  {
    key: "fda-nitrosamine",
    nameZh: "FDA 亚硝胺杂质指导",
    nameEn: "FDA Nitrosamine Guidance",
    url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/control-nitrosamine-impurities-human-drugs",
    notesZh: "公开指导原则页；AI 表以 FDA 最新版为准。",
  },
  {
    key: "ema-nitrosamine",
    nameZh: "EMA 亚硝胺杂质专题",
    nameEn: "EMA Nitrosamine Impurities",
    url: "https://www.ema.europa.eu/en/human-regulatory-overview/post-authorisation/pharmacovigilance-post-authorisation/referral-procedures-human-medicines/nitrosamine-impurities",
    notesZh: "公开监管专题；不转载专论正文。",
  },
  {
    key: "chp-portal",
    nameZh: "中国药典查询平台",
    nameEn: "ChP Online",
    url: "https://ydz.chp.org.cn/",
    notesZh: "官方深链；专论全文需授权。",
  },
  {
    key: "usp-nf",
    nameZh: "USP–NF / PF",
    nameEn: "USP–NF / Pharmacopeial Forum",
    url: "https://www.uspnf.com/",
    notesZh: "订阅制；本站仅深链，不抓取全文。",
  },
  {
    key: "usp-store",
    nameZh: "USP 对照品商店",
    nameEn: "USP Reference Standards Store",
    url: "https://store.usp.org/",
    notesZh: "公开目录入口；目录号以官方为准。",
  },
  {
    key: "edqm-crs",
    nameZh: "EDQM CRS 目录",
    nameEn: "EDQM CRS Catalogue",
    url: "https://crs.edqm.eu/",
    notesZh: "公开 CRS 检索；同步脚本可尝试拉取公开元数据。",
  },
  {
    key: "ep-online",
    nameZh: "Ph. Eur. Online",
    nameEn: "European Pharmacopoeia Online",
    url: "https://pheur-online.edqm.eu/",
    notesZh: "需授权；本站仅深链。",
  },
  {
    key: "bp-portal",
    nameZh: "British Pharmacopoeia",
    nameEn: "BP / BPCRS",
    url: "https://www.pharmacopoeia.com/",
    notesZh: "订阅制；BPCRS 目录需官方渠道。",
  },
];
