#!/usr/bin/env node
import { writeFileSync, readFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseDelimited, parseXmlBestEffort, mergeRows, emitTs, tryParseExistingArray } from "./rs-import-lib.mjs";
import { finishSync } from "./rs-finish.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcPath = join(root, "src/data/referenceMaterials.generated.ts");
const incomingDir = join(root, "data/incoming");
const now = new Date().toISOString();
if (!existsSync(incomingDir)) mkdirSync(incomingDir, { recursive: true });

async function probe(url) {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 6000);
    const res = await fetch(url, { method: "GET", redirect: "follow", signal: c.signal });
    clearTimeout(t);
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}
const probes = { edqm: await probe("https://crs.edqm.eu/"), usp: await probe("https://store.usp.org/") };
console.log("probes", probes);

const files = readdirSync(incomingDir).filter((f) => {
  const e = extname(f).toLowerCase();
  return [".csv", ".tsv", ".txt", ".xml"].includes(e) && !f.startsWith(".");
});
const imported = [];
const importLog = [];
for (const f of files) {
  const text = readFileSync(join(incomingDir, f), "utf8");
  const e = extname(f).toLowerCase();
  const rows = e === ".xml" ? parseXmlBestEffort(text, f) : parseDelimited(text, f);
  console.log(e === ".xml" ? "parse XML" : "parse CSV/TSV", f, rows.length);
  importLog.push({ file: f, count: rows.length });
  imported.push(...rows);
}

const existingText = existsSync(srcPath) ? readFileSync(srcPath, "utf8") : "";
finishSync({ srcPath, existingText, imported, now, wf: writeFileSync, join, root, incomingDir, importLog });
