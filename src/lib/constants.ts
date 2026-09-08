import type { CopyrightStatus, PharmacopoeiaCode } from "./types";

export const DISCLAIMER =
  "限度与方法以现行官方药典为准；本站提供索引与对照，不替代法定文本。";

export const DISCLAIMER_EN =
  "Limits and methods follow the current official pharmacopoeia; this site provides indexes and crosswalks only and does not replace statutory text.";

export const DEMO_BADGE = "示例数据";

export const OFFICIAL_LINKS: Record<
  PharmacopoeiaCode | "ICH",
  { nameZh: string; nameEn: string; url: string }
> = {
  ChP: {
    nameZh: "中国药典",
    nameEn: "Chinese Pharmacopoeia",
    url: "https://ydz.chp.org.cn/",
  },
  USP: {
    nameZh: "美国药典",
    nameEn: "USP–NF",
    url: "https://www.uspnf.com/",
  },
  EP: {
    nameZh: "欧洲药典",
    nameEn: "Ph. Eur.",
    url: "https://pheur-online.edqm.eu/",
  },
  JP: {
    nameZh: "日本药局方",
    nameEn: "Japanese Pharmacopoeia",
    url: "https://www.pmda.go.jp/english/rs-sb-std/standards-development/jp/0009.html",
  },
  BP: {
    nameZh: "英国药典",
    nameEn: "British Pharmacopoeia",
    url: "https://www.pharmacopoeia.com/",
  },
  IP: {
    nameZh: "印度药典",
    nameEn: "Indian Pharmacopoeia",
    url: "https://www.ipc.gov.in/",
  },
  "Ph.Int.": {
    nameZh: "国际药典",
    nameEn: "WHO International Pharmacopoeia",
    url: "https://digicollections.net/phint/",
  },
  ICH: {
    nameZh: "ICH 指导原则",
    nameEn: "ICH Guidelines",
    url: "https://database.ich.org/",
  },
};

export const COPYRIGHT_LABELS: Record<
  CopyrightStatus,
  { zh: string; en: string; tone: "green" | "amber" | "slate" }
> = {
  usable: { zh: "可用摘要", en: "Usable", tone: "green" },
  needs_license: { zh: "需授权", en: "Needs license", tone: "amber" },
  link_only: { zh: "仅深链", en: "Link-only", tone: "slate" },
};

export const PHARMACOPOEIA_FILTERS: PharmacopoeiaCode[] = [
  "ChP",
  "USP",
  "EP",
  "JP",
  "BP",
  "IP",
  "Ph.Int.",
];
