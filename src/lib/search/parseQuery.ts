/**
 * 查询解析：CAS 规范化/校验、剂型剥离、盐/水合物剥离、中英分段。
 * 保留 raw 供精确匹配加权。
 */

export type DosageFormHint =
  | "片"
  | "胶囊"
  | "注射液"
  | "注射用"
  | "口服溶液"
  | "颗粒"
  | "软膏"
  | "乳膏"
  | "滴眼液"
  | "缓释片"
  | "肠溶片"
  | "分散片"
  | "咀嚼片"
  | "糖浆"
  | "混悬液"
  | "贴剂"
  | "inhalation"
  | "tablet"
  | "capsule"
  | "injection"
  | "solution"
  | "cream"
  | "ointment"
  | "other";

export type ParsedQuery = {
  raw: string;
  normalized: string;
  /** 剥离剂型/盐后的核心检索串 */
  core: string;
  /** 中文片段 */
  zhParts: string[];
  /** 英文/拉丁片段 */
  enParts: string[];
  tokens: string[];
  cas?: string;
  casValid?: boolean;
  dosageForms: DosageFormHint[];
  saltHydrateStripped: string[];
  /** 是否看起来像纯 CAS 查询 */
  isCasQuery: boolean;
};

const DOSAGE_PATTERNS: { re: RegExp; form: DosageFormHint }[] = [
  { re: /缓释片/g, form: "缓释片" },
  { re: /肠溶片/g, form: "肠溶片" },
  { re: /分散片/g, form: "分散片" },
  { re: /咀嚼片/g, form: "咀嚼片" },
  { re: /注射用粉针|注射用/g, form: "注射用" },
  { re: /注射液/g, form: "注射液" },
  { re: /口服溶液/g, form: "口服溶液" },
  { re: /滴眼液/g, form: "滴眼液" },
  { re: /混悬液/g, form: "混悬液" },
  { re: /胶囊/g, form: "胶囊" },
  { re: /颗粒/g, form: "颗粒" },
  { re: /软膏/g, form: "软膏" },
  { re: /乳膏/g, form: "乳膏" },
  { re: /糖浆/g, form: "糖浆" },
  { re: /贴剂/g, form: "贴剂" },
  { re: /片剂|(?<![缓释肠溶分散咀嚼])片/g, form: "片" },
  { re: /\bextended[-\s]?release\s+tablets?\b/gi, form: "tablet" },
  { re: /\benteric[-\s]?coated\s+tablets?\b/gi, form: "tablet" },
  { re: /\btablets?\b/gi, form: "tablet" },
  { re: /\bcapsules?\b/gi, form: "capsule" },
  { re: /\binjections?\b/gi, form: "injection" },
  { re: /\bsolutions?\b/gi, form: "solution" },
  { re: /\bcreams?\b/gi, form: "cream" },
  { re: /\bointments?\b/gi, form: "ointment" },
  { re: /\binhalations?\b/gi, form: "inhalation" },
];

const SALT_HYDRATE_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /盐酸盐/g, label: "盐酸盐" },
  { re: /硫酸盐/g, label: "硫酸盐" },
  { re: /磷酸盐/g, label: "磷酸盐" },
  { re: /钠盐/g, label: "钠盐" },
  { re: /钾盐/g, label: "钾盐" },
  { re: /钙盐/g, label: "钙盐" },
  { re: /马来酸盐/g, label: "马来酸盐" },
  { re: /甲磺酸盐/g, label: "甲磺酸盐" },
  { re: /苯磺酸盐/g, label: "苯磺酸盐" },
  { re: /一水合物|一水合|一水/g, label: "一水" },
  { re: /二水合物|二水合|二水/g, label: "二水" },
  { re: /三水合物|三水合|三水/g, label: "三水" },
  { re: /半水合物|半水/g, label: "半水" },
  { re: /\bhydrochloride\b/gi, label: "hydrochloride" },
  { re: /\bhydrobromide\b/gi, label: "hydrobromide" },
  { re: /\bsulfate\b|\bsulphate\b/gi, label: "sulfate" },
  { re: /\bphosphate\b/gi, label: "phosphate" },
  { re: /\bmaleate\b/gi, label: "maleate" },
  { re: /\bmesylate\b|\bmethanesulfonate\b/gi, label: "mesylate" },
  { re: /\bbesylate\b/gi, label: "besylate" },
  { re: /\bsodium\b/gi, label: "sodium" },
  { re: /\bpotassium\b/gi, label: "potassium" },
  { re: /\bcalcium\b/gi, label: "calcium" },
  { re: /\bHCl\b/g, label: "HCl" },
  { re: /\bmonohydrate\b/gi, label: "monohydrate" },
  { re: /\bdihydrate\b/gi, label: "dihydrate" },
  { re: /\btrihydrate\b/gi, label: "trihydrate" },
  { re: /\bhemihydrate\b/gi, label: "hemihydrate" },
];

/** CAS 校验位：从右到左对除去校验位的数字依次 ×1,×2,… 求和 mod 10 */
export function casCheckDigit(bodyDigits: string): number {
  let sum = 0;
  const chars = bodyDigits.replace(/\D/g, "");
  for (let i = 0; i < chars.length; i++) {
    const digit = Number(chars[chars.length - 1 - i]);
    sum += digit * (i + 1);
  }
  return sum % 10;
}

