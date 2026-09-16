# 优化点与缺陷清单 · CM（身份/索引层）

> 调研/收尾日期：2026-09-16（Asia/Shanghai）。范围：CM 仓库 only；不含药典全文、不含 HHWYC 合并。

## 本轮已修复（含 eaafbd4 之后积压收尾）

| 优先级 | 项 | 说明 |
|--------|----|------|
| **P0** | 成药 `parentSubstanceId` 错配深链 | 索引只保留 `resolveDrugParentSubstanceId`；SERP/相关条仅链到 `sub-*`（或非 open）父物质。 |
| **P0** | `/api/suggest` 成药 href | 现指向 `/drugs/[id]` 身份卡。 |
| **P0** | **成药种子父 ID 本体校正** | `scripts/patch-drug-parents.mjs`（`npm run patch:drug-parents`）按 UNII→精选 `sub-*`、精确 INN/generic、再 open UNII/名称校正；无法校验的错配 `open-*` 置空。导入脚本同步优先精选。统计见 `OPEN_DRUG_PRODUCTS_META.parentPatch`。 |
| **P0** | **品牌名匹配收紧** | `resolveDrugParentSubstanceId` 名称匹配仅 INN + genericName（不再用 brand/synonyms）。 |
| **P1** | `/alerts?substance=` 漏检 | 客户端 `alertRelatedToSubstance` 与枢纽一致。 |
| **P1** | 成药反查索引污染 | 仅精选物质挂原始 parent 键。 |
| **P1** | 开放身份页精选回链 | 精选孪生横幅 + 枢纽芯片。 |
| **P1** | **`type=` / `tab=` 双轨同步** | `src/lib/searchTabSync.ts`：有 `type=` 时推导并对齐 `tab=`；冲突时 type 胜出；意图页签切换会清掉冲突 type。筛选表单应用时 `syncTypeTabParams`。 |
| **P1** | **`/drugs/[id]` 成药身份卡** | EntityHub、父原料药深链、同 INN 成药条；不含说明书全文。SERP/suggest 成药进此页。 |
| **P1** | **关注/备注 URL 深填** | `/watchlist?substance=` / `?impurity=` / `?q=`；`/notes?substance=` / `?impurity=` 预填 NotesPanel。枢纽芯片已带参。 |
| **P2** | 图谱 `?focus=` 可分享 | `router.replace` 同步 URL。 |
| **P2** | 主导航「更多」外点/Esc | 已修。 |
| **P2** | **Tab 空态文案** | 服务端有命中但当前意图 tab 为 0 时，区分提示并链回「全部」；与整页 0 命中文案分开。 |
| **P2** | README / 导入文案 | CSV/Excel 等。 |

## 仍积压 / 暂缓

### P1

1. **开放物质 7k+ 无 `generateStaticParams`**：详情依赖运行时解析（OK），冷启动/SEO 弱；可按需 ISR。
2. **Header「更多」无焦点陷阱**：键盘用户仍可能 Tab 出菜单（已 Esc/外点）。

### P2

1. 图谱 GSRS 探测失败态可读性、空焦点时杂质全图性能。
2. Ketcher `console.error` 仅开发可见；可改为页面内错误条统一。
3. 对照品页 `?q=` 不写回 URL（改搜索框后分享丢失）。
4. `docs/module-links.md`「主要缺口」部分条目已实现，文档可再收敛。
5. 成药父 ID：复方「同复方另一成分」指向（如仅匹配 Drospirenone）仍可能保留 open 单成分父；需成分级拆分时再做。

## 非缺陷 / 可接受

- EntityHub **HHWYC** 外链：独立仓库占位，保持 optional。
- 精选库规模 ~30：Stats/演示边界已知。
- Meilisearch：可选，离线 fuse 为主路径。

## 验证

- `npm run build`
- `npm run test:search`
- 抽检：`openDrugProducts` 中 Aspirin → `sub-aspirin`；`/drugs/drug-who-aspirin-aspirin-tablet`；`/search?q=aspirin&type=drug` 与 `tab=drug` 对齐；`/watchlist?substance=sub-aspirin`；空 tab 文案。

## 本轮未改

- HHWYC 仓库 / 模型代码
- 药典全文或专论正文粘贴
