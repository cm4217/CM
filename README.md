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
- **Ketcher 3.7**（ketcher-react + ketcher-standalone + ketcher-core）结构画板

## 本版能力

1. GSRS + PubChem 实时富化
2. 对照品 sync:rs 脚本
3. ICH 限值示例 /limits
4. 结构检索 /structure（Ketcher 画板 + SMILES 备用输入 + PubChem）
5. 修订提醒来源筛选与订阅说明
6. 智能问答 /ask（本地检索；可选云端润色）


## Ketcher 结构画板

`/structure` 页客户端动态加载 EPAM Ketcher（Apache-2.0）。

| 包 | 版本 | 作用 |
| --- | --- | --- |
| ketcher-react | 3.7.0 | React Editor UI |
| ketcher-standalone | 3.7.0 | 浏览器内 Indigo（WASM） |
| ketcher-core | 3.7.0 | getSmiles / getMolfile / setMolecule |

接入要点：

- client-only：next/dynamic(..., { ssr: false }) + useEffect 内 import()，避免 SSR 碰 window/Worker
- StandaloneStructServiceProvider 从 ketcher-standalone/dist/binaryWasm 引入
- CSS：ketcher-react/dist/index.css（动态加载）；.ketcher-host 固定高度
- next.config.mjs：transpilePackages + asyncWebAssembly + .wasm asset/resource
- Peer：react / react-dom ^18.2（本项目 18.3）；MUI/draft-js 等由 ketcher-react 拉取

页面按钮：「从画板获取 SMILES」「清空」「检索」；下方 SMILES 文本框备用，可展开 MOL。

注意：首次打开 /structure 包体较大（standalone + WASM），仅浏览器加载。

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

产品演示 MVP。第三方名称归各自权利人。Ketcher 为 Apache-2.0（EPAM）。详见 scripts/SYNC_RS_README.md（运行 sync:rs 生成）。
