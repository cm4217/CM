"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { SearchHit } from "@/lib/types";
import { SearchResults } from "./SearchResults";
import { SearchKnowledgePanel } from "./SearchKnowledgePanel";
import { SearchIntentTabs, filterHitsByTab } from "./SearchIntentTabs";
import { SearchMiniCompare } from "./SearchMiniCompare";
import { SearchRelatedStrip } from "./SearchRelatedStrip";
import { SearchDensityControl } from "./SearchDensityControl";
import { decideHero } from "@/lib/search/confidence";
import {
  isClientBoostEnabled,
  loadBoostIdSets,
  preferStableBoost,
} from "@/lib/clientBoost";
import { effectiveSearchTab } from "@/lib/searchTabSync";

type Props = {
  hits: SearchHit[];
  titleOnly?: boolean;
  compact?: boolean;
  q?: string;
  core?: string;
  tokens?: string[];
  cas?: string;
  fewLocal?: boolean;
};

const TAB_LABEL: Record<string, string> = {
  substance: "原料药",
  drug: "成药",
  impurity: "杂质",
  rs: "对照品",
  external: "站外",
};

export function SearchResultsShell({
  hits: ssrHits,
  titleOnly = false,
  compact = false,
  q = "",
  core = "",
  tokens = [],
  cas = "",
  fewLocal = false,
}: Props) {
  const sp = useSearchParams();
  const type = sp.get("type");
  const rawTab = sp.get("tab");
  const tab = effectiveSearchTab(type, rawTab);
  const [boosted, setBoosted] = useState(ssrHits);
  const [watchIds, setWatchIds] = useState<Set<string>>(new Set());
  const [boostOn, setBoostOn] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    const on = isClientBoostEnabled();
    setBoostOn(on);
    const { watchIds: w, recentIds } = loadBoostIdSets();
    setWatchIds(w);
    if (on) {
      setBoosted(preferStableBoost(ssrHits, w, recentIds));
    } else {
      setBoosted(ssrHits);
    }
  }, [ssrHits]);

  const tabbed = useMemo(
    () => filterHitsByTab(boosted, rawTab, type),
    [boosted, rawTab, type]
  );

  const heroDecision = useMemo(() => decideHero(tabbed), [tabbed]);

  const selected = useMemo(() => {
    if (selectedKey) {
      const found = tabbed.find((h) => `${h.kind}:${h.id}` === selectedKey);
      if (found) return found;
    }
    const sub = tabbed.find((h) => h.kind === "substance");
    return sub || tabbed[0] || null;
  }, [tabbed, selectedKey]);

  const showExternalOnly = tab === "external";
  const tabEmpty =
    !showExternalOnly &&
    tab !== "all" &&
    tabbed.length === 0 &&
    boosted.length > 0;
  const serverEmpty = boosted.length === 0;

  const clearTabHref = () => {
    const p = new URLSearchParams(sp.toString());
    p.delete("tab");
    if (type && ["drug", "product", "API", "api", "excipient", "impurity", "rs"].includes(type)) {
      p.delete("type");
    }
    const s = p.toString();
    return s ? `/search?${s}` : "/search";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchIntentTabs hits={boosted} fewLocal={fewLocal} />
        <SearchDensityControl />
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {showExternalOnly
          ? "站外助手视图"
          : `共 ${tabbed.length} 条结果${q ? `，关键词 ${q}` : ""}`}
      </p>

      {tabEmpty ? (
        <div
          role="status"
          className="rounded-xl border border-dashed border-amber-300 bg-amber-50/70 px-6 py-10 text-center text-sm text-amber-950"
        >
          <p className="font-medium">
            当前「{TAB_LABEL[tab] || tab}」分类下无命中
          </p>
          <p className="mt-2 text-amber-900/80">
            本次检索共有 {boosted.length} 条站内结果，但不在本分类中。可切换到「全部」或其他意图页签查看。
          </p>
          <p className="mt-3">
            <Link
              href={clearTabHref()}
              className="text-teal-800 underline hover:text-teal-950"
            >
              查看全部结果 →
            </Link>
          </p>
        </div>
      ) : null}

      {!showExternalOnly && !tabEmpty && heroDecision.reason === "ambiguous" && tabbed.length > 1 ? (
        <div
          role="status"
          className="rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-50 to-orange-50/60 px-4 py-3 text-sm text-amber-950 shadow-sm"
        >
          <strong className="font-semibold">多条接近，请选择</strong>
          <span className="ml-2 text-amber-900/80">
            未展示「最佳匹配」主卡（分差 {heroDecision.margin.toFixed(0)}
            ，未达阈值）。可使用下方快比或点击卡片查看知识面板。
          </span>
        </div>
      ) : null}

      {!showExternalOnly && !tabEmpty ? (
        <SearchMiniCompare
          hits={tabbed}
          force={heroDecision.reason === "ambiguous"}
        />
      ) : null}

      <SearchRelatedStrip focus={selected} hits={boosted} query={q} />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-6 lg:items-start">
        <div className="min-w-0 space-y-4">
          {showExternalOnly ? (
            <div className="ph-empty">
              站外助手见页面下方「站外可查」卡片。本页不托管药典全文。
            </div>
          ) : tabEmpty ? null : (
            <SearchResults
              hits={tabbed}
              titleOnly={titleOnly}
              compact={compact}
              q={q}
              core={core}
              tokens={tokens}
              cas={cas}
              showHero={heroDecision.showHero}
              watchIds={watchIds}
              selectedKey={selected ? `${selected.kind}:${selected.id}` : null}
              onSelectHit={(h) => setSelectedKey(`${h.kind}:${h.id}`)}
              clientBoostActive={boostOn}
            />
          )}
          {serverEmpty && !showExternalOnly ? (
            <p className="text-xs text-slate-400 text-center">
              服务端索引 0 命中（非页签过滤）。可尝试同义词、CAS/UNII 或站外助手。
            </p>
          ) : null}
        </div>
        <div className="mt-4 space-y-3 lg:mt-0">
          <SearchKnowledgePanel hit={selected} />
          {boostOn ? (
            <p className="hidden text-[11px] text-slate-400 lg:block print:hidden">
              已启用关注/最近轻量提升（工作台可关）
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
