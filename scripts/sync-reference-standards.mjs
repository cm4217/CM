#!/usr/bin/env node
/** Sync RS local seed. Docs: scripts/SYNC_RS_README.md */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src/data/referenceMaterials.generated.ts");
const now = new Date().toISOString();
let text = readFileSync(src, "utf8");
text = text.replace(/REFERENCE_MATERIALS_LAST_SYNCED = "[^"]*"/, `REFERENCE_MATERIALS_LAST_SYNCED = "${now}"`);
text = text.replace(/lastSynced: [^\n]*/, `lastSynced: ${now}（本地种子刷新；公开批量 API 不可用时保留扩展示例）`);
writeFileSync(src, text);
const note = `# 对照品目录同步说明\n\n## 运行\n\n\`\`\`bash\nnpm run sync:rs\n\`\`\`\n\n## 上次同步\n\n- 时间：${now}\n\n## 如何拉取 EDQM CRS / BPCRS\n\n1. **EDQM CRS**：从 https://crs.edqm.eu/ 经官方渠道导出或使用机构提供的 CRS 清单，放入 \`data/incoming/edqm-crs.csv\`（列建议：catalogCode,name,cas,status）。\n2. **BPCRS**：从 https://www.pharmacopoeia.com/ 官方渠道获取目录，放入 \`data/incoming/bpcrs.csv\`。\n3. **USP**：仅使用官方商店公开元数据或许可数据集；**禁止**抓取 USP-NF 专论全文。\n\n当前公开目录通常**无开放批量 API**。本脚本刷新 \`src/data/referenceMaterials.generated.ts\` 的 lastSynced，并保留扩展本地种子。若检测到 \`data/incoming/*.csv\`，可在后续版本接入解析合并。\n\n## 版权\n\n- 只同步目录元数据（编号、名称、CAS、状态、官方深链）\n- 不抓取 USP/EP/BP 专论全文\n- 演示目录号标注 (demo)\n`;
writeFileSync(join(root, "scripts/SYNC_RS_README.md"), note);
if (existsSync(join(root, "data/incoming"))) console.log("incoming dir present");
console.log("synced lastSynced ->", now);
console.log("wrote scripts/SYNC_RS_README.md");
