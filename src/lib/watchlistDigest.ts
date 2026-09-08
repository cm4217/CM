import { substances, impurities, mergedChangeEvents } from "@/data";
import type { ChangeEvent } from "@/lib/types";
import type { WatchlistItem } from "@/lib/watchlistStorage";
import { expandQueryWithSynonyms } from "@/lib/synonyms";

export type DigestScope = "week" | "all";

function startOfWeekUtc(d = new Date()): Date {
  const day = d.getUTCDay();
  const diff = (day + 6) % 7; // Monday start
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - diff);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function eventMatchesKeywords(e: ChangeEvent, terms: string[]): boolean {
  const blob = [
    e.titleZh,
    e.titleEn,
    e.summaryZh,
    e.summaryEn,
    ...(e.relatedSubstanceIds || []),
    ...(e.relatedImpurityIds || []),
  ]
    .join(" ")
    .toLowerCase();
  return terms.some((t) => t && blob.includes(t.toLowerCase()));
}

function termsForItem(it: WatchlistItem): string[] {
  const base = expandQueryWithSynonyms(it.query);
  const r = it.resolved;
  if (r.status === "matched") {
    base.push(r.nameZh, r.nameEn, r.cas || "", r.id);
    if (r.kind === "substance") {
      const s = substances.find((x) => x.id === r.id);
      if (s) {
        base.push(...s.aliases, s.inn || "");
        base.push(...s.relatedImpurityIds);
      }
    }
  } else if (r.status === "external") {
    base.push(r.nameHint, r.cas || "");
  }
  return Array.from(new Set(base.map((x) => x.trim()).filter(Boolean)));
}

function coverageLine(it: WatchlistItem): string {
  const r = it.resolved;
  if (r.status === "matched") {
    if (r.kind === "substance") {
      const s = substances.find((x) => x.id === r.id);
      if (!s) return r.coverage;
      const ph = Array.from(new Set(s.monographRefs.map((m) => m.pharmacopoeia)));
      return `${r.nameZh}（${r.nameEn}）：${ph.join("/")} · 专论 ${s.monographRefs.length} · 杂质 ${s.relatedImpurityIds.length} · RS ${s.relatedRSIds.length}`;
    }
    const i = impurities.find((x) => x.id === r.id);
    return `${r.nameZh}：杂质 · ${i?.type || "—"} · 父物质 ${(i?.parentSubstanceIds || []).length}`;
  }
  if (r.status === "external") return `${it.query}：未收录-仅外链`;
  return `${it.query}：未解析`;
}

/**
 * 生成关注摘要 Markdown / 纯文本（中文）。
 * scope=week：若事件有日期则过滤近 7 天（周一起算周内亦可）；无日期命中则回退全部。
 */
export function buildWatchlistDigest(
  items: WatchlistItem[],
  scope: DigestScope = "all"
): { markdown: string; plain: string; matchedEvents: number; usedScope: DigestScope } {
  const now = new Date();
  const weekStart = startOfWeekUtc(now);
  const allEvents = mergedChangeEvents();

  let events = allEvents;
  let usedScope: DigestScope = scope;
  if (scope === "week") {
    const filtered = allEvents.filter((e) => {
      if (!e.date) return false;
      const d = new Date(e.date + (e.date.length <= 10 ? "T00:00:00Z" : ""));
      return !Number.isNaN(d.getTime()) && d >= weekStart;
    });
    if (filtered.length > 0) {
      events = filtered;
    } else {
      usedScope = "all";
      events = allEvents;
    }
  }

  const lines: string[] = [];
  const stamp = now.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
  lines.push(`# 药典对照层 · 关注摘要`);
  lines.push(``);
  lines.push(`> 生成时间：${stamp}（UTC+8）`);
  lines.push(
    `> 范围：${usedScope === "week" ? "本周通告（按事件日期）" : "全部关注 × 当前通告库"}`
  );
  if (scope === "week" && usedScope === "all") {
    lines.push(`> 说明：本周无带日期的匹配通告，已回退为全部通告库。`);
  }
  lines.push(`> 本摘要为示例/索引级，不替代法定药典全文。`);
  lines.push(``);

  lines.push(`## 1. 关注覆盖摘要`);
  lines.push(``);
  if (!items.length) {
    lines.push(`- （暂无关注项）`);
  } else {
    for (const it of items) {
      lines.push(`- ${coverageLine(it)}`);
    }
  }
  lines.push(``);

  lines.push(`## 2. 关注项 × 通告匹配`);
  lines.push(``);

  let matchedEvents = 0;
  const seenEventIds = new Set<string>();

  for (const it of items) {
    const terms = termsForItem(it);
    const hits = events.filter((e) => {
      // id overlap
      const r = it.resolved;
      if (r.status === "matched") {
        if (r.kind === "substance" && e.relatedSubstanceIds?.includes(r.id)) return true;
        if (r.kind === "impurity" && e.relatedImpurityIds?.includes(r.id)) return true;
        if (r.kind === "substance") {
          const s = substances.find((x) => x.id === r.id);
          if (s && e.relatedImpurityIds?.some((id) => s.relatedImpurityIds.includes(id)))
            return true;
        }
      }
      return eventMatchesKeywords(e, terms);
    });

    lines.push(`### ${it.query}`);
    if (!hits.length) {
      lines.push(`- 暂无匹配通告`);
    } else {
      for (const e of hits) {
        matchedEvents++;
        seenEventIds.add(e.id);
        const sev =
          e.severity === "critical" ? "重要" : e.severity === "watch" ? "关注" : "信息";
        lines.push(
          `- **[${sev}]** ${e.date} · ${e.pharmacopoeia} · ${e.titleZh}`
        );
        lines.push(`  - ${e.summaryZh}`);
        if (e.officialUrl) {
          lines.push(`  - 官网：${e.officialUrl}`);
        }
      }
    }
    lines.push(``);
  }

  lines.push(`## 3. 官网查询提醒`);
  lines.push(``);
  lines.push(
    `- 中国药典查询：https://ydz.chp.org.cn/`
  );
  lines.push(`- USP–NF：https://www.uspnf.com/`);
  lines.push(`- Ph. Eur.：https://pheur-online.edqm.eu/`);
  lines.push(`- BP：https://www.pharmacopoeia.com/`);
  lines.push(`- ICH 数据库：https://database.ich.org/`);
  lines.push(
    `- 请在本站「官网查询」芯片复制药名后到上述门户检索；本站不提供专论全文。`
  );
  lines.push(``);
  lines.push(`---`);
  lines.push(
    `统计：关注 ${items.length} 项 · 匹配通告条目 ${matchedEvents} 次（去重 ${seenEventIds.size}）· 通告库 ${events.length}`
  );
  lines.push(``);

  const markdown = lines.join("\n");
  const plain = markdown
    .replace(/^#+ /gm, "")
    .replace(/\*\*/g, "")
    .replace(/^> /gm, "");

  return { markdown, plain, matchedEvents, usedScope };
}
