import {
  substances,
  impurities,
  referenceMaterials,
  changeEvents,
  ichLimits,
} from "@/data";

export interface RetrievedSnippet {
  kind: "substance" | "impurity" | "rs" | "limit" | "alert";
  id: string;
  titleZh: string;
  titleEn?: string;
  snippetZh: string;
  href: string;
  score: number;
  officialUrls?: { label: string; url: string }[];
}

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[\s,，、;；|/]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 1);
}

function scoreText(tokens: string[], fields: (string | undefined)[]): number {
  const blob = fields.filter(Boolean).join(" ").toLowerCase();
  if (!blob) return 0;
  let score = 0;
  for (const t of tokens) {
    if (!t) continue;
    if (blob.includes(t)) {
      score += t.length >= 4 ? 3 : 2;
      // light boost for exact token boundary-ish
      if (new RegExp(`(?:^|\\s|[\\-/(])${escapeReg(t)}(?:$|\\s|[\\-)/])`, "i").test(blob)) {
        score += 1;
      }
    }
  }
  return score;
}

function escapeReg(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Lightweight keyword / BM25-like retrieval over local seed */
export function retrieveLocal(query: string, limit = 8): RetrievedSnippet[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const hits: RetrievedSnippet[] = [];

  for (const s of substances) {
    const score = scoreText(tokens, [
      s.nameZh,
      s.nameEn,
      s.inn,
      s.cas,
      s.unii,
      s.summaryZh,
      ...s.aliases,
    ]);
    if (score > 0) {
      hits.push({
        kind: "substance",
        id: s.id,
        titleZh: s.nameZh,
        titleEn: s.nameEn,
        snippetZh: s.summaryZh,
        href: `/substances/${s.id}`,
        score,
        officialUrls: s.monographRefs.slice(0, 2).map((m) => ({
          label: m.pharmacopoeia,
          url: m.officialUrl,
        })),
      });
    }
  }

  for (const i of impurities) {
    const score = scoreText(tokens, [
      i.nameZh,
      i.nameEn,
      i.chemicalName,
      i.cas,
      i.type,
      i.summaryZh,
      ...i.ichTags,
      ...i.namingCrosswalk.map((n) => n.name),
    ]);
    if (score > 0) {
      hits.push({
        kind: "impurity",
        id: i.id,
        titleZh: i.nameZh,
        titleEn: i.nameEn,
        snippetZh: i.summaryZh,
        href: `/impurities/${i.id}`,
        score: score + (i.type === "nitrosamine" && tokens.some((t) => t.includes("亚硝") || t === "ndma") ? 2 : 0),
        officialUrls: [{ label: "ICH", url: "https://database.ich.org/" }],
      });
    }
  }

  for (const r of referenceMaterials) {
    const score = scoreText(tokens, [
      r.nameZh,
      r.nameEn,
      r.catalogCode,
      r.issuer,
      r.cas,
      r.notes,
    ]);
    if (score > 0) {
      hits.push({
        kind: "rs",
        id: r.id,
        titleZh: r.nameZh,
        titleEn: r.nameEn,
        snippetZh: `${r.issuer} · ${r.catalogCode}${r.cas ? ` · CAS ${r.cas}` : ""}`,
        href: `/reference-standards#${r.id}`,
        score,
        officialUrls: r.officialUrl
          ? [{ label: r.issuer, url: r.officialUrl }]
          : undefined,
      });
    }
  }

  for (const lim of ichLimits) {
    const score = scoreText(tokens, [
      lim.nameZh,
      lim.nameEn,
      lim.cas,
      lim.category,
      lim.classOrNote,
      lim.exampleValue,
      "限值",
      "限度",
      "ich",
    ]);
    if (score > 0) {
      hits.push({
        kind: "limit",
        id: lim.id,
        titleZh: lim.nameZh,
        titleEn: lim.nameEn,
        snippetZh: `${lim.category} 示例值 ${lim.exampleValue} ${lim.unit || ""} · ${lim.disclaimerZh}`,
        href: `/limits#${lim.id}`,
        score: score + 1,
        officialUrls: lim.officialUrls,
      });
    }
  }

  for (const e of changeEvents) {
    const score = scoreText(tokens, [
      e.titleZh,
      e.titleEn,
      e.summaryZh,
      e.pharmacopoeia,
    ]);
    if (score > 0) {
      hits.push({
        kind: "alert",
        id: e.id,
        titleZh: e.titleZh,
        titleEn: e.titleEn,
        snippetZh: e.summaryZh,
        href: `/alerts`,
        score,
        officialUrls: e.officialUrl
          ? [{ label: String(e.pharmacopoeia), url: e.officialUrl }]
          : undefined,
      });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}

export function formatAnswerZh(query: string, hits: RetrievedSnippet[]): string {
  if (hits.length === 0) {
    return `未在站内索引中找到与「${query}」高度相关的条目。可尝试 CAS、英文名、杂质类型（如 nitrosamine / NDMA）或药典代码。\n\n【仅基于站内索引与公开监管表，不替代药典正文】`;
  }
  const lines: string[] = [
    `根据站内索引，与「${query}」相关的条目如下（按相关度）：`,
    "",
  ];
  for (const h of hits) {
    lines.push(`• [${h.kind}] ${h.titleZh}${h.titleEn ? ` / ${h.titleEn}` : ""}`);
    lines.push(`  ${h.snippetZh}`);
    lines.push(`  站内：${h.href}`);
    if (h.officialUrls?.length) {
      lines.push(
        `  官方：${h.officialUrls.map((u) => `${u.label} ${u.url}`).join(" · ")}`
      );
    }
    lines.push("");
  }
  lines.push("【仅基于站内索引与公开监管表，不替代药典正文】");
  lines.push("限度与方法请核现行官方药典 / ICH / FDA / EMA 最新版。");
  return lines.join("\n");
}
