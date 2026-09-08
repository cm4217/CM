/**
 * import:drugs — openFDA NDC (finished products) -> src/data/openDrugProducts.generated.ts
 * Identity / label metadata only — no pharmacopoeia full text.
 *
 * Sources (open/legal):
 *   https://download.open.fda.gov/drug/ndc/drug-ndc-0001-of-0001.json.zip
 * Place under data/incoming/ndc/ or set OPEN_DRUG_IMPORT_URL / OPEN_DRUG_IMPORT_FILE.
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
import { execSync, spawnSync } from "node:child_process";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const INCOMING = join(ROOT, "data/incoming/ndc");
const OUT_TS = join(ROOT, "src/data/openDrugProducts.generated.ts");
const OUT_JSON = join(ROOT, "src/data/openDrugProducts.generated.json");
const BUNDLED = join(INCOMING, "bundled-products-seed.json");
const SUBSTANCE_TS = join(ROOT, "src/data/openSubstances.generated.ts");

const LIMIT = Math.max(1, Number(process.env.OPEN_DRUG_IMPORT_LIMIT || 4000) || 4000);
const DOWNLOAD_URL =
  process.env.OPEN_DRUG_IMPORT_URL ||
  "https://download.open.fda.gov/drug/ndc/drug-ndc-0001-of-0001.json.zip";
const FORCE_DOWNLOAD = process.env.OPEN_DRUG_FORCE_DOWNLOAD === "1";
const SKIP_DOWNLOAD = process.env.OPEN_DRUG_SKIP_DOWNLOAD === "1";
const FILE_OVERRIDE = process.env.OPEN_DRUG_IMPORT_FILE || "";

mkdirSync(INCOMING, { recursive: true });

function titleCase(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

function slugId(parts, i) {
  const base = parts
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 56);
  return "drug-" + (base || String(i));
}

async function tryDownload(url, dest) {
  if (!url) return false;
  try {
    console.log("Downloading", url);
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
    console.log("Saved", dest, Math.round(statSync(dest).size / 1024 / 1024) + " MB");
    return true;
  } catch (e) {
    console.warn("Download failed:", e.message || e);
    return false;
  }
}

function unzipIfNeeded(file) {
  if (!file.toLowerCase().endsWith(".zip")) return file;
  const destDir = join(INCOMING, "_unzipped");
  mkdirSync(destDir, { recursive: true });
  try {
    execSync("unzip -o -q " + JSON.stringify(file) + " -d " + JSON.stringify(destDir), {
      stdio: "inherit",
    });
  } catch {
    console.warn("unzip failed for", file);
    return null;
  }
  const found = [];
  function walk(d) {
    for (const name of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, name.name);
      if (name.isDirectory()) walk(p);
      else if (/\.json$/i.test(name.name)) found.push(p);
    }
  }
  walk(destDir);
  // also check INCOMING itself for already-unzipped
  for (const name of readdirSync(INCOMING)) {
    if (/\.json$/i.test(name) && name !== "bundled-products-seed.json") {
      found.push(join(INCOMING, name));
    }
  }
  return found[0] || null;
}

function listJsonCandidates() {
  if (FILE_OVERRIDE && existsSync(FILE_OVERRIDE)) return [FILE_OVERRIDE];
  const out = [];
  for (const name of readdirSync(INCOMING)) {
    if (name.startsWith(".") || name === "bundled-products-seed.json") continue;
    if (name === "_unzipped") continue;
    const p = join(INCOMING, name);
    if (/\.json$/i.test(name)) out.push(p);
    if (/\.zip$/i.test(name)) {
      const u = unzipIfNeeded(p);
      if (u) out.push(u);
    }
  }
  // prefer largest json
  out.sort((a, b) => {
    try {
      return statSync(b).size - statSync(a).size;
    } catch {
      return 0;
    }
  });
  return out;
}

function loadOpenSubstanceIndex() {
  const byUnii = new Map();
  const byName = new Map();
  const jsonPath = join(ROOT, "src/data/openSubstances.generated.json");
  const path = existsSync(jsonPath) ? jsonPath : SUBSTANCE_TS;
  if (!existsSync(path)) return { byUnii, byName };
  try {
    let arr;
    if (path.endsWith(".json")) {
      arr = JSON.parse(readFileSync(path, "utf8"));
    } else {
      const raw = readFileSync(path, "utf8");
      const start = raw.indexOf("export const openSubstances");
      const lb = raw.indexOf("[", start);
      const asPos = raw.lastIndexOf(" as OpenSubstanceRecord");
      const rb = asPos > lb ? raw.lastIndexOf("]", asPos) : raw.lastIndexOf("]");
      arr = JSON.parse(raw.slice(lb, rb + 1));
    }
    for (const s of arr) {
      if (s.unii) byUnii.set(String(s.unii).toUpperCase(), s.id);
      if (s.nameEn) byName.set(String(s.nameEn).toLowerCase(), s.id);
      for (const syn of s.synonyms || []) {
        if (syn) byName.set(String(syn).toLowerCase(), s.id);
      }
    }
    console.log("Indexed open substances", arr.length);
  } catch (e) {
    console.warn("Could not index open substances:", e.message || e);
  }
  return { byUnii, byName };
}


function scoreProduct(r) {
  let s = 0;
  if (r.finished) s += 5;
  if (r.brand_name) s += 3;
  if (r.generic_name) s += 2;
  if (r.dosage_form) s += 1;
  if (r.active_ingredients?.length) s += 2;
  if (r.openfda?.unii?.length) s += 3;
  const pt = String(r.product_type || "").toUpperCase();
  if (pt.includes("HUMAN")) s += 2;
  if (pt.includes("PRESCRIPTION") || pt.includes("OTC")) s += 1;
  if (pt.includes("ANIMAL") || pt.includes("BULK")) s -= 4;
  return s;
}

function normalizeProduct(r, idx, substanceIdx) {
  if (!r || r.finished === false) return null;
  const brand = (r.brand_name || "").trim();
  const generic = (r.generic_name || "").trim();
  if (!brand && !generic) return null;
  const ingredients = Array.isArray(r.active_ingredients) ? r.active_ingredients : [];
  const strength = ingredients
    .map((a) => [a.name, a.strength].filter(Boolean).join(" "))
    .filter(Boolean)
    .join(" + ");
  const dosageForm = (r.dosage_form || "").trim() || undefined;
  const route = Array.isArray(r.route) ? r.route.join("/") : r.route || undefined;
  const uniis = (r.openfda?.unii || []).map((u) => String(u).toUpperCase());
  const primaryUnii = uniis[0];
  let parentSubstanceId;
  if (primaryUnii && substanceIdx.byUnii.has(primaryUnii)) {
    parentSubstanceId = substanceIdx.byUnii.get(primaryUnii);
  } else {
    const g0 = (ingredients[0]?.name || generic || "").toLowerCase();
    if (g0 && substanceIdx.byName.has(g0)) parentSubstanceId = substanceIdx.byName.get(g0);
    else {
      // try first token of generic
      const token = g0.split(/[^a-z0-9]+/)[0];
      if (token && substanceIdx.byName.has(token)) parentSubstanceId = substanceIdx.byName.get(token);
    }
  }
  const productNdc = r.product_ndc || r.product_id || "";
  const id = slugId([productNdc || brand || generic, dosageForm, strength.slice(0, 20)], idx);
  const synonyms = [];
  if (brand && generic && brand.toLowerCase() !== generic.toLowerCase()) {
    synonyms.push(generic);
  }
  for (const a of ingredients) {
    if (a.name && !synonyms.includes(a.name)) synonyms.push(a.name);
  }
  return {
    id,
    brandName: brand || titleCase(generic),
    genericName: generic || brand,
    inn: generic ? titleCase(generic.split(/[,;]/)[0].trim()) : undefined,
    strength: strength || undefined,
    dosageForm,
    route,
    productNdc: productNdc || undefined,
    countryTags: ["US"],
    regionTags: ["US", "global"],
    unii: primaryUnii,
    parentUnii: primaryUnii,
    parentSubstanceId,
    labelerName: r.labeler_name || undefined,
    productType: r.product_type || undefined,
    marketingCategory: r.marketing_category || undefined,
    synonyms,
    provenance: "openfda-ndc",
    source: "openfda",
    _score: scoreProduct(r),
  };
}

function parseNdcWithPython(jsonPath) {
  const py = `
import json, sys
path = sys.argv[1]
limit = int(sys.argv[2])
with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)
results = (data.get("results") or []) if isinstance(data, dict) else (data if isinstance(data, list) else [])
# emit compact NDJSON for node
n = 0
for r in results:
    if not isinstance(r, dict):
        continue
    if r.get("finished") is False:
        continue
    brand = (r.get("brand_name") or "").strip()
    generic = (r.get("generic_name") or "").strip()
    if not brand and not generic:
        continue
    out = {
        "product_ndc": r.get("product_ndc") or "",
        "brand_name": brand,
        "generic_name": generic,
        "labeler_name": r.get("labeler_name") or "",
        "dosage_form": r.get("dosage_form") or "",
        "route": r.get("route") or [],
        "product_type": r.get("product_type") or "",
        "marketing_category": r.get("marketing_category") or "",
        "finished": r.get("finished", True),
        "active_ingredients": r.get("active_ingredients") or [],
        "openfda": {"unii": (r.get("openfda") or {}).get("unii") or []},
        "product_id": r.get("product_id") or "",
    }
    print(json.dumps(out, ensure_ascii=False))
    n += 1
sys.stderr.write("python_emitted=%d\\n" % n)
`;
  const tmpPy = join(INCOMING, "_parse_ndc_tmp.py");
  writeFileSync(tmpPy, py, "utf8");
  console.log("Parsing NDC via Python…", basename(jsonPath));
  const r = spawnSync("python3", [tmpPy, jsonPath, String(LIMIT * 20)], {
    encoding: "utf8",
    maxBuffer: 512 * 1024 * 1024,
  });
  try {
    /* keep script for debug? remove */
  } catch {}
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    throw new Error("python parse failed");
  }
  if (r.stderr) process.stderr.write(r.stderr);
  const rows = [];
  for (const line of r.stdout.split(/\n/)) {
    if (!line.trim()) continue;
    try {
      rows.push(JSON.parse(line));
    } catch {
      /* skip */
    }
  }
  return rows;
}

