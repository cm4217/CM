#!/usr/bin/env node
/**
 * Synonym gap report from data/query-log.jsonl
 * Usage: node scripts/synonym-gap.mjs
 * Output: data/synonym-gap-report.md
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const logPath = join(root, "data", "query-log.jsonl");
const outPath = join(root, "data", "synonym-gap-report.md");

const SYNONYM_CLUSTERS = [
  ["阿司匹林", "乙酰水杨酸", "aspirin", "asa", "acetylsalicylic acid"],
  ["布洛芬", "异丁苯丙酸", "ibuprofen"],
  ["对乙酰氨基酚", "扑热息痛", "paracetamol", "acetaminophen", "apap"],
  ["奥美拉唑", "omeprazole"],
  ["阿莫西林", "羟氨苄青霉素", "amoxicillin"],
  ["二甲双胍", "甲福明", "metformin"],
  ["氨氯地平", "amlodipine"],
  ["氯沙坦", "losartan"],
  ["雷尼替丁", "ranitidine"],
  ["环丙沙星", "ciprofloxacin"],
  ["华法林", "warfarin"],
  ["氯化钠", "nacl", "sodium chloride"],
  ["乳糖", "lactose"],
  ["水杨酸", "salicylic acid"],
  ["ndma", "n-亚硝基二甲胺", "n-nitrosodimethylamine"],
  ["ndea", "n-亚硝基二乙胺"],
  ["4-氨基苯酚", "对氨基酚", "4-aminophenol"],
  ["甲醇", "methanol"],
];

function norm(s) {
  return String(s || "").trim().toLowerCase();
}

const synonymSet = new Set();
for (const c of SYNONYM_CLUSTERS) {
  for (const t of c) synonymSet.add(norm(t));
}

function inSynonymMap(q) {
  const n = norm(q);
  if (synonymSet.has(n)) return true;
  for (const s of synonymSet) {
    if (n.includes(s) || s.includes(n)) return true;
  }
  return false;
}

function main() {
  if (!existsSync(join(root, "data"))) mkdirSync(join(root, "data"), { recursive: true });
  if (!existsSync(logPath)) {
    const stub = [
      "# 同义词缺口报告",
      "",
      "生成时间：" + new Date().toISOString(),
      "",
      "尚无 `data/query-log.jsonl`。请先在站点检索（自动写入日志），或在工作台点击「导出同义词缺口」触发分析。",
      "",
    ].join("\n");
    writeFileSync(outPath, stub, "utf8");
    console.log("No query log yet → wrote stub", outPath);
    return;
  }

  const lines = readFileSync(logPath, "utf8").split(/\n+/).filter(Boolean);
  const agg = new Map();
  for (const line of lines) {
    try {
      const row = JSON.parse(line);
      const q = String(row.q || "").trim();
      if (!q) continue;
      const hitCount = Number(row.hitCount) || 0;
      const key = norm(q);
      const prev = agg.get(key) || { q, zeros: 0, total: 0, minHits: Infinity };
      prev.total++;
      if (hitCount === 0) prev.zeros++;
      prev.minHits = Math.min(prev.minHits, hitCount);
      agg.set(key, prev);
    } catch {
      /* skip */
    }
  }

  const gaps = Array.from(agg.values())
    .filter((r) => r.minHits === 0 || r.zeros > 0)
    .filter((r) => !inSynonymMap(r.q))
    .sort((a, b) => b.zeros - a.zeros || b.total - a.total);

  const fuzzyish = Array.from(agg.values())
    .filter((r) => r.minHits > 0 && r.minHits < 3)
    .filter((r) => !inSynonymMap(r.q))
    .sort((a, b) => a.minHits - b.minHits || b.total - a.total)
    .slice(0, 40);

  const gapLines = gaps.length
    ? gaps.map((g) => `- \`${g.q}\` — 出现 ${g.total} 次，其中 0 命中 ${g.zeros} 次`).join("\n")
    : "_无_";
  const fuzzyLines = fuzzyish.length
    ? fuzzyish.map((g) => `- \`${g.q}\` — 最少命中 ${g.minHits}，出现 ${g.total} 次`).join("\n")
    : "_无_";

  const md = [
    "# 同义词缺口报告",
    "",
    "生成时间：" + new Date().toISOString(),
    "",
    "日志行数：" + lines.length + " · 去重查询：" + agg.size,
    "",
    "## 0 命中且不在同义簇",
    "",
    gapLines,
    "",
    "## 低命中（<3）且不在同义簇（候选补同义）",
    "",
    fuzzyLines,
    "",
    "## 说明",
    "",
    "- 日志来自 `POST /api/search-log`（检索页 SearchLogBeacon 刷 localStorage 队列）。",
    "- 同义簇内联自 `src/lib/synonyms.ts` 精简副本；正式补词请改源文件。",
    "- 版权：仅分析站内查询日志，不抓取药典全文。",
    "",
  ].join("\n");

  writeFileSync(outPath, md, "utf8");
  console.log("Wrote " + outPath + " (" + gaps.length + " zero-hit gaps, " + fuzzyish.length + " low-hit)");
}

main();
