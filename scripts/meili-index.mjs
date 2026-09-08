#!/usr/bin/env node
/**
 * Index curated + open substances / impurities / RS into Meilisearch `pharm`.
 * Requires MEILI_HOST (default http://127.0.0.1:7700).
 * Build/dev work without Meili — this script is optional.
 */
import { writeFileSync, unlinkSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
let HOST = (process.env.MEILI_HOST || "http://127.0.0.1:7700").trim();
if (HOST.endsWith("/")) HOST = HOST.slice(0, -1);
const KEY = (process.env.MEILI_API_KEY || "").trim();
const INDEX = process.env.MEILI_INDEX || "pharm";
const BATCH = Math.max(50, Number(process.env.MEILI_BATCH || 250) || 250);

function headers() {
  const h = { "Content-Type": "application/json" };
  if (KEY) h.Authorization = "Bearer " + KEY;
  return h;
}

async function meili(path, method, body) {
  const res = await fetch(HOST + path, {
    method,
    headers: headers(),
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) throw new Error(method + " " + path + " -> " + res.status + " " + text.slice(0, 200));
  return json;
}

async function waitTask(taskUid, timeoutMs = 120000) {
  if (taskUid == null) return;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const t = await meili("/tasks/" + taskUid, "GET");
    if (t.status === "succeeded") return t;
    if (t.status === "failed") throw new Error("task failed: " + JSON.stringify(t.error || t));
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error("task timeout " + taskUid);
}

async function loadViaTsx() {
  const dump = [
    'import { substances, impurities, referenceMaterials } from "./src/data";',
    'import { openSubstances } from "./src/data/openSubstances.generated";',
    'import { openDrugProducts } from "./src/data/openDrugProducts.generated";',
    "const docs = [];",
    "for (const s of substances) {",
    '  docs.push({ id: "substance:" + s.id, kind: "substance", entityId: s.id,',
    "    titleZh: s.nameZh, titleEn: s.nameEn,",
    "    synonyms: [s.inn, ...(s.aliases||[])].filter(Boolean),",
    '    cas: s.cas || "", unii: s.unii || "", molecularFormula: s.molecularFormula || "",',
    '    blob: [s.nameZh, s.nameEn, s.inn, s.cas, s.unii, ...(s.aliases||[])].filter(Boolean).join(" ") });',
    "}",
    "for (const i of impurities) {",
    '  docs.push({ id: "impurity:" + i.id, kind: "impurity", entityId: i.id,',
    "    titleZh: i.nameZh, titleEn: i.nameEn,",
    "    synonyms: [i.chemicalName, ...(i.namingCrosswalk||[]).map(x=>x.name)].filter(Boolean),",
    '    cas: i.cas || "", molecularFormula: i.molecularFormula || "",',
    "    parentIds: i.parentSubstanceIds || [],",
    '    blob: [i.nameZh, i.nameEn, i.chemicalName, i.cas].filter(Boolean).join(" ") });',
    "}",
    "for (const r of referenceMaterials) {",
    '  docs.push({ id: "rs:" + r.id, kind: "rs", entityId: r.id,',
    "    titleZh: r.nameZh, titleEn: r.nameEn,",
    "    synonyms: [r.catalogCode, r.issuer].filter(Boolean),",
    '    cas: r.cas || "",',
    '    blob: [r.nameZh, r.nameEn, r.catalogCode, r.issuer, r.cas].filter(Boolean).join(" ") });',
    "}",
    "for (const o of openSubstances || []) {",
    '  docs.push({ id: "substance:" + o.id, kind: "substance", entityId: o.id,',
    "    titleZh: o.nameZh || o.nameEn, titleEn: o.nameEn,",
    "    synonyms: o.synonyms || [],",
    '    cas: o.cas || "", unii: o.unii || "",',
    '    blob: [o.nameZh, o.nameEn, o.cas, o.unii, ...(o.synonyms||[])].filter(Boolean).join(" ") });',
    "}",
    "for (const d of openDrugProducts || []) {",
    '  docs.push({ id: "drug:" + d.id, kind: "drug", entityId: d.id,',
    "    titleZh: d.brandName || d.genericName, titleEn: d.brandName || d.genericName,",
    "    synonyms: [d.genericName, d.inn, d.brandName, ...(d.synonyms||[])].filter(Boolean),",
    '    cas: "", unii: d.unii || "",',
    '    dosageForm: d.dosageForm || "", strength: d.strength || "",',
    '    countryTags: d.countryTags || [], regionTags: [...(d.countryTags||[]), ...(d.regionTags||[])],',
    '    blob: [d.brandName, d.genericName, d.inn, d.strength, d.dosageForm, d.unii, d.productNdc, ...(d.synonyms||[]), ...(d.countryTags||[])].filter(Boolean).join(" ") });',
    "}",
    "console.log(JSON.stringify(docs));",
  ].join("\n");
  const tmp = join(root, "scripts", "_meili-dump.tmp.ts");
  writeFileSync(tmp, dump, "utf8");
  const r = spawnSync("npx", ["tsx", "--tsconfig", "tsconfig.json", tmp], {
    cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
  });
  try { unlinkSync(tmp); } catch {}
  if (r.status !== 0) { console.error(r.stderr || r.stdout); throw new Error("tsx dump failed"); }
  return JSON.parse(r.stdout);
}

async function main() {
  console.log("Meili host:", HOST, "index:", INDEX);
  try {
    const health = await meili("/health", "GET");
    console.log("health:", health.status || health);
  } catch (e) {
    console.error("Meilisearch not reachable:", e.message || e);
    console.error("Start: docker compose up -d");
    console.error("Or: docker compose -f docker-compose.meili.yml up -d");
    process.exit(1);
  }
  const docs = await loadViaTsx();
  console.log("Docs to upsert:", docs.length);
  try {
    await meili("/indexes", "POST", { uid: INDEX, primaryKey: "id" });
  } catch (e) { /* may exist */ }
  const settingsTask = await meili("/indexes/" + INDEX + "/settings", "PATCH", {
    searchableAttributes: ["titleZh", "titleEn", "synonyms", "cas", "unii", "molecularFormula", "dosageForm", "strength", "blob"],
    filterableAttributes: ["kind", "cas", "unii", "parentIds", "dosageForm", "countryTags", "regionTags"],
    sortableAttributes: ["titleEn"],
  });
  await waitTask(settingsTask.taskUid);
  for (let i = 0; i < docs.length; i += BATCH) {
    const chunk = docs.slice(i, i + BATCH);
    const task = await meili("/indexes/" + INDEX + "/documents", "POST", chunk);
    console.log("task", task.taskUid, "chunk", i, "-", i + chunk.length);
    await waitTask(task.taskUid);
  }
  const stats = await meili("/indexes/" + INDEX + "/stats", "GET");
  console.log("Done. numberOfDocuments=", stats.numberOfDocuments);
  console.log("Set MEILI_HOST=" + HOST + " and restart Next to prefer Meili.");
}

main().catch((e) => { console.error(e); process.exit(1); });
