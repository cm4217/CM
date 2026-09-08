"use client";

import { useEffect, useMemo, useState } from "react";
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
  const tab = sp.get("tab");
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
    () => filterHitsByTab(boosted, tab),
    [boosted, tab]
  );

  const heroDecision = useMemo(() => decideHero(tabbed), [tabbed]);

  const selected = useMemo(() => {
    if (selectedKey) {
      const found = tabbed.find((h) => `${h.kind}:${h.id}` === selectedKey);
      if (found) return found;
    }
    // Prefer best match / first substance for knowledge panel
    const sub = tabbed.find((h) => h.kind === "substance");
    return sub || tabbed[0] || null;
  }, [tabbed, selectedKey]);

  // external tab: still show shell chrome but empty results hint via SearchResults
  const showExternalOnly = tab === "external";

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

      {!showExternalOnly && heroDecision.reason === "ambiguous" && tabbed.length > 1 ? (
        <div
          role="status"
          className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          <strong className="font-semibold">多条接近，请选择</strong>
          <span className="ml-2 text-amber-900/80">
            未展示「最佳匹配」主卡（分差 {heroDecision.margin.toFixed(0)}
            ，未达阈值）。可使用下方快比或点击卡片查看知识面板。
          </span>
        </div>
      ) : null}

      {!showExternalOnly ? (
        <SearchMiniCompare
          hits={tabbed}
          force={heroDecision.reason === "ambiguous"}
        />
      ) : null}

      <SearchRelatedStrip focus={selected} hits={boosted} query={q} />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-6 lg:items-start">
        <div className="min-w-0 space-y-4">
          {showExternalOnly ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
              站外助手见页面下方「站外可查」卡片。本页不托管药典全文。
            </div>
          ) : (
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
