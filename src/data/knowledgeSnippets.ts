/**
 * 合法语料片段 — ICH 公开说明 / 免责 / 用法提示。
 * 非药典专论正文；禁止放入 USP/EP/BP 全文。
 */

export type KnowledgeSnippet = {
  id: string;
  tags: string[];
  titleZh: string;
  titleEn?: string;
  bodyZh: string;
  href: string;
  officialUrls?: { label: string; url: string }[];
};

export const knowledgeSnippets: KnowledgeSnippet[] = [
  {
    id: "ks-disclaimer",
    tags: ["免责", "版权", "disclaimer", "copyright", "用法"],
    titleZh: "版权与免责声明",
    titleEn: "Copyright & disclaimer",
    bodyZh:
      "本站为药典索引与杂质发现层演示：只提供公开元数据、专论引用与官方深链，不提供 USP/EP/BP 等法定药典全文。限度与方法以现行官方药典 / ICH / FDA / EMA 为准。",
    href: "/about",
  },
  {
    id: "ks-howto-search",
    tags: ["检索", "search", "用法", "同义词", "拼音"],
    titleZh: "如何检索",
    titleEn: "How to search",
    bodyZh:
      "支持药名 / INN / CAS / 杂质名；同义词（如 乙酰水杨酸↔阿司匹林、ASA）与拼音首字母（如 aspl）可扩展召回；容错由 fuse.js 提供。未来可接入 Meilisearch，当前为零运维本地检索。",
    href: "/search",
  },
  {
    id: "ks-howto-compare",
    tags: ["对比", "compare", "多药典", "专论"],
    titleZh: "跨药典对比工作台",
    titleEn: "Cross-pharmacopoeia compare",
    bodyZh:
      "在「对比」页选择 1–2 个物质，并排查看药典、专论中英名、版本、效力、是否有对照品、版权徽章与官网查询芯片。仅公开元数据，不编造接受标准。",
    href: "/compare",
  },
  {
    id: "ks-howto-graph",
    tags: ["杂质", "图谱", "graph", "关系"],
    titleZh: "杂质关系图谱",
    titleEn: "Impurity relationship graph",
    bodyZh:
      "图谱展示父物质 → 相关杂质（种子 relatedImpurityIds）。点击节点进入详情。可选结合 GSRS 公开关系做富化，不替代法定杂质目录。",
    href: "/graph",
  },
  {
    id: "ks-ich-m7",
    tags: ["ich", "m7", "亚硝胺", "nitrosamine", "ndma"],
    titleZh: "ICH M7 提示（公开索引）",
    titleEn: "ICH M7 note",
    bodyZh:
      "ICH M7 关注 DNA 反应性杂质评估与控制。亚硝胺常需特别关注；限度以 ICH 与药监现行文件为准。本站仅索引。",
    href: "/limits",
    officialUrls: [{ label: "ICH", url: "https://database.ich.org/" }],
  },
  {
    id: "ks-ich-q3c",
    tags: ["ich", "q3c", "残留溶剂", "residual"],
    titleZh: "ICH Q3C 残留溶剂（公开索引）",
    titleEn: "ICH Q3C residual solvents",
    bodyZh:
      "Q3C 将溶剂分为 Class 1/2/3 并给出 PDE 框架。请核 ICH 现行版；本站限值页仅为示例行。",
    href: "/limits",
    officialUrls: [{ label: "ICH", url: "https://database.ich.org/" }],
  },
  {
    id: "ks-ich-q3d",
    tags: ["ich", "q3d", "元素杂质"],
    titleZh: "ICH Q3D 元素杂质（公开索引）",
    titleEn: "ICH Q3D elemental impurities",
    bodyZh: "Q3D 给出元素杂质 PDE 与风险评估思路。本站不替代官方 PDE 表。",
    href: "/limits",
  },
  { id: "ks-rs-pipeline", tags: ["rs"], titleZh: "对照品目录说明", titleEn: "RS", bodyZh: "对照品目录元数据；sync:rs 刷新。", href: "/reference-standards" },
  { id: "ks-alerts-watch", tags: ["修订", "alerts"], titleZh: "修订提醒与订阅", titleEn: "Revision alerts", bodyZh: "合并种子与 fetch 生成数据；通告类型与关键词高亮。", href: "/alerts" },
  { id: "ks-watchlist", tags: ["watchlist", "csv"], titleZh: "关注列表批量导入", titleEn: "Watchlist", bodyZh: "粘贴药名/CAS；未收录-仅外链；导出 CSV；localStorage。", href: "/watchlist" },
  { id: "ks-notes", tags: ["notes", "备注"], titleZh: "个人备注（协作 lite）", titleEn: "Notes", bodyZh: "方法编号与备注存 localStorage；团队同步需账号。", href: "/notes" },
  { id: "ks-structure", tags: ["结构", "smiles"], titleZh: "结构检索用法", titleEn: "Structure", bodyZh: "Ketcher/SMILES；identity/similarity/substructure；阈值与分数。", href: "/structure" },
];
