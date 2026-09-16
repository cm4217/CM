# 优化点与缺陷清单 · CM（身份/索引层）

> 调研日期：2026-09-16（Asia/Shanghai）。范围：CM 仓库 only；不含药典全文、不含 HHWYC 合并。

## 本轮已修复

| 优先级 | 项 | 说明 |
|--------|----|------|
| **P0** | 成药 `parentSubstanceId` 错配深链 | 种子中大量成药父 ID 指向错误 `open-*`（如 Aspirin→`open-embelia-ribes-whole`，Clarithromycin→`open-lansoprazole`）。检索索引曾用 `resolve \|\| raw` 把错配写回 SERP；成药卡/相关条会跳到错误物质页。**修复**：索引只保留 `resolveDrugParentSubstanceId` 结果；SERP/相关条仅链到 `sub-*`（或非 open）父物质。 |
| **P0** | `/api/suggest` 成药 href | 自动补全直接使用原始 `parentSubstanceId`，选「阿司匹林」成药会进植物条目。**修复**：与枢纽相同，先 UNII/INN 解析精选 `sub-*`；无法解析则落到 `/search?…&type=drug&tab=drug`。 |
| **P1** | `/alerts?substance=` 漏检 | 枢纽 `alertsForSubstance` 含「杂质父物质」关联，但告警页过滤只看 `relatedSubstanceIds`，漏掉如 `ce-gen-2026-fda-watch`（仅 `imp-aspirin-ndma`）。**修复**：客户端 `alertRelatedToSubstance` 与枢纽一致。 |
| **P1** | 成药反查索引污染 | `ensureDrugIndexes` 把错配成药挂到错误 `open-*` 键上，开放身份页「同 INN 成药」错乱。**修复**：仅在父 ID 本身为精选物质时才挂原始 parent 键。 |
| **P1** | 开放身份页无精选回链 | `/substances/open-*` 即使 UNII 对应 `sub-*` 也不提示。**修复**：精选孪生横幅 + 枢纽芯片；成药条按孪生 ID 拉取。 |
| **P2** | 图谱深链不可分享 | 下拉改焦点不写回 `?focus=`。**修复**：`router.replace` 同步 URL；select 补 `aria-label`。 |
| **P2** | 主导航「更多」 | 无点击外部 / Esc 关闭。**修复**：mousedown + Escape。 |
| **P2** | README 路径陈旧 | `/tools/import` 仍写「CSV」。**修复**：标明 CSV/Excel；`identityResolve` 用户导入文案同步。 |

## 调研发现 · 仍积压

### P0（暂缓 / 需数据侧）

1. **成药种子 `parentSubstanceId` 本体错配**（约 1k+ 可检测错配，另有大量 open 父指向「同复方另一成分」）。运行时已防错链；**重跑 `seed:global-drugs` / 导入脚本从根校正**仍待做（数据工程，非本轮 UI）。
2. **品牌名参与 `resolveDrugParentSubstanceId` 名称匹配** 偶发误挂风险（当前 UNII/INN 优先，观察中）。可收紧为仅 INN/generic + UNII。

### P1

1. **`type=` 与 `tab=` 双轨**：枢纽多用 `type=drug`，意图条用 `tab=`；多数场景可用，但「type=API + tab=drug」组合语义混乱。建议文档化或服务端在 `type=drug` 时忽略冲突 tab。
2. **开放物质 7k+ 无 `generateStaticParams`**：详情依赖运行时解析（OK），但冷启动/SEO 弱；可按需 ISR。
3. **SERP 成药无独立详情路由**：点成药进原料药或再搜；可考虑轻量 `/drugs/[id]` 身份卡（仍非说明书全文）。
4. **关注/备注与实体枢纽**：物质枢纽「关注」「备注」未带 `?substance=` / 预填 target（工作台已有 focus）。
5. **Header「更多」无焦点陷阱**：键盘用户仍可能 Tab 出菜单（已 Esc/外点）。

### P2

1. 图谱 GSRS 探测失败态可读性、空焦点时杂质全图性能。
2. 检索空态未区分「服务端 0 命中」vs「当前 tab 过滤为 0」。
3. Ketcher `console.error` 仅开发可见；可改为页面内错误条统一。
4. 对照品页 `?q=` 不写回 URL（改搜索框后分享丢失）。
5. `docs/module-links.md`「主要缺口」部分条目已实现，文档可再收敛。

## 非缺陷 / 可接受

- EntityHub **HHWYC** 外链：独立仓库占位，保持 optional。
- 精选库规模 ~30：Stats/演示边界已知。
- Meilisearch：可选，离线 fuse 为主路径。

## 验证

- `npm run build`
- `npm run test:search`
- 手动抽检：suggest「aspirin」→ `sub-aspirin`；`/alerts?substance=sub-aspirin` 含杂质关联条；`/graph?focus=sub-aspirin` 改下拉 URL 变化。

## 本轮未改

- HHWYC 仓库 / 模型代码
- 药典全文或专论正文粘贴
- 全球成药种子全量重生成
