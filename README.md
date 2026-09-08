# 药典对照层 · Pharmacopoeia MVP

中文优先的药典索引 + 杂质发现层演示站。不提供法定药典全文。

> 限度与方法以现行官方药典为准；本站提供索引与对照，不替代法定文本。

## 快速开始

仓库：https://github.com/cm4217/CM

```bash
git clone https://github.com/cm4217/CM.git
cd CM
npm install
npm run dev
```

## 页面路由

- / 首页
- /search 检索
- /compare 对比
- /graph 图谱
- /structure 结构检索
- /reference-standards 对照品
- /limits 限值
- /alerts 修订提醒
- /watchlist 关注
- /notes 备注
- /ask 问答
- /about 关于

## 本版能力

1. 跨药典对比 /compare
2. 杂质图谱 /graph
3. 修订提醒 /alerts + fetch:alerts
4. 对照品 sync:rs
5. 关注列表 /watchlist
6. 检索 同义词/拼音/fuse
7. 结构 identity|similarity|substructure
8. 问答 knowledgeSnippets
9. 备注 /notes
10. 部署 vercel.json

## 技术栈与脚本

Next.js 14 · fuse.js · pinyin-pro · Ketcher 3.7

npm run build | sync:rs | fetch:alerts
## deploy
## 部署上线
Vercel Import cm4217/CM Next.js build
Optional LLM keys; Domains
Meilisearch deferred; offline alerts seed
## 版权
Metadata only; no full text monographs

## 本轮增强（DEMO）

- 扩展示例库：约 30 条常见 API/辅料 + 扩展杂质（亚硝胺/残留溶剂/元素杂质示例节点）与对照品；首页 Stats 自动更新。
- 检索结果卡片加厚：药典覆盖芯片、杂质数、hasRS、CAS/UNII、短摘要、官网查询。
- 关注摘要：/watchlist 与 /alerts「生成关注摘要」→ 中文 Markdown 预览/复制/下载 .md|.txt。
- /structure：Ketcher 按需加载（「打开结构画板」）；SMILES 检索无需打开画板；LiveEnrichment 加载/错误/重试与短缓存。

## 检索增强（本轮）

1. **文档直达**：物质可选 `epTextNumber` / `uspDoi` / `unii` / `phIntDocPath`。有值才显示「直达 Ph. Eur.」「直达 USP DOI」「直达 Inxight」等。阿司匹林使用真实 EP text **0309**；其余多为**示例**编号（可能 404，需订阅/登录，以官方为准）。
2. **自动补全**：`GET /api/suggest?q=` 合并站内物质/杂质/同义词 + PubChem autocomplete（服务端代理）。首页与 `/search` 输入框支持下拉与键盘导航（防抖 ~250ms）。
3. **RxNorm 提示**：`GET /api/resolve?q=` 调用 NLM approximateTerm / rxcui，映射站内种子；站内命中很少时展示「你是不是想找」。
4. **站外可查**：本地 0/~很少结果时展示 PubChem/Inxight/GSRS/Ph.Int./site: 助手卡片（复用 `buildOfficialQueryLinks`），**不伪称药典全文**。
5. **链接口径**：ChP 无关键词深链 → `#/database?bookId=2` + 复制中文名；Inxight 检索 `drugs.ncats.io/substances?q=`；Ph.Int. 优先 INN 的 Greenstone `fqv`；PubChem 另有 `/compound/{name}`。

版权姿态不变：仅元数据与外链索引，不托管法定专论全文。


## Extra features

See docs/excel-integration.md and /tools pages.

## 本轮五大能力（摘要）

1. RS 导入：data/incoming CSV/TSV/XML + package script sync:rs；杂质清单导出（物质页/关注）；FHIR-ish 草稿标为非正式申报件
2. Webhook：关注摘要通用 JSON 与钉钉 markdown（localStorage；可选加签；关键词可用「关注摘要」）
3. /tools/bookmarklet 书签：复制药名打开 ChP/USP/EP
4. /api/lookup 与 /api/lookup.csv；/tools/sheets；docs/excel-integration.md
5. Vercel：Import GitHub cm4217/CM；未登录 CLI 则网页部署；勿虚构公开 URL

导航新增「工具」。版权姿态不变（仅元数据索引）。
