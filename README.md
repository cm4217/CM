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
