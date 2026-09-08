/**
 * Best-effort deep links to official pharmacopoeia portals and open databases.
 * We do not host full text — these open third-party / official sites.
 *
 * Verified patterns (prefer these over guessed portal roots):
 * - Ph. Eur.: https://pheur-online.edqm.eu/content/{epTextNumber}/en/current/
 * - USP DOI: https://doi.org/{uspDoi}
 * - Inxight detail: https://drugs.ncats.io/drug/{unii}
 * - Inxight search: https://drugs.ncats.io/substances?q={query}
 * - Ph.Int. keyword (INN preferred): digicollections Greenstone fqv=
 * - Ph.Int. monograph: https://digicollections.net/phint/en/d/{phIntDocPath}/
 * - ChP: no keyword deep link → #/database?bookId=2 (二部) + copy Chinese name
 * - PubChem: /compound/{name} and #query=
 */

export type OfficialQueryInput = {
  nameZh?: string;
  nameEn?: string;
  inn?: string;
  cas?: string;
  /** FDA UNII — enables Inxight / GSRS direct browse when present */
  unii?: string;
  /** Ph. Eur. text/monograph number (e.g. 0309). Demo ids may 404. */
  epTextNumber?: string;
  /** USP–NF DOI (e.g. 10.31003/USPNF_M…). Demo placeholders must be verified. */
  uspDoi?: string;
  /** Ph.Int. digicollections path (e.g. Jb.6.1.5) */
  phIntDocPath?: string;
};

export type OfficialQueryLinkGroup = "deep" | "withQuery" | "portal";

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
  /** Demo / placeholder identifier — may 404 until curated */
  demoId?: boolean;
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

/** Prefer INN for Ph.Int. / international keyword search (e.g. acetylsalicylic not aspirin). */
export function innPreferredPaste(input: OfficialQueryInput): string {
  return (input.inn || input.nameEn || input.cas || input.nameZh || "").trim();
}

function looksLikeDemoId(id: string): boolean {
  const t = id.trim().toLowerCase();
  return t.startsWith("demo") || t.includes("mdemo") || t.includes("/demo");
}

/**
 * Build 「官网查询」links for a substance (or free-text keyword).
 * Order: document deep links → query-carrying open DBs & site: helpers → login portals.
 */
