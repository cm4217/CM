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
- /workbench 工作台
- /search 检索
- /compare 对比（队列 / 差集 / 导出）
- /checklist 核查清单
- /graph 图谱
- /structure 结构检索
- /reference-standards 对照品
- /limits 限值
- /alerts 修订提醒（影响分析）
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


## 扩库

三通道扩展可搜身份层（不含药典全文）：

### 1. 开放索引（UNII / open identity）

- 将 FDA UNII dump（CSV/ZIP）放入 data/incoming/open/（precision.fda.gov uniisearch archive）
- 执行包脚本 import:open（别名 import:unii）
- 离线：自动使用 bundled-seed.csv
- 环境变量：OPEN_IMPORT_LIMIT、OPEN_IMPORT_REQUIRE_CAS、OPEN_IMPORT_URL
- 生成：src/data/openSubstances.generated.ts；检索徽章「开放索引」

### 2. 缓存草稿（站外 miss）

- 检索结果很少时，「站外可查」按钮将站外结果加入本地可搜缓存
- 写入 data/cache/draft-substances.json（API POST /api/index/draft）
- 管理页：/tools/index
- 检索徽章「缓存草稿」

### 3. CSV 批量导入

- 页面：/tools/import（上传或粘贴，校验 CAS，下载模板）
- 合并至 data/cache/user-import.json
- 检索徽章「用户导入」

### 检索合并与分面

优先级：精选种子 > 用户导入 > 缓存草稿 > 开放 bulk。分面可切换「仅精选种子」/「含开放索引」。

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

## UX 工作流增强（本轮）

1. **检索卡片**：物质结果「加关注」「加入对比」（localStorage；对比队列最多 4）；Toast 反馈。
2. **/compare**：读取对比队列、勾选填充、药典覆盖**差集高亮**、导出 CSV/Markdown。
3. **/alerts**：每条事件「影响分析」— 关注列表名称/别名/CAS 与事件标题摘要重叠。
4. **/checklist**：选物质 + ChP/USP/EP/JP/BP → 可打印核查清单（官方链/杂质/RS 提示，**无**接受标准数值）。物质详情与关注可直达。
5. **/workbench**：检索历史、关注快照、提醒摘要、对比队列入口；快捷键 `/` 聚焦检索、`c` 复制主药名、`Esc` 关补全。
6. **溯源徽章**：CAS/UNII 来源；EP/USP 文档编号 `verified|demo|unverified`（阿司匹林 EP **0309** = 已核验；示例 DOI = 示例）；LiveEnrichment 标注 PubChem/GSRS。

版权姿态不变：仅元数据与外链索引。


## Search backlog (this round)

See package scripts test:search, synonym:gap, meili:index. Autocomplete groups, parent/dosage/advanced facets, NDCG metrics, RxNorm panel, optional Meilisearch via MEILI_HOST + docker-compose.meili.yml.

## 检索结果展示 UX（本轮）

- **最佳匹配 Hero**：顶命中为 exact / cas / synonym 时，PubChem 风格主卡（打开详情、加关注、加入对比、核查清单、复制 CAS/中文名）。
- **按类型分组**：物质 / 杂质 / 对照品分区与计数锚点；物质组内保持排序。
- **命中高亮**：查询词 / 核心词 / CAS 在标题与匹配原因中安全高亮（React 节点，无 HTML 注入）。
- **低相关折叠**：fuzzy / relaxed 超出前几条收入「更多相关结果」；精确类始终展开。
- **卡片抛光**：一键复制 CAS / UNII / 中文名；更清晰层级与键盘 focus ring。
- **概览条**：`物质 x · 杂质 y · 对照品 z · 主命中：…`；`titleOnly` 与杂质 compact 表兼容。

## 检索结果 P0 下一层（本轮）

1. **证据行 Evidence**：每条命中展示 `evidence[{field,value,reasonCode}]`（命中字段 / CAS / 覆盖 / 版本 / ICH 等自有元数据），**无专论正文**。
2. **知识面板**：`/search` lg+ 粘性侧栏；PubChem PNG 经 **`/api/chem/image`** 与 **`/api/chem/compound`** 服务端代理缓存（浏览器不直连 PubChem）；ID 芯片 + ChP/USP/EP/JP/BP/Ph.Int. 覆盖矩阵；标注「PubChem 结构示意图，非正式药典附图」；移动端折叠摘要条。
3. **Best Match 置信门控**：仅当 top1−top2 分差 ≥ 阈值或 tier 为 cas/exact 时展示 Hero；否则「多条接近，请选择」横幅。
4. **客户端提升**：SSR 后按关注 / 最近物质 id 轻量稳定重排 +「关注」徽章；工作台可关。
5. **密度 / 打印 / a11y**：`data-density` compact|default|comfortable；打印隐藏 chrome、展开折叠、显示 URL；结果数 `aria-live`。
6. **意图 Tab** `?tab=all|substance|impurity|rs|external` + 计数；**接近快比** mini-compare；**相关结果条**（关联杂质/父物质 + 同会话共现）。

版权姿态不变：仅元数据与外链索引，不托管法定专论全文。不部署本轮。