function dedupeAndLimit(products) {
  const scored = products
    .map((p, i) => ({ p, i, score: p._score || 0 }))
    .sort((a, b) => b.score - a.score || a.i - b.i);
  const seen = new Set();
  const out = [];
  for (const { p } of scored) {
    if (out.length >= LIMIT) break;
    // dedupe by brand+generic+strength+form (collapse packaging variants)
    const key = [
      (p.brandName || "").toLowerCase(),
      (p.genericName || "").toLowerCase(),
      (p.strength || "").toLowerCase(),
      (p.dosageForm || "").toLowerCase(),
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    const { _score, ...rest } = p;
    out.push(rest);
  }
  return out;
}

function writeTs(records, meta) {
  const metaObj = {
    generatedAt: new Date().toISOString(),
    count: records.length,
    provenance: meta.provenance,
    limit: LIMIT,
    files: meta.files || [],
    expectedFullScale: "100k+ openFDA NDC finished products before LIMIT; git keeps high-value seed",
  };
  writeFileSync(OUT_JSON, JSON.stringify(records), "utf8");
  const body =
    "/** AUTO-GENERATED by scripts/import-open-drug-products.mjs — do not edit.\n" +
    " * Finished-drug identity (openFDA NDC). Generated: " + metaObj.generatedAt + "\n" +
    " * Count: " + records.length + " provenance: " + meta.provenance + "\n */\n" +
    'import data from "./openDrugProducts.generated.json";\n\n' +
    "export type OpenDrugProductRecord = {\n" +
    "  id: string;\n  brandName: string;\n  genericName: string;\n  inn?: string;\n" +
    "  strength?: string;\n  dosageForm?: string;\n  route?: string;\n  productNdc?: string;\n" +
    "  countryTags: string[];\n  regionTags: string[];\n  unii?: string;\n  parentUnii?: string;\n" +
    "  parentSubstanceId?: string;\n  labelerName?: string;\n  productType?: string;\n" +
    "  marketingCategory?: string;\n  synonyms: string[];\n" +
    '  provenance: "openfda-ndc" | "seed";\n  source: "openfda" | "open";\n};\n\n' +
    "export const OPEN_DRUG_PRODUCTS_META = " + JSON.stringify(metaObj, null, 2) + " as const;\n\n" +
    "export const openDrugProducts = data as OpenDrugProductRecord[];\n";
  writeFileSync(OUT_TS, body, "utf8");
  console.log("Wrote", records.length, "->", OUT_JSON, "and", OUT_TS);
}

function loadBundledSeed() {
  if (!existsSync(BUNDLED)) return [];
  const raw = JSON.parse(readFileSync(BUNDLED, "utf8"));
  return Array.isArray(raw) ? raw : raw.products || [];
}

async function main() {
  let files = listJsonCandidates();
  if ((!files.length || FORCE_DOWNLOAD) && !SKIP_DOWNLOAD) {
    const dest = join(INCOMING, "drug-ndc-0001-of-0001.json.zip");
    const ok = await tryDownload(DOWNLOAD_URL, dest);
    if (ok) {
      const u = unzipIfNeeded(dest);
      files = listJsonCandidates();
      if (u && !files.includes(u)) files.unshift(u);
    }
  }

  const substanceIdx = loadOpenSubstanceIndex();
  let provenance = "openfda-ndc";
  let usedFiles = [];
  let rawRows = [];

  if (files.length) {
    const jsonPath = files[0];
    usedFiles.push(basename(jsonPath));
    rawRows = parseNdcWithPython(jsonPath);
    console.log("Raw finished candidates:", rawRows.length);
  }

  if (!rawRows.length) {
    console.log("No NDC dump — using bundled seed");
    rawRows = loadBundledSeed();
    usedFiles = ["bundled-products-seed.json"];
    provenance = "seed";
  }

  const products = [];
  for (let i = 0; i < rawRows.length; i++) {
    const r = rawRows[i];
    // bundled seed may already be normalized
    if (r.brandName || r.id) {
      products.push({
        ...r,
        brandName: r.brandName || r.brand_name,
        genericName: r.genericName || r.generic_name,
        synonyms: r.synonyms || [],
        countryTags: r.countryTags || ["US"],
        regionTags: r.regionTags || ["US", "global"],
        provenance: r.provenance || provenance,
        source: r.source || (provenance === "seed" ? "open" : "openfda"),
        _score: r._score ?? 10,
      });
      continue;
    }
    const n = normalizeProduct(r, i, substanceIdx);
    if (n) products.push(n);
  }

  const records = dedupeAndLimit(products);
  writeTs(records, { provenance, files: usedFiles });
  const withUnii = records.filter((r) => r.unii).length;
  const withParent = records.filter((r) => r.parentSubstanceId).length;
  console.log(
    "Done limit=" +
      LIMIT +
      " withUnii=" +
      withUnii +
      " linkedParent=" +
      withParent +
      " provenance=" +
      provenance
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
