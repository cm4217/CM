/**
 * Patch openDrugProducts.parentSubstanceId at source.
 * Prefer curated sub-* via UNII / exact INN / genericName / CAS;
 * else correct open-* via UNII or exact name; else null mismatched open-*.
 * Identity layer only — no pharmacopoeia full text.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_JSON = join(ROOT, "src/data/openDrugProducts.generated.json");
const OUT_TS = join(ROOT, "src/data/openDrugProducts.generated.ts");
const OPEN_JSON = join(ROOT, "src/data/openSubstances.generated.json");
const SUBSTANCES_TS = join(ROOT, "src/data/substances.ts");

function norm(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function loadCurated() {
  const raw = readFileSync(SUBSTANCES_TS, "utf8");
  const curated = [];
  for (const b of raw.split(/\{\s*id:/).slice(1)) {
    const id = (b.match(/^\s*"([^"]+)"/) || [])[1];
    if (!id || !id.startsWith("sub-")) continue;
    curated.push({
      id,
      unii: (b.match(/unii:\s*"([^"]+)"/) || [])[1],
      inn: (b.match(/inn:\s*"([^"]+)"/) || [])[1],
      nameEn: (b.match(/nameEn:\s*"([^"]+)"/) || [])[1],
      nameZh: (b.match(/nameZh:\s*"([^"]+)"/) || [])[1],
      cas: (b.match(/cas:\s*"([^"]+)"/) || [])[1],
      aliases: (() => {
        const m = b.match(/aliases:\s*\[([^\]]*)\]/);
        if (!m) return [];
        return Array.from(String(m[1]).matchAll(/"([^"]+)"/g)).map((x) => x[1]);
      })(),
    });
  }
  return curated;
}

function buildIndexes(curated, open) {
  const curByUnii = new Map();
  const curByName = new Map();
  const curByCas = new Map();
  const curById = new Map();
  for (const c of curated) {
    curById.set(c.id, c);
    if (c.unii) curByUnii.set(String(c.unii).toUpperCase(), c);
    if (c.cas) curByCas.set(String(c.cas).trim(), c);
    for (const n of [c.inn, c.nameEn, c.nameZh, ...(c.aliases || [])]) {
      const k = norm(n);
      if (k && !curByName.has(k)) curByName.set(k, c);
    }
  }
  const openById = new Map();
  const openByUnii = new Map();
  const openByName = new Map();
  for (const o of open) {
    openById.set(o.id, o);
    if (o.unii) openByUnii.set(String(o.unii).toUpperCase(), o);
    for (const n of [o.nameEn, o.nameZh, ...(o.synonyms || [])]) {
      const k = norm(n);
      if (k && !openByName.has(k)) openByName.set(k, o);
    }
  }
  return { curByUnii, curByName, curByCas, curById, openById, openByUnii, openByName };
}

function parentValidates(drug, parentId, idx) {
  if (!parentId) return false;
  if (parentId.startsWith("sub-")) return idx.curById.has(parentId);
  if (!parentId.startsWith("open-")) return false;
  const op = idx.openById.get(parentId);
  if (!op) return false;
  const u = String(drug.parentUnii || drug.unii || "").toUpperCase();
  const ou = String(op.unii || "").toUpperCase();
  if (u && ou && u === ou) return true;
  const dNames = [drug.inn, drug.genericName].map(norm).filter(Boolean);
  const oNames = new Set(
    [op.nameEn, op.nameZh, ...(op.synonyms || [])].map(norm).filter(Boolean)
  );
  return dNames.some((n) => oNames.has(n));
}

function resolveParent(drug, idx) {
  const u = String(drug.parentUnii || drug.unii || "").toUpperCase();
  if (u && idx.curByUnii.has(u)) return { id: idx.curByUnii.get(u).id, via: "cur-unii" };

  for (const n of [drug.inn, drug.genericName]) {
    const k = norm(n);
    if (k && idx.curByName.has(k)) return { id: idx.curByName.get(k).id, via: "cur-name" };
  }

  // Soft curated: generic is a leading token of nameEn (e.g. Ascorbic → Ascorbic acid)
  // Only when single-ingredient-looking and token length >= 5 to avoid "Acid"
  const g = norm(drug.genericName || drug.inn);
  if (g && !/[\s+/]/.test(g) && g.length >= 5) {
    for (const [k, c] of idx.curByName) {
      if (k === g || k.startsWith(g + " ") || g.startsWith(k + " ")) {
        return { id: c.id, via: "cur-prefix" };
      }
    }
  }

  if (u && idx.openByUnii.has(u)) return { id: idx.openByUnii.get(u).id, via: "open-unii" };

  for (const n of [drug.inn, drug.genericName]) {
    const k = norm(n);
    if (k && idx.openByName.has(k)) return { id: idx.openByName.get(k).id, via: "open-name" };
  }

  const old = drug.parentSubstanceId;
  if (old && parentValidates(drug, old, idx)) return { id: old, via: "keep-valid" };
  return { id: undefined, via: old ? "null-mismatch" : "null" };
}

function rewriteTsMeta(stats) {
  if (!existsSync(OUT_TS)) return;
  let body = readFileSync(OUT_TS, "utf8");
  const stamp = new Date().toISOString();
  body = body.replace(
    /Generated: [^\n*]+/,
    `Generated: ${stamp} (parents patched)`
  );
  // refresh OPEN_DRUG_PRODUCTS_META.generatedAt if present
  body = body.replace(
    /"generatedAt":\s*"[^"]+"/,
    `"generatedAt": "${stamp}"`
  );
  if (!body.includes("parentPatch")) {
    body = body.replace(
      /"expectedFullScale":/,
      `"parentPatch": ${JSON.stringify(stats)},\n  "expectedFullScale":`
    );
  } else {
    body = body.replace(
      /"parentPatch":\s*\{[^}]*\}/,
      `"parentPatch": ${JSON.stringify(stats)}`
    );
  }
  writeFileSync(OUT_TS, body, "utf8");
}

function main() {
  const drugs = JSON.parse(readFileSync(OUT_JSON, "utf8"));
  const open = JSON.parse(readFileSync(OPEN_JSON, "utf8"));
  const curated = loadCurated();
  const idx = buildIndexes(curated, open);

  const stats = {
    total: drugs.length,
    toCurated: 0,
    toOpenFixed: 0,
    toNull: 0,
    unchanged: 0,
    detectableMismatchesFixed: 0,
  };

  for (const d of drugs) {
    const old = d.parentSubstanceId || undefined;
    const { id: next, via } = resolveParent(d, idx);
    const oldWasMismatch =
      old &&
      String(old).startsWith("open-") &&
      !parentValidates(d, old, idx);
    if (next === old || (!next && !old)) {
      stats.unchanged++;
      continue;
    }
    if (oldWasMismatch || (old && next && old !== next)) {
      stats.detectableMismatchesFixed++;
    }
    if (next && String(next).startsWith("sub-")) stats.toCurated++;
    else if (next && String(next).startsWith("open-")) stats.toOpenFixed++;
    else stats.toNull++;
    if (next) d.parentSubstanceId = next;
    else delete d.parentSubstanceId;
    d._parentResolveVia = via; // strip before write
  }

  for (const d of drugs) delete d._parentResolveVia;

  writeFileSync(OUT_JSON, JSON.stringify(drugs), "utf8");
  rewriteTsMeta(stats);
  console.log(JSON.stringify(stats, null, 2));
  console.log("Wrote", OUT_JSON);
}

main();
