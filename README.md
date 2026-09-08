# 药典对照层 · Pharmacopoeia MVP

中文优先的药典索引 + 杂质发现层演示站。不提供法定药典全文。

> 限度与方法以现行官方药典为准；本站提供索引与对照，不替代法定文本。

## 快速开始

```bash
npm install
npm run dev
npm run build
npm run sync:rs
```


## 技术栈

- Next.js 14 App Router + TypeScript + Tailwind
- 本地种子数据；可选 GSRS / PubChem 富化（约 1h 缓存）

## 本版能力

1. GSRS + PubChem 实时富化
2. 对照品 sync:rs 脚本
3. ICH 限值示例 /limits
4. 结构检索 /structure（SMILES + PubChem；绘图器延后）
5. 修订提醒来源筛选与订阅说明
6. 智能问答 /ask（本地检索；可选云端润色）

## 环境变量（可选）

- OPENAI_API_KEY / OPENAI_MODEL
- ANTHROPIC_API_KEY / ANTHROPIC_MODEL
- 无 Key 即可本地问答；勿提交密钥

## API

- GET /api/gsrs/search?q=
- GET /api/gsrs/substance/[unii]
- GET /api/pubchem/compound?name=|cid=|cas=
- GET /api/structure/search?smiles=
- GET /api/alerts/sources
- GET|POST /api/ask

## 页面

/ /search /structure /substances/[id] /impurities/[id] /reference-standards /limits /alerts /ask /about

## 版权

不抓取 USP/EP/BP 专论全文；实时富化与示例数据明确标注；对照品仅元数据。徽章：usable / needs_license / link_only。

## 许可

产品演示 MVP。第三方名称归各自权利人。详见 scripts/SYNC_RS_README.md（运行 sync:rs 生成）。