export function buildOfficialQueryLinks(
  input: OfficialQueryInput
): OfficialQueryLink[] {
  const q = preferredQuery(input);
  const ep = input.epTextNumber?.trim() || "";
  const doi = input.uspDoi?.trim() || "";
  const unii = input.unii?.trim().toUpperCase() || "";
  const phIntPath = input.phIntDocPath?.trim() || "";

  if (!q && !unii && !ep && !doi && !phIntPath) return [];

  const qEn = englishPaste(input) || q;
  const qZh = chinesePaste(input) || q;
  const qInn = innPreferredPaste(input) || qEn;
  const links: OfficialQueryLink[] = [];

  // —— 「直达文档 ID」（有字段才显示）——

  if (ep) {
    const demo = looksLikeDemoId(ep);
    links.push({
      code: "EP-deep",
      labelZh: demo ? "直达 Ph. Eur.（示例）" : "直达 Ph. Eur.",
      url: `https://pheur-online.edqm.eu/content/${enc(ep)}/en/current/`,
      note: demo
        ? `示例编号 ${ep}，可能 404，需订阅/登录，以官方为准`
        : `Ph. Eur. text ${ep}；需订阅/登录`,
      carriesQuery: true,
      group: "deep",
      demoId: demo,
    });
  }

  if (doi) {
    const demo = looksLikeDemoId(doi);
    links.push({
      code: "USP-doi",
      labelZh: demo ? "直达 USP DOI（示例）" : "直达 USP DOI",
      url: `https://doi.org/${doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")}`,
      note: demo
        ? `示例 DOI，须核实；需订阅/登录，以官方为准`
        : `USP–NF DOI；需订阅/登录`,
      carriesQuery: true,
      group: "deep",
      demoId: demo,
    });
  }

  if (unii) {
    links.push({
      code: "Inxight-deep",
      labelZh: "直达 Inxight",
      url: `https://drugs.ncats.io/drug/${enc(unii)}`,
      note: `按 UNII ${unii} 直达`,
      carriesQuery: true,
      group: "deep",
    });
  }

  if (phIntPath) {
    links.push({
      code: "PhInt-deep",
      labelZh: "直达国际药典专论",
      url: `https://digicollections.net/phint/en/d/${phIntPath.replace(/^\/+|\/+$/g, "")}/`,
      note: `Ph.Int. 路径 ${phIntPath}`,
      carriesQuery: true,
      group: "deep",
    });
  }

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
    // Direct compound path (name or CAS often resolves)
    const compoundKey = input.cas?.trim() || qInn || qEn;
    links.push({
      code: "PubChem-compound",
      labelZh: "PubChem 化合物",
      url: `https://pubchem.ncbi.nlm.nih.gov/compound/${enc(compoundKey)}`,
      note: "compound/{name|CAS} 直达尝试",
      carriesQuery: true,
      group: "withQuery",
    });
  }

  // NCATS Inxight — search when no UNII (detail already in deep group)
  if (!unii && qEn) {
    links.push({
      code: "Inxight",
      labelZh: "Inxight Drugs",
      url: `https://drugs.ncats.io/substances?q=${enc(qEn)}`,
      note: "已填入检索词（substances?q=）",
      carriesQuery: true,
      group: "withQuery",
    });
  } else if (unii) {
    // Also offer search chip with UNII for discovery
    links.push({
      code: "Inxight-search",
      labelZh: "Inxight 检索",
      url: `https://drugs.ncats.io/substances?q=${enc(unii)}`,
      note: `substances?q=${unii}`,
      carriesQuery: true,
      group: "withQuery",
    });
  }

  // GSRS human UI
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

  // Ph.Int. keyword — prefer INN (acetylsalicylic not aspirin)
  if (qInn) {
    const fqv = enc(qInn);
    links.push({
      code: "Ph.Int.",
      labelZh: "国际药典检索",
      url: `https://digicollections.net/phint/en/q/?docfl=search&g=Sec&qnew=1&qe=1&t=1&r=1&hs=0&chka=1&fqv=${fqv}&fqf=TX&fqn=1&fqs=0&fqk=0&fqc=1`,
      note: "建议用 INN（如 acetylsalicylic acid）；Greenstone fqv",
      carriesQuery: true,
      group: "withQuery",
    });
  }

  // site: helpers
  if (qZh) {
    links.push({
      code: "GG-ChP",
      labelZh: "一键·ChP",
      url: `https://www.google.com/search?q=${enc(`site:chp.org.cn ${qZh}`)}`,
      note: "带关键词的站外检索；第三方，非官方",
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
      note: "带关键词的站外检索；第三方，非官方",
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
      note: "带关键词的站外检索；第三方，非官方",
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
  // ChP: no keyword deep link — open 二部 database + copy Chinese name
  links.push({
    code: "ChP",
    labelZh: "官网入口·中国药典（二部）",
    url: "https://ydz.chp.org.cn/#/database?bookId=2",
    note: "无关键词深链；打开二部化学药库后粘贴中文名（bookId 1–4 对应各部）",
    carriesQuery: false,
    copyText: qZh || undefined,
    group: "portal",
  });

  links.push({
    code: "USP",
    labelZh: "官网入口·USP–NF",
    url: "https://www.uspnf.com/",
    note: "打开后需粘贴检索（建议复制英文名/INN）；有 uspDoi 时优先用「直达 USP DOI」",
    carriesQuery: false,
    copyText: qEn || undefined,
    group: "portal",
  });

  links.push({
    code: "EP",
    labelZh: "官网入口·Ph. Eur.",
    url: "https://pheur-online.edqm.eu/",
    note: "打开后需粘贴检索；有 epTextNumber 时优先用「直达 Ph. Eur.」",
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
  /** ChP 二部 chemical drugs — no keyword deep link; copy Chinese name */
  ChP: "https://ydz.chp.org.cn/#/database?bookId=2",
  USP: "https://www.uspnf.com/",
  EP: "https://pheur-online.edqm.eu/",
} as const;

/** Deep-link disclaimer (Chinese UI) */
export const DOC_DEEP_LINK_DISCLAIMER =
  "需订阅/登录；示例编号可能 404，以官方为准。本站不托管药典全文。";
