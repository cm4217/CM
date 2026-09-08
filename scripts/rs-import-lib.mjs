/** CSV/TSV/XML parsers for RS sync */
import { basename } from "node:path";

const HEADER_ALIASES = {
  issuer: ["issuer","source","agency","organisation","organization"],
  catalogCode: ["catalogcode","catalogno","catalog","catalogue","code","cataloguenumber","catalogueno","crs","ref"],
  nameEn: ["nameen","name_en","name","englishname","productname","title"],
  nameZh: ["namezh","name_zh","chinese","chinesename"],
  cas: ["cas","casno","casnumber","casrn"],
  linkedSubstanceId: ["linkedsubstanceid","relatedsubstanceid","substanceid","parentid","substance"],
  linkedImpurityId: ["linkedimpurityid","relatedimpurityid","impurityid","impurity"],
  status: ["status","state"],
  officialUrl: ["officialurl","url","link","href"],
  notes: ["notes","note","remark"],
};

function normHeader(h) {
  return String(h || "").trim().toLowerCase().replace(/[\s_\-./]+/g, "");
}
function mapHeaders(headers) {
  const map = {};
  const norms = headers.map(normHeader);
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    for (let i = 0; i < norms.length; i++) {
      if (aliases.includes(norms[i])) { map[field] = i; break; }
    }
  }
  return map;
}
function splitCsvLine(line, delim) {
  const out = []; let cur = ""; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === delim) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur); return out;
}
function detectDelim(firstLine) {
  const tabs = (firstLine.match(/\t/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const semis = (firstLine.match(/;/g) || []).length;
  if (tabs >= commas && tabs >= semis && tabs > 0) return "\t";
  if (semis > commas) return ";";
  return ",";
}
function parseIssuer(raw) {
  const s = String(raw || "").trim().toUpperCase();
  if (!s) return "other";
  if (s.includes("USP")) return "USP";
  if (s.includes("BPCRS") || s === "BP") return "BPCRS";
  if (s.includes("EDQM") || s === "EP" || (s.includes("CRS") && !s.includes("BP"))) return "EDQM";
  if (s.includes("NIFDC") || s.includes("CHP")) return "NIFDC";
  return "other";
}
function parseStatus(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return "current";
  if (/super|obsolete/.test(s)) return "superseded";
  if (/discont|withdrawn/.test(s)) return "discontinued";
  return "current";
}
function slugId(issuer, catalog, nameEn) {
  const base = (issuer + "-" + (catalog || nameEn || "row")).toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  return "rs-import-" + (base || "item");
}

export function parseDelimited(text, filename) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) { console.warn("  skip " + filename + ": need header + row"); return []; }
  const delim = detectDelim(lines[0]);
  const headers = splitCsvLine(lines[0], delim);
  const map = mapHeaders(headers);
  if (map.catalogCode === undefined && map.nameEn === undefined && map.nameZh === undefined) {
    console.warn("  skip " + filename + ": no recognizable headers"); return [];
  }
  const rows = [];
  const guessIssuer = /edqm/i.test(filename) ? "EDQM" : /usp/i.test(filename) ? "USP" : /bp/i.test(filename) ? "BPCRS" : "other";
  for (let li = 1; li < lines.length; li++) {
    const cols = splitCsvLine(lines[li], delim);
    const get = (field) => (map[field] !== undefined ? String(cols[map[field]] ?? "").trim() : "");
    const catalogCode = get("catalogCode") || ("IMPORT-" + li);
    const nameEn = get("nameEn") || get("nameZh") || catalogCode;
    const nameZh = get("nameZh") || nameEn;
    const issuer = parseIssuer(get("issuer") || guessIssuer);
    const cas = get("cas") || undefined;
    const linkedSubstanceId = get("linkedSubstanceId") || undefined;
    const linkedImpurityId = get("linkedImpurityId") || undefined;
    const status = parseStatus(get("status"));
    const officialUrl = get("officialUrl") || (issuer === "EDQM" ? "https://crs.edqm.eu/" : issuer === "USP" ? "https://store.usp.org/" : undefined);
    const notes = get("notes") || ("imported from " + basename(filename));
    rows.push({ id: slugId(issuer, catalogCode, nameEn), catalogCode, nameZh, nameEn, issuer, linkedSubstanceId, linkedImpurityId, cas, status, copyrightStatus: "link_only", officialUrl, notes, demoLabel: true });
  }
  return rows;
}