/** 规范化 CAS：去空格/全角横线，统一为 nnnnnnn-nn-n */
export function normalizeCas(input: string): string | undefined {
  const s = input
    .trim()
    .replace(/[－—–]/g, "-")
    .replace(/\s+/g, "")
    .replace(/^CAS[:：]?\s*/i, "");
  const m = s.match(/^(\d{2,7})-(\d{2})-(\d)$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // 纯数字：尝试按 CAS 规则重插横线
  const digits = s.replace(/\D/g, "");
  if (digits.length >= 5 && digits.length <= 10) {
    const check = digits.slice(-1);
    const mid = digits.slice(-3, -1);
    const head = digits.slice(0, -3);
    if (head.length >= 2 && head.length <= 7) {
      return `${head}-${mid}-${check}`;
    }
  }
  return undefined;
}

export function validateCas(cas: string): boolean {
  const n = normalizeCas(cas);
  if (!n) return false;
  const m = n.match(/^(\d{2,7})-(\d{2})-(\d)$/);
  if (!m) return false;
  const body = m[1] + m[2];
  return casCheckDigit(body) === Number(m[3]);
}

/** 从文本中提取首个疑似 CAS */
export function extractCas(text: string): { cas: string; valid: boolean } | undefined {
  const cleaned = text.replace(/[－—–]/g, "-");
  const m = cleaned.match(/\b(\d{2,7}-\d{2}-\d)\b/);
  if (m) {
    const cas = normalizeCas(m[1])!;
    return { cas, valid: validateCas(cas) };
  }
  // 无分隔纯数字且长度像 CAS
  const only = cleaned.trim().replace(/^CAS[:：]?\s*/i, "");
  if (/^\d{5,10}$/.test(only)) {
    const cas = normalizeCas(only);
    if (cas) return { cas, valid: validateCas(cas) };
  }
  return undefined;
}

function stripDosage(text: string): { text: string; forms: DosageFormHint[] } {
  let out = text;
  const forms: DosageFormHint[] = [];
  for (const { re, form } of DOSAGE_PATTERNS) {
    re.lastIndex = 0;
    if (re.test(out)) {
      forms.push(form);
      re.lastIndex = 0;
      out = out.replace(re, " ");
    }
  }
  return { text: out.replace(/\s+/g, " ").trim(), forms: Array.from(new Set(forms)) };
}

function stripSaltHydrate(text: string): { text: string; stripped: string[] } {
  let out = text;
  const stripped: string[] = [];
  for (const { re, label } of SALT_HYDRATE_PATTERNS) {
    re.lastIndex = 0;
    if (re.test(out)) {
      stripped.push(label);
      re.lastIndex = 0;
      out = out.replace(re, " ");
    }
  }
  return {
    text: out.replace(/\s+/g, " ").trim(),
    stripped: Array.from(new Set(stripped)),
  };
}

function segmentZhEn(text: string): { zhParts: string[]; enParts: string[]; tokens: string[] } {
  const zhParts: string[] = [];
  const enParts: string[] = [];
  const tokens: string[] = [];
  // 连续汉字
  for (const m of Array.from(text.matchAll(/[\u4e00-\u9fff]{1,}/g))) {
    zhParts.push(m[0]);
    tokens.push(m[0]);
  }
  // 拉丁词 / 数字串
  for (const m of Array.from(text.matchAll(/[A-Za-z][A-Za-z0-9\-']*|\d+(?:\.\d+)?/g))) {
    enParts.push(m[0]);
    tokens.push(m[0]);
  }
  return { zhParts, enParts, tokens };
}

export function parseQuery(rawInput: string): ParsedQuery {
  const raw = rawInput.trim();
  const normalized = raw.toLowerCase().replace(/\s+/g, " ");
  const casHit = extractCas(raw);
  const isCasQuery = !!(
    casHit &&
    normalizeCas(raw.replace(/^CAS[:：]?\s*/i, "")) === casHit.cas
  );

  let working = raw;
  if (casHit) {
    // CAS 查询时 core 用规范化 CAS
    working = working.replace(casHit.cas, " ").replace(/\b\d{5,10}\b/, " ");
  }

  const dosage = stripDosage(working);
  const salt = stripSaltHydrate(dosage.text);
  let core = salt.text.replace(/[()（）[\]【】]/g, " ").replace(/\s+/g, " ").trim();
  if (!core && casHit) core = casHit.cas;
  if (!core) core = raw;

  const { zhParts, enParts, tokens } = segmentZhEn(core);

  return {
    raw,
    normalized,
    core,
    zhParts,
    enParts,
    tokens: tokens.length ? tokens : core ? [core] : [],
    cas: casHit?.cas,
    casValid: casHit?.valid,
    dosageForms: dosage.forms,
    saltHydrateStripped: salt.stripped,
    isCasQuery,
  };
}

export type RelaxMode = {
  /** 是否剥离剂型后再搜（默认 true 当检测到剂型且需要放宽） */
  stripDosage: boolean;
  stripSalt: boolean;
  /** 放宽 fuse 阈值 */
  looseFuzzy: boolean;
};

export function buildSearchTerms(
  parsed: ParsedQuery,
  relax: RelaxMode
): string[] {
  const terms = new Set<string>();
  // 始终保留 raw 供精确匹配路径
  if (parsed.raw) terms.add(parsed.raw);
  if (parsed.normalized && parsed.normalized !== parsed.raw.toLowerCase()) {
    terms.add(parsed.normalized);
  }

  let base = parsed.raw;
  if (relax.stripDosage && parsed.dosageForms.length) {
    base = stripDosage(base).text;
  }
  if (relax.stripSalt && parsed.saltHydrateStripped.length) {
    base = stripSaltHydrate(base).text;
  }
  base = base.replace(/[()（）[\]【】]/g, " ").replace(/\s+/g, " ").trim();
  if (base) terms.add(base);

  if (parsed.core) terms.add(parsed.core);
  for (const z of parsed.zhParts) terms.add(z);
  for (const e of parsed.enParts) terms.add(e);
  if (parsed.cas) terms.add(parsed.cas);

  return Array.from(terms).filter(Boolean);
}
