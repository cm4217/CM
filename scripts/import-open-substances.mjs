/**
 * import:open / import:unii
 * Download or read UNII/open identity files -> src/data/openSubstances.generated.ts
 * Identity layer only — no pharmacopoeia full text.
 */
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  createReadStream,
  statSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import * as readline from "node:readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const INCOMING = join(ROOT, "data/incoming/open");
const OUT_TS = join(ROOT, "src/data/openSubstances.generated.ts");
const OUT_JSON = join(ROOT, "src/data/openSubstances.generated.json");
const BUNDLED = join(INCOMING, "bundled-seed.csv");

const LIMIT = Math.max(1, Number(process.env.OPEN_IMPORT_LIMIT || 12000) || 8000);
const REQUIRE_CAS = process.env.OPEN_IMPORT_REQUIRE_CAS === "1";
const DOWNLOAD_URL = process.env.OPEN_IMPORT_URL || "";
const STREAM = process.env.OPEN_IMPORT_STREAM !== "0";
const CHUNK_LINES = Math.max(500, Number(process.env.OPEN_IMPORT_CHUNK || 5000) || 5000);

mkdirSync(INCOMING, { recursive: true });

const HEADER_ALIASES = {
  nameEn: [
    "nameen", "name_en", "displayname", "display_name", "preferredname",
    "name", "substance", "substance_name", "pt", "officialname", "englishname",
  ],
  nameZh: ["namezh", "name_zh", "chinese", "chinesename", "cn", "zh"],
  cas: ["cas", "casno", "casnumber", "casrn", "rn", "registry_number", "registrynumber"],
  unii: ["unii", "unii_code", "uniicode", "code"],
  synonyms: ["synonyms", "synonym", "aliases", "alias", "other_names", "othernames"],
};

function normHeader(h) {
  return String(h || "").trim().toLowerCase().replace(/[\s_\-./()]+/g, "");
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

function splitCsvLine(line, delim = ",") {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === delim) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

function detectDelim(line) {
  const commas = (line.match(/,/g) || []).length;
  const tabs = (line.match(/\t/g) || []).length;
  const semis = (line.match(/;/g) || []).length;
  if (tabs >= commas && tabs >= semis) return "\t";
  if (semis > commas) return ";";
  return ",";
}

function validCas(cas) {
  if (!cas) return false;
  const m = String(cas).trim().match(/^(\d{2,7})-(\d{2})-(\d)$/);
  if (!m) return false;
  const digits = (m[1] + m[2]).split("").reverse().map(Number);
  let sum = 0;
  for (let i = 0; i < digits.length; i++) sum += digits[i] * (i + 1);
  return sum % 10 === Number(m[3]);
}

function slugId(nameEn, unii, cas, i) {
  const base = (unii || cas || nameEn || ("row" + i))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return "open-" + (base || String(i));
}

async function tryDownload(url, dest) {
  if (!url) return false;
  try {
    console.log("Downloading", url);
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
    console.log("Saved", dest);
    return true;
  } catch (e) {
    console.warn("Download failed:", e.message || e);
    return false;
  }
}

function unzipIfNeeded(file) {
  if (!file.toLowerCase().endsWith(".zip")) return [file];
  const destDir = join(INCOMING, "_unzipped");
  mkdirSync(destDir, { recursive: true });
  try {
    execSync("unzip -o -q " + JSON.stringify(file) + " -d " + JSON.stringify(destDir), { stdio: "inherit" });
  } catch {
    console.warn("unzip failed");
    return [];
  }
  const found = [];
  function walk(d) {
    for (const name of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, name.name);
      if (name.isDirectory()) walk(p);
      else if (/\.(csv|tsv|txt)$/i.test(name.name)) found.push(p);
    }
  }
  walk(destDir);
  return found;
}

