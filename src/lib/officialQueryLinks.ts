/**
 * Best-effort deep links to official pharmacopoeia portals and open databases.
 * We do not host full text — these open third-party / official sites.
 *
 * Prefer URLs that embed the drug name / identifier so users need not re-type.
 * Login-wall portals get copyText for paste-after-open UX.
 */

export type OfficialQueryInput = {
  nameZh?: string;
  nameEn?: string;
  inn?: string;
  cas?: string;
  /** FDA UNII — enables Inxight / GSRS direct browse when present */
  unii?: string;
};

export type OfficialQueryLinkGroup = "withQuery" | "portal";

export type OfficialQueryLink = {
  code: string;
  labelZh: string;
  url: string;
  note?: string;
  /** third-party helper (e.g. site: search), not an official portal */
  thirdParty?: boolean;
  /** URL already embeds the query / identifier — user need not re-type */
  carriesQuery: boolean;
  /** Preferred paste string for this locale (Zh for ChP, En for USP/EP/BP) */
  copyText?: string;
  group: OfficialQueryLinkGroup;
};

function enc(s: string) {
  return encodeURIComponent(s.trim());
}

/** Prefer CAS / INN / English for international DBs; fall back to Chinese. */
function preferredQuery(input: OfficialQueryInput): string {
  for (const c of [input.cas, input.inn, input.nameEn, input.nameZh]) {
    if (c && c.trim()) return c.trim();
  }
  return "";
}

export function englishPaste(input: OfficialQueryInput): string {
  return (input.inn || input.nameEn || input.cas || input.nameZh || "").trim();
}

export function chinesePaste(input: OfficialQueryInput): string {
  return (input.nameZh || input.inn || input.nameEn || input.cas || "").trim();
}

/**
 * Build 「官网查询」links for a substance (or free-text keyword).
 * Order: query-carrying open DBs & site: helpers first, then login portals.
 */
