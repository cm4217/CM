/**
 * Expand open substance seed from openFDA NDC active ingredients + UNIIs.
 * Writes/merges into data/incoming/open/ndc-derived-substances.csv then can feed import:open.
 * Identity only — no monograph text.
 */
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const NDC_DIR = join(ROOT, "data/incoming/ndc");
const OUT_CSV = join(ROOT, "data/incoming/open/ndc-derived-substances.csv");
const BUNDLED = join(ROOT, "data/incoming/open/bundled-seed.csv");
const LIMIT = Math.max(100, Number(process.env.OPEN_NDC_SUBSTANCE_LIMIT || 8000) || 8000);

mkdirSync(dirname(OUT_CSV), { recursive: true });

function findNdcJson() {
  if (!existsSync(NDC_DIR)) return null;
  const files = [];
  function walk(d) {
    for (const name of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, name.name);
      if (name.isDirectory()) walk(p);
      else if (/\.json$/i.test(name.name) && !name.name.includes("bundled")) files.push(p);
    }
  }
  walk(NDC_DIR);
  files.sort((a, b) => statSync(b).size - statSync(a).size);
  return files[0] || null;
}

function esc(s) {
  const t = String(s ?? "");
  if (/[",\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

const py = `
import json, sys, collections
path = sys.argv[1]
limit = int(sys.argv[2])
with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)
results = data.get("results") or []
# unii -> {name, synonyms, count}
agg = {}
for r in results:
    if not isinstance(r, dict):
        continue
    if r.get("finished") is False:
        continue
    uniis = ((r.get("openfda") or {}).get("unii") or [])
    ingredients = r.get("active_ingredients") or []
    brand = (r.get("brand_name") or "").strip()
    generic = (r.get("generic_name") or "").strip()
    names = []
    for a in ingredients:
        n = (a.get("name") or "").strip()
        if n:
            names.append(n)
    if not names and generic:
        names.append(generic.split(",")[0].strip())
    if not names:
        continue
    primary = names[0]
    # map each unii to primary ingredient when single-unii; else zip by index if lengths match
    if len(uniis) == 1:
        pairs = [(uniis[0], primary, names[1:])]
    elif len(uniis) == len(names):
        pairs = [(uniis[i], names[i], []) for i in range(len(uniis))]
    elif uniis:
        pairs = [(uniis[0], primary, names[1:])]
    else:
        pairs = [(None, primary, names[1:])]
    for unii, name, extra in pairs:
        key = (unii or "").upper() or ("NAME:" + name.upper())
        if key not in agg:
            agg[key] = {"unii": (unii or "").upper(), "nameEn": name.title() if name.isupper() else name, "synonyms": set(), "count": 0}
        agg[key]["count"] += 1
        if brand:
            agg[key]["synonyms"].add(brand)
        for e in extra:
            agg[key]["synonyms"].add(e)
        if generic and generic.upper() != name.upper():
            agg[key]["synonyms"].add(generic)
# sort by frequency
items = sorted(agg.values(), key=lambda x: -x["count"])
for it in items[:limit]:
    syns = [s for s in it["synonyms"] if s and s.upper() != it["nameEn"].upper()][:8]
    print(json.dumps({
        "nameEn": it["nameEn"],
        "unii": it["unii"] or "",
        "synonyms": "|".join(syns),
        "count": it["count"],
    }, ensure_ascii=False))
sys.stderr.write("unique=%d emitted=%d\\n" % (len(agg), min(limit, len(agg))))
`;

const jsonPath = findNdcJson();
if (!jsonPath) {
  console.error("No NDC JSON under data/incoming/ndc — run import:drugs first or download dump");
  process.exit(1);
}

const tmpPy = join(NDC_DIR, "_expand_substances_tmp.py");
writeFileSync(tmpPy, py, "utf8");
console.log("Expanding substances from", basename(jsonPath));
const r = spawnSync("python3", [tmpPy, jsonPath, String(LIMIT)], {
  encoding: "utf8",
  maxBuffer: 256 * 1024 * 1024,
});
if (r.status !== 0) {
  console.error(r.stderr || r.stdout);
  process.exit(1);
}
if (r.stderr) process.stderr.write(r.stderr);

const seen = new Set();
const rows = [];

function add(nameEn, nameZh, cas, unii, synonyms) {
  const key = (unii || cas || nameEn).toLowerCase();
  if (!nameEn || seen.has(key)) return;
  seen.add(key);
  if (unii) seen.add("unii:" + unii.toLowerCase());
  rows.push({ nameEn, nameZh: nameZh || "", cas: cas || "", unii: unii || "", synonyms: synonyms || "" });
}

// Prefer existing bundled curated rows first
if (existsSync(BUNDLED)) {
  const lines = readFileSync(BUNDLED, "utf8").split(/\r?\n/).filter((l) => l.trim());
  for (let i = 1; i < lines.length; i++) {
    // simple CSV split (bundled is simple)
    const cols = [];
    let cur = "", inQ = false;
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (inQ) {
        if (ch === '"') {
          if (line[j + 1] === '"') { cur += '"'; j++; }
          else inQ = false;
        } else cur += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === ",") { cols.push(cur); cur = ""; }
      else cur += ch;
    }
    cols.push(cur);
    add(cols[0], cols[1], cols[2], cols[3], cols[4] || "");
  }
}

let added = 0;
for (const line of r.stdout.split(/\n/)) {
  if (!line.trim()) continue;
  let obj;
  try { obj = JSON.parse(line); } catch { continue; }
  // skip synthetic-looking names from earlier seed pad if any
  if (/^(Compound|Substance|API|Excipient|Salt|Base)\s+/i.test(obj.nameEn) && /^SEED/i.test(obj.unii || "")) continue;
  const before = rows.length;
  add(obj.nameEn, "", "", obj.unii, obj.synonyms || "");
  if (rows.length > before) added++;
  if (rows.length >= LIMIT) break;
}

const header = "nameEn,nameZh,cas,unii,synonyms";
const body = rows.map((x) => [esc(x.nameEn), esc(x.nameZh), esc(x.cas), esc(x.unii), esc(x.synonyms)].join(",")).join("\n");
writeFileSync(OUT_CSV, header + "\n" + body + "\n", "utf8");
console.log("Wrote", rows.length, "rows ->", OUT_CSV, "(+" + added + " from NDC)");