function listCandidateFiles() {
  const files = [];
  if (!existsSync(INCOMING)) return files;
  for (const name of readdirSync(INCOMING)) {
    if (name.startsWith(".") || name === "README.md" || name === "bundled-seed.csv") continue;
    if (name === "_unzipped" || name === "_chunk_cache") continue;
    if (/\.(csv|tsv|txt|zip)$/i.test(name)) files.push(join(INCOMING, name));
  }
  // Prefer larger dumps / ndc-derived over tiny files
  files.sort((a, b) => {
    const pa = basename(a).includes("ndc-derived") ? 1e15 : 0;
    const pb = basename(b).includes("ndc-derived") ? 1e15 : 0;
    try {
      return (pb + statSync(b).size) - (pa + statSync(a).size);
    } catch {
      return pb - pa;
    }
  });
  return files;
}


function rowFromCols(cols, map, i) {
  const nameEn = (map.nameEn != null ? cols[map.nameEn] : "").trim();
  const nameZh = (map.nameZh != null ? cols[map.nameZh] : "").trim() || undefined;
  let cas = (map.cas != null ? cols[map.cas] : "").trim() || undefined;
  const unii = (map.unii != null ? cols[map.unii] : "").trim() || undefined;
  const synRaw = (map.synonyms != null ? cols[map.synonyms] : "") || "";
  const synonyms = synRaw.split(/[|;,/]/).map((s) => s.trim()).filter(Boolean);
  if (!nameEn && !unii && !cas) return null;
  if (cas && !validCas(cas)) cas = undefined;
  if (REQUIRE_CAS && !cas) return null;
  return {
    nameEn: nameEn || unii || cas || ("unknown-" + i),
    nameZh, cas, unii, synonyms,
  };
}

async function parseCsvFileStreaming(path) {
  const size = statSync(path).size;
  console.log("Streaming parse", basename(path), "(" + Math.round(size / 1024) + " KB)");
  const stream = createReadStream(path, { encoding: "utf8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let delim = ",";
  let map = null;
  let lineNo = 0;
  const records = [];
  for await (const line of rl) {
    if (!line.trim()) continue;
    lineNo++;
    if (lineNo === 1) {
      delim = detectDelim(line);
      const headers = splitCsvLine(line, delim);
      map = mapHeaders(headers);
      if (map.nameEn == null) {
        const n = headers.map(normHeader);
        const idx = n.findIndex((h) => h === "name" || h === "substance" || h.includes("name"));
        if (idx >= 0) map.nameEn = idx;
      }
      continue;
    }
    const cols = splitCsvLine(line, delim);
    const row = rowFromCols(cols, map, lineNo);
    if (row) records.push(row);
    if (lineNo % CHUNK_LINES === 0) console.log("  … lines", lineNo, "kept", records.length);
  }
  console.log("Parsed", records.length, "from", basename(path), "lines", lineNo);
  return records;
}

async function parseCsvFile(path) {
  if (STREAM && existsSync(path) && statSync(path).size > 512 * 1024) {
    return parseCsvFileStreaming(path);
  }
  const raw = readFileSync(path, "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const delim = detectDelim(lines[0]);
  const headers = splitCsvLine(lines[0], delim);
  const map = mapHeaders(headers);
  if (map.nameEn == null) {
    const n = headers.map(normHeader);
    const idx = n.findIndex((h) => h === "name" || h === "substance" || h.includes("name"));
    if (idx >= 0) map.nameEn = idx;
  }
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i], delim);
    const nameEn = (map.nameEn != null ? cols[map.nameEn] : "").trim();
    const nameZh = (map.nameZh != null ? cols[map.nameZh] : "").trim() || undefined;
    let cas = (map.cas != null ? cols[map.cas] : "").trim() || undefined;
    const unii = (map.unii != null ? cols[map.unii] : "").trim() || undefined;
    const synRaw = (map.synonyms != null ? cols[map.synonyms] : "") || "";
    const synonyms = synRaw.split(/[|;,/]/).map((s) => s.trim()).filter(Boolean);
    if (!nameEn && !unii && !cas) continue;
    if (cas && !validCas(cas)) cas = undefined;
    if (REQUIRE_CAS && !cas) continue;
    records.push({
      nameEn: nameEn || unii || cas || ("unknown-" + i),
      nameZh, cas, unii, synonyms,
    });
  }
  return records;
}