export function buildOfficialQueryLinks(
  input: OfficialQueryInput
): OfficialQueryLink[] {
  const q = preferredQuery(input);
  if (!q && !input.unii?.trim()) return [];

  const qEn = englishPaste(input) || q;
  const qZh = chinesePaste(input) || q;
  const unii = input.unii?.trim().toUpperCase() || "";
  const links: OfficialQueryLink[] = [];

  // —— 「已带关键词（免再输入）」——

  if (qEn) {
    links.push({
      code: "PubChem",
      labelZh: "PubChem",
      url: `https://pubchem.ncbi.nlm.nih.gov/#query=${enc(qEn)}`,
      note: "已填入检索词",
      carriesQuery: true,
      group: "withQuery",
    });
  }

  // NCATS Inxight Drugs — prefer UNII browse when available
  if (unii) {
    links.push({
      code: "Inxight",
      labelZh: "Inxight Drugs",
      url: `https://drugs.ncats.io/drug/${enc(unii)}`,
      note: `按 UNII ${unii} 直达`,
      carriesQuery: true,
      group: "withQuery",
    });
  } else if (qEn) {
    links.push({
      code: "Inxight",
      labelZh: "Inxight Drugs",
      url: `https://drugs.ncats.io/search?facet=Substance&query=${enc(qEn)}`,
      note: "已填入检索词",
      carriesQuery: true,
      group: "withQuery",
    });
  }

  // GSRS human UI (prefer over JSON API)
  if (unii) {
    links.push({
      code: "GSRS",
      labelZh: "GSRS",
      url: `https://gsrs.ncats.nih.gov/ginas/app/ui/substances?search=${enc(unii)}`,
      note: `UNII ${unii}；若未自动填入请在站内再检索`,
      carriesQuery: true,
      copyText: unii,
      group: "withQuery",
    });
  } else if (qEn) {
    links.push({
      code: "GSRS",
      labelZh: "GSRS",
      url: `https://gsrs.ncats.nih.gov/ginas/app/ui/substances?search=${enc(qEn)}`,
      note: "公开 UI；若未自动填入请在站内再检索",
      carriesQuery: true,
      copyText: qEn,
      group: "withQuery",
    });
  }

  if (qEn) {
    links.push({
      code: "Ph.Int.",
      labelZh: "国际药典",
      url: `https://digicollections.net/phint/#t=s&s=${enc(qEn)}`,
      note: "digicollections 已带检索词；若无效请打开 Search 页手动输入",
      carriesQuery: true,
      group: "withQuery",
    });
  }

  // 「一键带词检索」— site: helpers (third-party, results summary visible)
  if (qZh) {
    links.push({
      code: "GG-ChP",
      labelZh: "一键·ChP",
      url: `https://www.google.com/search?q=${enc(`site:chp.org.cn ${qZh}`)}`,
      note: "带关键词的站外检索（可直接看到结果摘要）；第三方，非官方",
      thirdParty: true,
      carriesQuery: true,
      group: "withQuery",
    });
    links.push({
      code: "DDG-ChP",
      labelZh: "Duck·ChP",
      url: `https://duckduckgo.com/?q=${enc(`site:chp.org.cn ${qZh}`)}`,
      note: "带关键词的站外检索；第三方，非官方",
      thirdParty: true,
      carriesQuery: true,
      group: "withQuery",
    });
  }

  if (qEn) {
    links.push({
      code: "DDG-USP",
      labelZh: "一键·USP",
      url: `https://duckduckgo.com/?q=${enc(`site:uspnf.com ${qEn}`)}`,
      note: "带关键词的站外检索（可直接看到结果摘要）；第三方，非官方",
      thirdParty: true,
      carriesQuery: true,
      group: "withQuery",
    });
    links.push({
      code: "GG-USP",
      labelZh: "Google·USP",
      url: `https://www.google.com/search?q=${enc(`site:uspnf.com ${qEn}`)}`,
      note: "带关键词的站外检索；第三方，非官方",
      thirdParty: true,
      carriesQuery: true,
      group: "withQuery",
    });
    links.push({
      code: "DDG-EP",
      labelZh: "一键·EP",
      url: `https://duckduckgo.com/?q=${enc(`site:edqm.eu ${qEn}`)}`,
      note: "带关键词的站外检索（可直接看到结果摘要）；第三方，非官方",
      thirdParty: true,
      carriesQuery: true,
      group: "withQuery",
    });
    links.push({
      code: "DDG-BP",
      labelZh: "一键·BP",
      url: `https://duckduckgo.com/?q=${enc(`site:pharmacopoeia.com ${qEn}`)}`,
      note: "带关键词的站外检索；第三方，非官方",
      thirdParty: true,
      carriesQuery: true,
      group: "withQuery",
    });
    links.push({
      code: "DDG-JP",
      labelZh: "一键·JP",
      url: `https://duckduckgo.com/?q=${enc(`site:pmda.go.jp ${qEn}`)}`,
      note: "带关键词的站外检索；第三方，非官方",
      thirdParty: true,
      carriesQuery: true,
      group: "withQuery",
    });
  }

  // —— 「官网入口（登录后粘贴）」——

  links.push({
    code: "ChP",
    labelZh: "官网入口·中国药典",
    url: "https://ydz.chp.org.cn/#/main",
    note: "打开后需粘贴检索（建议复制中文名）",
    carriesQuery: false,
    copyText: qZh || undefined,
    group: "portal",
  });

  links.push({
    code: "USP",
    labelZh: "官网入口·USP–NF",
    url: "https://www.uspnf.com/",
    note: "打开后需粘贴检索（建议复制英文名/INN）",
    carriesQuery: false,
    copyText: qEn || undefined,
    group: "portal",
  });

  links.push({
    code: "EP",
    labelZh: "官网入口·Ph. Eur.",
    url: "https://pheur-online.edqm.eu/",
    note: "打开后需粘贴检索（建议复制英文名/INN）",
    carriesQuery: false,
    copyText: qEn || undefined,
    group: "portal",
  });

  links.push({
    code: "BP",
    labelZh: "官网入口·英国药典",
    url: "https://www.pharmacopoeia.com/",
    note: "打开后需粘贴检索（建议复制英文名/INN）",
    carriesQuery: false,
    copyText: qEn || undefined,
    group: "portal",
  });

  links.push({
    code: "JP",
    labelZh: "官网入口·日本药局方",
    url: "https://www.pmda.go.jp/english/rs-sb-std/standards-development/jp/0009.html",
    note: "PMDA 列表页；打开后需粘贴或在 PDF 索引检索",
    carriesQuery: false,
    copyText: qEn || undefined,
    group: "portal",
  });

  links.push({
    code: "IP",
    labelZh: "官网入口·印度药典",
    url: "https://www.ipc.gov.in/",
    note: "打开后需粘贴检索",
    carriesQuery: false,
    copyText: qEn || undefined,
    group: "portal",
  });

  return links;
}

/** Portal URLs used by 「复制并打开」primary actions */
export const PORTAL_OPEN_URLS = {
  ChP: "https://ydz.chp.org.cn/#/main",
  USP: "https://www.uspnf.com/",
  EP: "https://pheur-online.edqm.eu/",
} as const;
