#!/usr/bin/env node
import { writeFileSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
let HOST = (process.env.MEILI_HOST || "http://127.0.0.1:7700").trim();
if (HOST.endsWith("/")) HOST = HOST.slice(0, -1);
const KEY = (process.env.MEILI_API_KEY || "").trim();


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
  if (!res.ok) throw new Error(method + " " + path + " -> " + res.status);
  return json;
}

async function loadViaTsx() {
  const dump = [
    "import { substances, impurities, referenceMaterials } from \"./src/data\";",
    "const docs = [];",
    "for (const s of substances) {",
    "  docs.push({ id: \"substance:\" + s.id, kind: \"substance\", entityId: s.id,",
    "    titleZh: s.nameZh, titleEn: s.nameEn,",
    "    synonyms: [s.inn, ...(s.aliases||[])].filter(Boolean),",
    "    cas: s.cas || \"\", molecularFormula: s.molecularFormula || \"\",",
    "    blob: [s.nameZh, s.nameEn, s.inn, s.cas, ...(s.aliases||[])].filter(Boolean).join(\" \") });",
    "}",
    "for (const i of impurities) {",
    "  docs.push({ id: \"impurity:\" + i.id, kind: \"impurity\", entityId: i.id,",
    "    titleZh: i.nameZh, titleEn: i.nameEn,",
    "    synonyms: [i.chemicalName, ...(i.namingCrosswalk||[]).map(x=>x.name)].filter(Boolean),",
    "    cas: i.cas || \"\", molecularFormula: i.molecularFormula || \"\",",
    "    parentIds: i.parentSubstanceIds || [],",
    "    blob: [i.nameZh, i.nameEn, i.chemicalName, i.cas].filter(Boolean).join(\" \") });",
    "}",
    "for (const r of referenceMaterials) {",
    "  docs.push({ id: \"rs:\" + r.id, kind: \"rs\", entityId: r.id,",
    "    titleZh: r.nameZh, titleEn: r.nameEn,",
    "    synonyms: [r.catalogCode, r.issuer].filter(Boolean),",
    "    cas: r.cas || \"\",",
    "    blob: [r.nameZh, r.nameEn, r.catalogCode, r.issuer, r.cas].filter(Boolean).join(\" \") });",
    "}",
    "console.log(JSON.stringify(docs));",
  ].join("\n");
  const tmp = join(root, "scripts", "_meili-dump.tmp.ts");
  writeFileSync(tmp, dump, "utf8");
  const r = spawnSync("npx", ["tsx", "--tsconfig", "tsconfig.json", tmp], {
    cwd: root, encoding: "utf8", maxBuffer: 20 * 1024 * 1024,
  });
  try { unlinkSync(tmp); } catch {}
  if (r.status !== 0) { console.error(r.stderr || r.stdout); throw new Error("tsx dump failed"); }
  return JSON.parse(r.stdout);
}

async function main() {
  console.log("Meili host:", HOST);
  try {
    await meili("/health", "GET");
  } catch (e) {
    console.error("Meilisearch not reachable:", e.message || e);
    console.error("Start: docker run -p 7700:7700 getmeili/meilisearch");
    console.error("Or: docker compose -f docker-compose.meili.yml up -d");
    process.exit(1);
  }
  const docs = await loadViaTsx();
  console.log("Docs to upsert:", docs.length);
  try {
    await meili("/indexes", "POST", { uid: "pharm", primaryKey: "id" });
  } catch (e) { /* may exist */ }
  await meili("/indexes/pharm/settings", "PATCH", {
    searchableAttributes: ["titleZh", "titleEn", "synonyms", "cas", "molecularFormula", "blob"],
    filterableAttributes: ["kind", "cas", "parentIds"],
  });
  const batch = 200;
  for (let i = 0; i < docs.length; i += batch) {
    const chunk = docs.slice(i, i + batch);
    const task = await meili("/indexes/pharm/documents", "POST", chunk);
    console.log("task", task.taskUid || task, "chunk", i, "-", i + chunk.length);
  }
  console.log("Done. Index pharm upserted from seed.");
}

main().catch((e) => { console.error(e); process.exit(1); });
