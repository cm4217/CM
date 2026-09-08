/**
 * Best-effort deep links to official pharmacopoeia portals and open databases.
 * We do not host full text — these open third-party / official sites.
 */

export type OfficialQueryInput = {
  nameZh?: string;
  nameEn?: string;
  inn?: string;
  cas?: string;
};

export type OfficialQueryLink = {
  code: string;
  labelZh: string;
  url: string;
  note?: string;
  /** third-party helper (e.g. site: search), not an official portal */
  thirdParty?: boolean;
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

/**
 * Build a row of 「官网查询」links for a substance (or free-text keyword).
 */
export function buildOfficialQueryLinks(
  input: OfficialQueryInput
): OfficialQueryLink[] {
  const q = preferredQuery(input);
  if (!q) return [];

  const qEn = (input.inn || input.nameEn || input.cas || q).trim();
  const qZh = (input.nameZh || q).trim();
  const links: OfficialQueryLink[] = [];

  // —— Open chemical / regulatory DBs (real search URLs) ——
  links.push({
    code: "PubChem",
    labelZh: "PubChem",
    url: `https://pubchem.ncbi.nlm.nih.gov/#query=${enc(qEn)}`,
  });

  // GSRS public UI — browse-substance + search param (best-effort; UI may ignore)
  links.push({
    code: "GSRS",
    labelZh: "GSRS",
    url: `https://gsrs.ncats.nih.gov/ginas/app/beta/browse-substance?search=${enc(
      qEn
    )}`,
    note: "公开 UI；若未自动填入请在站内再检索",
  });

  // —— Pharmacopoeia portals (login wall / no public query param) ——
  links.push({
    code: "ChP",
    labelZh: "中国药典",
    url: "https://ydz.chp.org.cn/",
    note: "需登录后站内检索",
  });

  links.push({
    code: "USP",
    labelZh: "USP–NF",
    url: "https://www.uspnf.com/",
    note: "需登录后站内检索",
  });

  links.push({
    code: "EP",
    labelZh: "Ph. Eur.",
    url: "https://pheur-online.edqm.eu/",
    note: "需登录后站内检索",
  });

  // JP: PMDA list page (no stable per-substance query URL)
  links.push({
    code: "JP",
    labelZh: "日本药局方",
    url: "https://www.pmda.go.jp/english/rs-sb-std/standards-development/jp/0009.html",
    note: "PMDA 列表页；站内或 PDF 索引检索",
  });

  links.push({
    code: "BP",
    labelZh: "英国药典",
    url: "https://www.pharmacopoeia.com/",
    note: "需登录后站内检索",
  });

  links.push({
    code: "IP",
    labelZh: "印度药典",
    url: "https://www.ipc.gov.in/",
    note: "官网入口；站内或 iponline 检索",
  });

  // Ph.Int. digicollections — Search UI; deep query param best-effort
  links.push({
    code: "Ph.Int.",
    labelZh: "国际药典",
    url: `https://digicollections.net/phint/#t=s&s=${enc(qEn)}`,
    note: "digicollections 检索；若无效请打开 Search 页手动输入",
  });

  // —— Third-party site: helpers (clearly labeled, not official) ——
  links.push({
    code: "DDG-USP",
    labelZh: "站外·USP",
    url: `https://duckduckgo.com/?q=${enc(`site:uspnf.com ${qEn}`)}`,
    note: "第三方检索助手，非官方",
    thirdParty: true,
  });

  links.push({
    code: "DDG-EP",
    labelZh: "站外·EP",
    url: `https://duckduckgo.com/?q=${enc(`site:edqm.eu ${qEn}`)}`,
    note: "第三方检索助手，非官方",
    thirdParty: true,
  });

  if (qZh) {
    links.push({
      code: "GG-ChP",
      labelZh: "站外·ChP",
      url: `https://www.google.com/search?q=${enc(`site:chp.org.cn ${qZh}`)}`,
      note: "第三方检索助手，非官方",
      thirdParty: true,
    });
  }

  return links;
}
