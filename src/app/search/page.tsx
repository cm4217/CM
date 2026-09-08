import { Suspense } from "react";
import { SearchFilters } from "@/components/SearchFilters";
import { SearchResultsShell } from "@/components/SearchResultsShell";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { OfficialQueryLinks } from "@/components/OfficialQueryLinks";
import { DidYouMean } from "@/components/DidYouMean";
import { ExternalSearchCards } from "@/components/ExternalSearchCards";
import { SearchRelaxChips } from "@/components/SearchRelaxChips";
import { SearchFacetBar } from "@/components/SearchFacetBar";
import { NameNormalizePanel } from "@/components/NameNormalizePanel";
import { SearchLogBeacon } from "@/components/SearchLogBeacon";
import { SearchBackendChip } from "@/components/SearchBackendChip";
import { searchWithMetaAsync } from "@/lib/search";
import type { ImpurityType, PharmacopoeiaCode } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "检索",
};

type Props = {
  searchParams: {
    q?: string;
    pharmacopoeia?: string;
    type?: string;
    hasRS?: string;
    hasCAS?: string;
    hasDeepLink?: string;
    impurityType?: string;
    parentId?: string;
    dosageForm?: string;
    molecularFormula?: string;
    pharmaVersion?: string;
    efficacy?: string;
    relax?: string;
    strict?: string;
    titleOnly?: string;
    view?: string;
    tab?: string;
    indexSource?: string;
  };
};

const FEW_HITS = 3;

export default async function SearchPage({ searchParams }: Props) {
  const rxnormExtras: string[] = [];
  const result = await searchWithMetaAsync({
    q: searchParams.q,
    pharmacopoeia: (searchParams.pharmacopoeia || "") as PharmacopoeiaCode | "",
    type: searchParams.type || "",
    hasRS: (searchParams.hasRS || "") as "yes" | "no" | "",
    hasCAS: (searchParams.hasCAS || "") as "yes" | "no" | "",
    hasDeepLink: (searchParams.hasDeepLink || "") as "yes" | "no" | "",
    impurityType: (searchParams.impurityType || "") as ImpurityType | "",
    parentId: searchParams.parentId || "",
    dosageForm: searchParams.dosageForm || "",
    molecularFormula: searchParams.molecularFormula || "",
    pharmaVersion: searchParams.pharmaVersion || "",
    efficacy: searchParams.efficacy || "",
    relax: searchParams.relax,
    strict: (searchParams.strict || "") as "1" | "",
    titleOnly: (searchParams.titleOnly || "") as "1" | "",
    indexSource: (searchParams.indexSource || "") as
      | "curated"
      | "open"
      | "user"
      | "draft"
      | "all"
      | "",
  }, { rxnormExtras });

  const hits = result.hits;
  const q = (searchParams.q || "").trim();
  const fewLocal = !!q && hits.length < FEW_HITS;
  const titleOnly = searchParams.titleOnly === "1";
  const compact = searchParams.view === "compact";
  const nSub = hits.filter((h) => h.kind === "substance").length;
  const nImp = hits.filter((h) => h.kind === "impurity").length;
  const nRs = hits.filter((h) => h.kind === "rs").length;
  const topHit = hits[0];
  const topLabel = topHit
    ? `${topHit.titleZh}${topHit.matchReason ? `（${topHit.matchReason}）` : ""}`
    : "无";

  return (
    <div className="space-y-6 search-page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">检索结果</h1>
          <p className="mt-1 text-sm text-slate-500 font-latin">
            Search · evidence · knowledge panel · intent tabs · mini-compare
          </p>
        </div>
        <SearchBackendChip />
      </div>

      <DisclaimerBanner compact />

      <Suspense fallback={<div className="text-sm text-slate-500">加载筛选…</div>}>
        <SearchFilters />
      </Suspense>

      <div className="space-y-2">
        <p className="text-sm text-slate-600" aria-live="polite">
          共 <span className="font-semibold text-teal-800">{hits.length}</span> 条结果
          {q ? (
            <>
              {" "}
              · 关键词「<span className="font-medium">{q}</span>」
              {result.parsed.core && result.parsed.core !== q ? (
                <>
                  {" "}
                  · 核心词「
                  <span className="font-medium font-latin">{result.parsed.core}</span>」
                </>
              ) : null}
              {result.parsed.cas ? (
                <>
                  {" "}
                  · CAS{" "}
                  <span className="font-latin">
                    {result.parsed.cas}
                    {result.parsed.casValid === false ? "（校验失败）" : ""}
                  </span>
                </>
              ) : null}
            </>
          ) : null}
        </p>
        {hits.length > 0 ? (
          <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
            物质 {nSub} · 杂质 {nImp} · 对照品 {nRs} · 后端 {result.backend} · 主命中：
            <span className="font-medium text-slate-900">{topLabel}</span>
            {typeof topHit?.rankScore === "number" ? (
              <span className="ml-2 text-xs text-slate-400 font-latin">
                score {topHit.rankScore.toFixed(0)}
              </span>
            ) : null}
          </p>
        ) : null}
      </div>

      {q ? <SearchLogBeacon q={q} hitCount={hits.length} /> : null}

      {q ? (
        <Suspense fallback={null}>
          <NameNormalizePanel q={q} force={fewLocal} />
        </Suspense>
      ) : null}

      {result.appliedRelax.length > 0 ? (
        <Suspense fallback={null}>
          <SearchRelaxChips applied={result.appliedRelax} />
        </Suspense>
      ) : null}

      {hits.length > 0 ||
      result.facets.dosageForm.length > 0 ||
      result.facets.parentDrug.length > 0 ? (
        <Suspense fallback={null}>
          <SearchFacetBar facets={result.facets} />
        </Suspense>
      ) : null}

      {fewLocal ? <DidYouMean q={q} enabled /> : null}

      {q ? (
        <div className="rounded-xl border border-teal-200 bg-teal-50/50 px-4 py-3 print:hidden">
          <OfficialQueryLinks
            title="用当前关键词直接查官网"
            nameZh={q}
            nameEn={q}
            inn={q}
          />
        </div>
      ) : null}

      <Suspense fallback={<div className="text-sm text-slate-500">加载结果…</div>}>
        <SearchResultsShell
          hits={hits}
          titleOnly={titleOnly}
          compact={compact}
          q={q}
          core={result.parsed.core}
          tokens={result.parsed.tokens}
          cas={result.parsed.cas || ""}
          fewLocal={fewLocal}
        />
      </Suspense>

      <div id="external-helpers">
        <ExternalSearchCards q={q} show={fewLocal || searchParams.tab === "external"} />
      </div>
    </div>
  );
}
