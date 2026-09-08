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
} from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const INCOMING = join(ROOT, "data/incoming/open");
const OUT_TS = join(ROOT, "src/data/openSubstances.generated.ts");
const BUNDLED = join(INCOMING, "bundled-seed.csv");

const LIMIT = Math.max(1, Number(process.env.OPEN_IMPORT_LIMIT || 800) || 800);
const REQUIRE_CAS = process.env.OPEN_IMPORT_REQUIRE_CAS === "1";
const DOWNLOAD_URL = process.env.OPEN_IMPORT_URL || "";

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
    if (name === "_unzipped") continue;
    if (/\.(csv|tsv|txt|zip)$/i.test(name)) files.push(join(INCOMING, name));
  }
  return files;
}

async function parseCsvFile(path) {
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
    const id = slugId(r.nameEn, r.unii, r.cas, out.length);
    out.push({
      id,
      nameEn: r.nameEn,
      ...(r.nameZh ? { nameZh: r.nameZh } : {}),
      ...(r.cas ? { cas: r.cas } : {}),
      ...(r.unii ? { unii: r.unii } : {}),
      synonyms: r.synonyms || [],
      source: "unii",
      provenance,
    });
  }
  return out;
}

function writeTs(records, meta) {
  const banner = "/** AUTO-GENERATED by scripts/import-open-substances.mjs — do not edit.\n" +
    " * Identity layer only. Generated: " + new Date().toISOString() + "\n" +
    " * Count: " + records.length + " provenance: " + meta.provenance + "\n */\n";
  const body =
    "export type OpenSubstanceRecord = {\n" +
    "  id: string;\n  nameEn: string;\n  nameZh?: string;\n  cas?: string;\n  unii?: string;\n" +
    '  synonyms: string[];\n  source: "unii" | "open";\n  provenance: "gsrs" | "seed";\n};\n\n' +
    "export const OPEN_SUBSTANCES_META = " + JSON.stringify({
      generatedAt: new Date().toISOString(),
      count: records.length,
      provenance: meta.provenance,
      limit: LIMIT,
      requireCas: REQUIRE_CAS,
    }, null, 2) + " as const;\n\n" +
    "export const openSubstances: OpenSubstanceRecord[] = " + JSON.stringify(records, null, 2) + ";\n";
  writeFileSync(OUT_TS, banner + body, "utf8");
  console.log("Wrote", records.length, "->", OUT_TS);
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