function toGenerated(records, provenance) {
  const scored = records.map((r, i) => ({
    r, i,
    score: (r.cas ? 2 : 0) + (r.unii ? 1 : 0) + (r.nameZh ? 0.5 : 0),
  }));
  scored.sort((a, b) => b.score - a.score || a.i - b.i);
  const seen = new Set();
  const out = [];
  for (const { r } of scored) {
    if (out.length >= LIMIT) break;
    const key = (r.unii || r.cas || r.nameEn).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    if (r.cas) {
      const casKey = "cas:" + r.cas;
      if (seen.has(casKey)) continue;
      seen.add(casKey);
    }
    const id = slugId(r.nameEn, r.unii, r.cas, out.length);
    out.push({
      id,
      nameEn: r.nameEn,
      ...(r.nameZh ? { nameZh: r.nameZh } : {}),
      ...(r.cas ? { cas: r.cas } : {}),
      ...(r.unii ? { unii: r.unii } : {}),
      synonyms: r.synonyms || [],
      source: provenance === "ndc" ? "ndc" : "unii",
      provenance,
    });
  }
  return out;
}

function writeTs(records, meta) {
  const metaObj = {
    generatedAt: new Date().toISOString(),
    count: records.length,
    provenance: meta.provenance,
    limit: LIMIT,
    requireCas: REQUIRE_CAS,
    stream: STREAM,
    files: meta.files || [],
    expectedFullScale: "100k-200k+ UNII / NDC-derived rows before LIMIT; default LIMIT 12000 for local; git keeps high-value seed",
  };
  writeFileSync(OUT_JSON, JSON.stringify(records), "utf8");
  const body =
    "/** AUTO-GENERATED by scripts/import-open-substances.mjs — do not edit.\n" +
    " * Identity layer only. Generated: " + metaObj.generatedAt + "\n" +
    " * Count: " + records.length + " provenance: " + meta.provenance + "\n */\n" +
    'import data from "./openSubstances.generated.json";\n\n' +
    "export type OpenSubstanceRecord = {\n" +
    "  id: string;\n  nameEn: string;\n  nameZh?: string;\n  cas?: string;\n  unii?: string;\n" +
    '  synonyms: string[];\n  source: "unii" | "open" | "ndc";\n  provenance: "gsrs" | "seed" | "ndc";\n};\n\n' +
    "export const OPEN_SUBSTANCES_META = " + JSON.stringify(metaObj, null, 2) + " as const;\n\n" +
    "export const openSubstances = data as OpenSubstanceRecord[];\n";
  writeFileSync(OUT_TS, body, "utf8");
  console.log("Wrote", records.length, "->", OUT_JSON, "and", OUT_TS);
}

async function main() {
  if (DOWNLOAD_URL) {
    const dest = join(INCOMING, basename(new URL(DOWNLOAD_URL).pathname) || "download.bin");
    await tryDownload(DOWNLOAD_URL, dest);
  }
  let files = listCandidateFiles();
  const expanded = [];
  for (const f of files) {
    if (f.toLowerCase().endsWith(".zip")) expanded.push(...unzipIfNeeded(f));
    else expanded.push(f);
  }
  files = expanded;
  let provenance = "gsrs";
  let parsed = [];
  const usedFiles = [];
  for (const f of files) {
    try {
      const rows = await parseCsvFile(f);
      if (rows.length) {
        parsed.push(...rows);
        usedFiles.push(basename(f));
        console.log("Parsed", rows.length, "from", basename(f));
        if (basename(f).includes("ndc-derived")) provenance = "ndc";
      }
    } catch (e) {
      console.warn("Skip", f, e.message || e);
    }
  }
  if (parsed.length === 0) {
    console.log("No full dump — using bundled seed");
    if (!existsSync(BUNDLED)) {
      console.error("Missing bundled-seed.csv");
      process.exit(1);
    }
    parsed = await parseCsvFile(BUNDLED);
    usedFiles.push("bundled-seed.csv");
    provenance = "seed";
  }
  const records = toGenerated(parsed, provenance);
  writeTs(records, { provenance, files: usedFiles });
  console.log("Done limit=" + LIMIT + " withCas=" + records.filter((r) => r.cas).length + " provenance=" + provenance);
}

main().catch((e) => { console.error(e); process.exit(1); });