export function parseXmlBestEffort(text, filename) {
  const rows = [];
  const re = /<(?:Product|Item|CRS|ReferenceStandard|entry|record)[^>]*>[\s\S]*?<\/(?:Product|Item|CRS|ReferenceStandard|entry|record)>/gi;
  const blocks = text.match(re) || [];
  const chunks = blocks.length ? blocks : [text];
  for (let i = 0; i < chunks.length; i++) {
    const block = chunks[i];
    const pick = (...tags) => {
      for (const t of tags) {
        const m = block.match(new RegExp("<" + t + "[^>]*>([^<]+)</" + t + ">", "i"));
        if (m) return m[1].trim();
      }
      return "";
    };
    const catalogCode = pick("CatalogueNumber","CatalogNumber","CatalogCode","Code","CRSCode","Id","Reference") || ("XML-" + (i + 1));
    const nameEn = pick("Name","ProductName","EnglishName","Title","SubstanceName","CommonName") || catalogCode;
    const nameZh = pick("ChineseName","NameZh","NameCN") || nameEn;
    let cas = pick("CAS","CasNumber","CASNumber","CASRN");
    if (!cas) { const casM = block.match(/\b(\d{2,7}-\d{2}-\d)\b/); if (casM) cas = casM[1]; }
    rows.push({ id: slugId("EDQM", catalogCode, nameEn), catalogCode, nameZh, nameEn, issuer: "EDQM", cas: cas || undefined, status: "current", copyrightStatus: "link_only", officialUrl: "https://crs.edqm.eu/", notes: "best-effort XML import from " + basename(filename), demoLabel: true });
  }
  if (!rows.length) console.warn("  XML " + filename + ": empty. Prefer CSV — see scripts/SYNC_RS_README.md");
  return rows;
}

export function mergeRows(existing, incoming) {
  const map = new Map();
  for (const r of existing) {
    const key = (r.issuer + "::" + String(r.catalogCode).replace(/\s*\(demo\)\s*/gi, "").trim()).toLowerCase();
    map.set(key, r); map.set(String(r.id).toLowerCase(), r);
  }
  let added = 0, updated = 0;
  for (const r of incoming) {
    const key = (r.issuer + "::" + String(r.catalogCode).replace(/\s*\(demo\)\s*/gi, "").trim()).toLowerCase();
    const prev = map.get(key) || map.get(String(r.id).toLowerCase());
    if (prev) {
      const merged = { ...prev, ...Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined && v !== "")), id: prev.id, demoLabel: true, copyrightStatus: "link_only" };
      map.set(key, merged); map.set(String(merged.id).toLowerCase(), merged); updated++;
    } else { map.set(key, r); map.set(String(r.id).toLowerCase(), r); added++; }
  }
  const byId = new Map(); for (const r of map.values()) byId.set(r.id, r);
  return { rows: Array.from(byId.values()), added, updated };
}

export function esc(s) {
  return String(s ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

export function emitTs(rows, syncedAt) {
  const lines = [];
  lines.push('import type { ReferenceMaterial } from "@/lib/types";');
  lines.push("");
  lines.push("/**");
  lines.push(" * Generated by scripts/sync-reference-standards.mjs");
  lines.push(" * lastSynced: " + syncedAt + " (merged data/incoming)");
  lines.push(" */");
  lines.push('export const REFERENCE_MATERIALS_LAST_SYNCED = "' + syncedAt + '";');
  lines.push("");
  lines.push("export const generatedReferenceMaterials: ReferenceMaterial[] = [");
  for (const r of rows) {
    lines.push("  {");
    lines.push('    id: "' + esc(r.id) + '",');
    lines.push('    catalogCode: "' + esc(r.catalogCode) + '",');
    lines.push('    nameZh: "' + esc(r.nameZh) + '",');
    lines.push('    nameEn: "' + esc(r.nameEn) + '",');
    lines.push('    issuer: "' + esc(r.issuer) + '",');
    if (r.linkedSubstanceId) lines.push('    linkedSubstanceId: "' + esc(r.linkedSubstanceId) + '",');
    if (r.linkedImpurityId) lines.push('    linkedImpurityId: "' + esc(r.linkedImpurityId) + '",');
    if (r.cas) lines.push('    cas: "' + esc(r.cas) + '",');
    lines.push('    status: "' + esc(r.status || "current") + '",');
    lines.push('    copyrightStatus: "link_only",');
    if (r.officialUrl) lines.push('    officialUrl: "' + esc(r.officialUrl) + '",');
    if (r.notes) lines.push('    notes: "' + esc(r.notes) + '",');
    lines.push("    demoLabel: true,");
    lines.push("  },");
  }
  lines.push("];");
  lines.push("");
  return lines.join("\n");
}

export function tryParseExistingArray(text) {
  const start = text.indexOf("export const generatedReferenceMaterials");
  if (start < 0) return [];
  const arrStart = text.indexOf("[", start);
  const arrEnd = text.lastIndexOf("]");
  if (arrStart < 0 || arrEnd < 0) return [];
  let body = text.slice(arrStart, arrEnd + 1);
  body = body.replace(/(\w+):/g, '"$1":').replace(/'/g, '"').replace(/,\s*([\]}])/g, "$1").replace(/\bundefined\b/g, "null");
  try { const parsed = JSON.parse(body); return Array.isArray(parsed) ? parsed : []; }
  catch (e) { console.warn("  warn: parse existing failed", e.message); return null; }
}
