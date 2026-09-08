#!/usr/bin/env node
/** Regenerate multi-region finished-drug seed + CN brand aliases.
 * Prefers scripts/_generate_global_drug_seed.py if present; otherwise validates existing JSON.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const py = join(root, "scripts/_generate_global_drug_seed.py");
const cn = join(root, "data/incoming/open/cn-brand-aliases.json");
const glob = join(root, "data/incoming/ndc/global-products-seed.json");

if (existsSync(py)) {
  const r = spawnSync("python3", [py], { cwd: root, stdio: "inherit" });
  process.exit(r.status || 0);
}

if (!existsSync(cn) || !existsSync(glob)) {
  console.error("Missing seed JSON. Expected:", cn, "and", glob);
  process.exit(1);
}
const a = JSON.parse(readFileSync(cn, "utf8"));
const g = JSON.parse(readFileSync(glob, "utf8"));
const products = Array.isArray(g) ? g : g.products || [];
const aliases = Array.isArray(a) ? a : a.aliases || [];
const by = {};
for (const p of products) for (const t of p.countryTags || []) by[t] = (by[t] || 0) + 1;
console.log("CN brand aliases:", aliases.length);
console.log("Global products:", products.length, by);
console.log("Seeds already present — edit JSON or add scripts/_generate_global_drug_seed.py to rebuild.");
