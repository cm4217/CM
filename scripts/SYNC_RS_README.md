# 对照品目录同步说明

## 运行

```bash
npm run sync:rs
```

## 上次同步

- 时间：2026-09-08T01:01:21.728Z

## 如何拉取 EDQM CRS / BPCRS

1. **EDQM CRS**：从 https://crs.edqm.eu/ 经官方渠道导出或使用机构提供的 CRS 清单，放入 `data/incoming/edqm-crs.csv`（列建议：catalogCode,name,cas,status）。
2. **BPCRS**：从 https://www.pharmacopoeia.com/ 官方渠道获取目录，放入 `data/incoming/bpcrs.csv`。
3. **USP**：仅使用官方商店公开元数据或许可数据集；**禁止**抓取 USP-NF 专论全文。

当前公开目录通常**无开放批量 API**。本脚本刷新 `src/data/referenceMaterials.generated.ts` 的 lastSynced，并保留扩展本地种子。若检测到 `data/incoming/*.csv`，可在后续版本接入解析合并。

## 版权

- 只同步目录元数据（编号、名称、CAS、状态、官方深链）
- 不抓取 USP/EP/BP 专论全文
- 演示目录号标注 (demo)
