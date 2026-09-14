# 模块关联图谱 · Module ↔ Entity Links

> 身份/索引层研究摘要（非药典正文）。更新日期：2026-09-14。

## 共享实体键

| 实体 | 主键 | 关联 ID | 典型页面 |
|------|------|---------|----------|
| 物质 / 原料药 Substance | `id`（`sub-*` / `open-*`） | CAS · UNII · INN · aliases | `/substances/[id]` · `/compendial` |
| 杂质 Impurity | `id`（`imp-*`） | CAS · UNII · `parentSubstanceIds[]` | `/impurities/[id]` · `/graph` · `/limits` |
| 成药 Drug product | `id`（`drug-*`） | `parentSubstanceId` · `unii`/`parentUnii` · INN/generic | SERP `kind=drug`（无独立详情路由） |
| 对照品 RS | `id` | `linkedSubstanceId` · `linkedImpurityId` · CAS | `/reference-standards#id` |
| 修订提醒 Alert | `id` | `relatedSubstanceIds[]` · `relatedImpurityIds[]` | `/alerts` |
| 关注 Watchlist | localStorage query | resolved `{kind,id,cas,unii}` | `/watchlist` · `/workbench` |
| 对比队列 Compare | substance `id[]` | — | `/compare` · SERP「加入对比」 |
| 工作台 Workbench | 聚合上述本地状态 | — | `/workbench` |
| 核查 / 备注 / 问答 | substance 或自由文本 | `?substance=` · notes targetId | `/checklist` · `/notes` · `/ask` |

## 模块 → 实体映射（现状）

```
检索 SERP ──┬── substance ──► 详情 / 对照 / 关注 / 对比 / 核查
            ├── impurity  ──► 杂质详情 / 父物质 / 限度 / RS
            ├── drug      ──► (弱) parentSubstanceId 或搜 API
            └── rs        ──► 对照品锚点

物质详情 ──┬── relatedImpurityIds → 杂质卡
           ├── relatedRSIds → RS
           ├── SubstanceExtras → 局部图谱 + 备注
           └── QuickActions → 关注 / 对比 / 对照 / 核查

杂质详情 ──┬── parentSubstanceIds → 父物质
           ├── relatedRSIds · LimitCards
           └── (缺) 统一模块跳转条

成药索引 ── parentSubstanceId 多指向 open-*；与精选 sub-* 的 UNII/INN 连接未统一解析

预警 AlertCard ── related*Ids 仅「物质详情 →」无名称；影响分析依赖关注列表

图谱 /graph ── 本地 focus 下拉，URL 深链未接

工作台 ── 历史 / 关注 / 队列 / 提醒聚合；队列项无回链到详情与模块
```

## 已有交叉链接（强）

- 物质 ↔ 杂质：种子 `relatedImpurityIds` / `parentSubstanceIds`
- 物质 ↔ RS：`relatedRSIds` / `linkedSubstanceId`
- 物质 ↔ 对照矩阵：`/substances/[id]/compendial` + SERP/知识面板入口
- 杂质 ↔ 限度：`getLimitsForImpurityType`
- SERP 相关条：`/api/related` 共现 + 杂质父物质冷启动
- 关注 / 对比：检索卡与物质快捷操作写入 localStorage
- 核查清单：`?substance=`

## 主要缺口（P0 前）

1. **无统一实体枢纽**：详情页模块跳转分散（QuickActions 仅 4 项；图谱/成药/预警/限度/RS/工作台缺一屏入口）。
2. **成药 ↔ 精选物质弱连接**：`parentSubstanceId` 几乎全是 `open-*`，且部分错配（如 Aspirin→`open-embelia-ribes-whole`）；未按 UNII/INN/别名回挂 `sub-*`。
3. **SERP「另见」不足**：物质卡不展示同 INN 成药；成药卡父物质链不稳；知识面板无模块/成药条。
4. **预警导航弱**：相关物质/杂质无中文名；无按 `?substance=` 过滤。
5. **工作台 / 对比 / 关注**：实体 ID（CAS/UNII）与回链详情、图谱、预警不够显式。
6. **图谱 URL**：无 `?focus=` 深链，枢纽无法直达。

## HHWYC（可选关系 · 不合并）

[HHWYC](https://github.com/cm4217/HHWYC) 为独立化学性质预测器。远期可用同一 CAS/UNII/SMILES 从 CM 物质页深链到 HHWYC 预测结果；**本任务不合并仓库、不迁入模型代码**。占位深链形态：`https://github.com/cm4217/HHWYC` + 身份键说明（见物质枢纽「化学预测 · HHWYC」外链）。

## 本轮实现目标（P0）

- `lib/entityAssociation.ts`：UNII/INN/名称解析成药↔物质；物质/杂质枢纽链接；预警反查。
- `EntityHubPanel`：物质/杂质详情统一相关面板。
- SERP：知识面板 + 相关条 + 结果卡「另见」成药/父物质。
- 检索索引：成药 `parentSubstanceId` 优先解析到精选 `sub-*`。
- 预警：命名链接 + `?substance=` 过滤；图谱 `?focus=`；工作台队列深链。
