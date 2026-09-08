# 药典对照层 · Pharmacopoeia MVP

中文优先的**药典索引 + 杂质发现层**演示站。提供物质 / 专论引用 / 杂质命名交叉 / 对照品目录 / 修订提醒的索引与对照，**不提供法定药典全文**。

> 限度与方法以现行官方药典为准；本站提供索引与对照，不替代法定文本。

## 快速开始

```bash
cd /workspace/pharmacopoeia-mvp
npm install
npm run dev
```

浏览器打开 http://localhost:3000 。

生产构建：

```bash
npm run build
npm start
```

脚本：`dev` / `build` / `start`（见 package.json）。

## 技术栈

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- 本地 TS 种子数据（无外部数据库）

## 演示数据（示例数据）

种子数据均标注「示例数据」，包括：

- 物质：阿司匹林 / Aspirin、布洛芬 / Ibuprofen
- 杂质：水杨酸、阿司匹林杂质 B、NDMA（亚硝胺风格示例）、布洛芬杂质 F / J
- 对照品：USP / EDQM / BPCRS 风格示例目录（目录号为虚构）
- 修订事件：若干 ChangeEvent 时间线条目

请勿将演示数据用于注册申报、放行或正式采购。

## 版权立场

| 标记 | 含义 |
|------|------|
| 可用摘要 / usable | 元数据或可公开摘要级索引 |
| 需授权 / needs license | 完整内容需官方许可/订阅 |
| 仅深链 / link-only | 只链到官方平台，不转载正文 |

本项目刻意避免伪造或抓取专论全文。

## 官方入口

- ChP https://ydz.chp.org.cn/
- USP https://www.uspnf.com/
- Ph. Eur. https://pheur-online.edqm.eu/
- JP https://www.pmda.go.jp/english/rs-sb-std/standards-development/jp/0009.html
- BP https://www.pharmacopoeia.com/
- IP https://www.ipc.gov.in/
- WHO Ph.Int. https://digicollections.net/phint/
- ICH https://database.ich.org/

## 路由

| 路径 | 说明 |
|------|------|
| `/` | 首页：检索英雄区、统计、最近提醒、免责声明 |
| `/search` | 检索结果 + 药典/类型/RS 筛选 |
| `/substances/[id]` | 物质详情 |
| `/impurities/[id]` | 杂质详情与命名交叉 |
| `/reference-standards` | 对照品可检索目录 |
| `/alerts` | 修订提醒时间线 |
| `/about` | 关于 / 数据来源 / 法律模型 |

## 实体模型

Substance · MonographRef · ImpurityNode · ReferenceMaterial · ChangeEvent

定义见 `src/lib/types.ts`，数据见 `src/data/`。

## 后续步骤（建议）

1. 接入真实权威元数据源（仅元数据/许可内容），保留版权徽章工作流
2. 用户账户与「关注物质 / 修订订阅」
3. 杂质图谱可视化与 ICH M7 工作流辅助（仍不替代官方限度）
4. 对照品库存/订购深链对接官方商店（若可得）
5. 国际化切换与无障碍访问增强

## 许可说明

本仓库为产品演示 MVP。第三方药典与对照品名称归各自权利人所有。
