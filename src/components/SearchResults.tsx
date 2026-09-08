"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import type { SearchHit } from "@/lib/types";
import { DemoBadge } from "./DemoBadge";
import { OfficialQueryLinks } from "./OfficialQueryLinks";
import { SearchCardActions } from "./SearchCardActions";
import { CopyChip } from "./CopyChip";
import { buildHighlightTerms, highlightText } from "@/lib/highlightText";
import { EvidenceRow } from "./EvidenceRow";

function hrefFor(hit: SearchHit) {
  if (hit.kind === "substance") return `/substances/${hit.id}`;
  if (hit.kind === "impurity") return `/impurities/${hit.id}`;
  return `/reference-standards#${hit.id}`;
}

const kindLabel = {
  substance: "物质",
  impurity: "杂质",
  rs: "对照品",
} as const;

const kindOrder: Array<SearchHit["kind"]> = ["substance", "impurity", "rs"];

const impurityTypeLabel: Record<string, string> = {
  process: "工艺",
  degradation: "降解",
  nitrosamine: "亚硝胺",
  residual_solvent: "残留溶剂",
  elemental: "元素杂质",
  other: "其他",
};

const HERO_TIERS = new Set(["exact", "cas", "synonym"]);
const WEAK_TIERS = new Set(["fuzzy", "relaxed"]);
/** Keep this many weak hits expanded before folding */
const WEAK_PREVIEW = 3;

type Props = {
  hits: SearchHit[];
  /** 仅标题 */
  titleOnly?: boolean;
  /** 杂质紧凑表 */
  compact?: boolean;
  /** 原始查询串，用于高亮 */
  q?: string;
  /** 解析后的核心词 */
  core?: string;
  /** 解析后的 tokens */
  tokens?: string[];
  /** CAS（若查询解析出） */
  cas?: string;
  /** 由 Shell 置信门控决定是否展示 Hero */
  showHero?: boolean;
  /** 关注 id 集合（徽章） */
  watchIds?: Set<string>;
  selectedKey?: string | null;
  onSelectHit?: (hit: SearchHit) => void;
  clientBoostActive?: boolean;
};

function isWeak(hit: SearchHit) {
  return !!hit.matchTier && WEAK_TIERS.has(hit.matchTier);
}

function isHeroEligible(hit: SearchHit) {
  return !!hit.matchTier && HERO_TIERS.has(hit.matchTier);
}

function splitStrongWeak(list: SearchHit[]) {
  const strong: SearchHit[] = [];
  const weak: SearchHit[] = [];
  for (const h of list) {
    if (isWeak(h)) weak.push(h);
    else strong.push(h);
  }
  return { strong, weak };
}

function ResultCard({
  hit,
  titleOnly,
  terms,
  hero = false,
  watched = false,
  selected = false,
  onSelect,
}: {
  hit: SearchHit;
  titleOnly: boolean;
  terms: string[];
  hero?: boolean;
  watched?: boolean;
  selected?: boolean;
  onSelect?: (hit: SearchHit) => void;
}) {
  const hl = (t?: string) => highlightText(t, terms);

  return (
    <div
      className={
        hero
          ? "rounded-2xl border-2 border-teal-400 bg-gradient-to-br from-teal-50 via-white to-white shadow-md overflow-hidden density-card"
          : selected
            ? "rounded-xl border-2 border-teal-500 bg-white shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-teal-500/40 density-card"
            : "rounded-xl border border-slate-200 bg-white shadow-sm hover:border-teal-300 hover:shadow transition overflow-hidden focus-within:ring-2 focus-within:ring-teal-500/40 density-card"
      }
      data-hit-key={`${hit.kind}:${hit.id}`}
    >
      {hero ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-100 bg-teal-600/95 px-4 py-2 text-white">
          <span className="text-sm font-semibold tracking-wide">最佳匹配 · Best Match</span>
          {hit.matchReason ? (
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs">
              {hit.matchReason}
              {hit.matchTier ? ` · ${hit.matchTier}` : ""}
            </span>
          ) : null}
        </div>
      ) : null}

      <Link
        href={hrefFor(hit)}
        className="block p-4 no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-teal-600"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
            {kindLabel[hit.kind]}
          </span>
          <DemoBadge />
          {watched ? (
            <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-800">
              关注
            </span>
          ) : null}
          {hit.kind === "substance" && hit.substanceType && (
            <span className="rounded-md bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-latin">
              {hit.substanceType}
            </span>
          )}
          {hit.kind === "impurity" && hit.impurityType && (
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs text-amber-900">
              {impurityTypeLabel[hit.impurityType] || hit.impurityType}
            </span>
          )}
          {!hero && hit.matchReason ? (
            <span className="rounded-md bg-teal-50 px-2 py-0.5 text-xs text-teal-900">
              匹配：{hl(hit.matchReason)}
            </span>
          ) : null}
        </div>

        {!titleOnly ? <EvidenceRow evidence={hit.evidence} /> : null}

        {!titleOnly && onSelect ? (
          <button
            type="button"
            className="mt-1 text-[11px] text-teal-700 hover:underline print:hidden"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(hit);
            }}
          >
            在知识面板查看
          </button>
        ) : null}

        <h3
          className={
            hero
              ? "mt-3 text-2xl font-bold text-slate-900"
              : "mt-2 text-lg font-semibold text-slate-900"
          }
        >
          {hl(hit.titleZh)}{" "}
          <span className="text-base font-normal text-slate-500 font-latin">
            {hl(hit.titleEn)}
          </span>
        </h3>

        {!titleOnly && (hit.cas || hit.unii) && (
          <div
            className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600 font-latin"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {hit.cas ? (
              <span className="inline-flex items-center gap-1">
                <span className="text-slate-500">CAS</span>
                <span className="font-medium text-slate-800">{hit.cas}</span>
                <CopyChip value={hit.cas} label="CAS" />
              </span>
            ) : null}
            {hit.unii ? (
              <span className="inline-flex items-center gap-1">
                <span className="text-slate-500">UNII</span>
                <span className="font-medium text-slate-800">{hit.unii}</span>
                <CopyChip value={hit.unii} label="UNII" />
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <CopyChip value={hit.titleZh} label="中文名" />
            </span>
          </div>
        )}

        {!titleOnly &&
          hit.kind === "substance" &&
          hit.pharmacopoeias &&
          hit.pharmacopoeias.length > 0 && (
            <div
              className="mt-2 flex flex-wrap gap-1.5"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {hit.pharmacopoeias.map((p) => (
                <span
                  key={p}
                  className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-900 font-latin"
                >
                  {p}
                </span>
              ))}
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                杂质 {hit.impurityCount ?? 0}
              </span>
              {hit.hasRS && (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-800">
                  有对照品
                </span>
              )}
              {(hit.epTextNumber || hit.uspDoi || hit.unii) && (
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-900">
                  有文档直达
                </span>
              )}
            </div>
          )}

        {!titleOnly &&
          hit.kind === "substance" &&
          hit.impurityPreview &&
          hit.impurityPreview.length > 0 && (
            <p className="mt-1.5 text-xs text-slate-600">
              杂质预览：
              <span className="text-slate-800">
                {hit.impurityPreview.join("、")}
                {(hit.impurityCount || 0) > hit.impurityPreview.length ? "…" : ""}
              </span>
            </p>
          )}

        {!titleOnly && hit.kind === "impurity" && (
          <div
            className="mt-2 flex flex-wrap gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {hit.parentNames && hit.parentNames.length > 0 && (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700">
                父物质：{hit.parentNames.slice(0, 3).join("、")}
                {hit.parentNames.length > 3 ? "…" : ""}
              </span>
            )}
            {(hit.ichTags || []).slice(0, 4).map((t) => (
              <span
                key={t}
                className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] text-violet-900 font-latin"
              >
                {t}
              </span>
            ))}
            {hit.hasRS && (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-800">
                有对照品
              </span>
            )}
          </div>
        )}

        {!titleOnly && hit.summary && (
          <p className="mt-1.5 text-sm text-slate-600 line-clamp-2">{hit.summary}</p>
        )}

        {!titleOnly && !hit.summary && hit.subtitle && (
          <p className="mt-1 text-sm text-slate-500 font-latin">{hit.subtitle}</p>
        )}
      </Link>

      {!titleOnly && hit.kind === "substance" && (
        <div
          className={`border-t px-4 py-2.5 space-y-2 ${hero ? "border-teal-100 bg-teal-50/40" : "border-slate-100 bg-slate-50/60"}`}
          onClick={(e) => e.stopPropagation()}
        >
          {hero ? (
            <>
              <Link
                href={hrefFor(hit)}
                className="inline-flex rounded-lg border border-teal-600 bg-teal-600 px-2.5 py-1 text-xs font-medium text-white no-underline hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              >
                打开详情
              </Link>
              {hit.kind === "substance" ? (
                <Link
                  href={`/substances/${encodeURIComponent(hit.id)}/compendial`}
                  className="inline-flex rounded-lg border border-sky-600 bg-white px-2.5 py-1 text-xs font-medium text-sky-900 no-underline hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                >
                  详细对照
                </Link>
              ) : null}
            </>
          ) : null}
          <SearchCardActions
            substanceId={hit.id}
            nameZh={hit.titleZh}
            cas={hit.cas}
          />
          <OfficialQueryLinks
            compact
            nameZh={hit.titleZh}
            nameEn={hit.titleEn}
            inn={hit.inn}
            cas={hit.cas}
            unii={hit.unii}
            epTextNumber={hit.epTextNumber}
            uspDoi={hit.uspDoi}
            phIntDocPath={hit.phIntDocPath}
          />
        </div>
      )}

      {!titleOnly && hero && hit.kind !== "substance" && (
        <div className="border-t border-teal-100 bg-teal-50/40 px-4 py-2.5 flex flex-wrap gap-2">
          <Link
            href={hrefFor(hit)}
            className="rounded-lg border border-teal-600 bg-teal-600 px-2.5 py-1 text-xs font-medium text-white no-underline hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          >
            打开详情
          </Link>
          {hit.cas ? <CopyChip value={hit.cas} label="CAS" /> : null}
          <CopyChip value={hit.titleZh} label="中文名" />
        </div>
      )}
    </div>
  );
}

function WeakFold({
  hits,
  titleOnly,
  terms,
  watchIds,
  selectedKey,
  onSelectHit,
}: {
  hits: SearchHit[];
  titleOnly: boolean;
  terms: string[];
  watchIds?: Set<string>;
  selectedKey?: string | null;
  onSelectHit?: (hit: SearchHit) => void;
}) {
  const [open, setOpen] = useState(false);
  if (hits.length === 0) return null;
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 rounded-xl"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          更多相关结果
          <span className="ml-2 font-normal text-slate-500">（{hits.length}）</span>
        </span>
        <span className="text-xs text-slate-500 font-latin">{open ? "收起" : "展开"}</span>
      </button>
      {open ? (
        <ul className="space-y-3 border-t border-slate-200 px-3 pb-3 pt-3">
          {hits.map((hit) => (
            <li key={`weak-${hit.kind}-${hit.id}`}>
              <ResultCard
                hit={hit}
                titleOnly={titleOnly}
                terms={terms}
                watched={!!watchIds?.has(hit.id)}
                selected={selectedKey === `${hit.kind}:${hit.id}`}
                onSelect={onSelectHit}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function KindSection({
  kind,
  hits,
  titleOnly,
  terms,
  skipIds,
  watchIds,
  selectedKey,
  onSelectHit,
}: {
  kind: SearchHit["kind"];
  hits: SearchHit[];
  titleOnly: boolean;
  terms: string[];
  skipIds: Set<string>;
  watchIds?: Set<string>;
  selectedKey?: string | null;
  onSelectHit?: (hit: SearchHit) => void;
}) {
  if (hits.length === 0) return null;
  const filtered = hits.filter((h) => !skipIds.has(`${h.kind}:${h.id}`));

  const { strong, weak } = splitStrongWeak(filtered);
  const weakHead = weak.slice(0, WEAK_PREVIEW);
  const weakTail = weak.slice(WEAK_PREVIEW);
  const listed = [...strong, ...weakHead];

  return (
    <section id={`results-${kind}`} className="scroll-mt-24 space-y-3">
      <div className="flex items-baseline justify-between gap-2 border-b border-slate-200 pb-1.5">
        <h2 className="text-base font-semibold text-slate-800">
          {kindLabel[kind]}
          <span className="ml-2 text-sm font-normal text-slate-500">
            ({hits.length})
          </span>
        </h2>
        <a
          href={`#results-${kind}`}
          className="text-[11px] text-slate-400 no-underline hover:text-teal-700"
        >
          #
        </a>
      </div>
      {filtered.length === 0 ? (
        <p className="text-xs text-slate-500">见上方「最佳匹配」。</p>
      ) : (
        <>
          <ul className="space-y-3">
            {listed.map((hit) => (
              <li key={`${hit.kind}-${hit.id}`}>
                <ResultCard
                  hit={hit}
                  titleOnly={titleOnly}
                  terms={terms}
                  watched={!!watchIds?.has(hit.id)}
                  selected={selectedKey === `${hit.kind}:${hit.id}`}
                  onSelect={onSelectHit}
                />
              </li>
            ))}
          </ul>
          <WeakFold
            hits={weakTail}
            titleOnly={titleOnly}
            terms={terms}
            watchIds={watchIds}
            selectedKey={selectedKey}
            onSelectHit={onSelectHit}
          />
        </>
      )}
    </section>
  );
}

export function SearchResults({
  hits,
  titleOnly = false,
  compact = false,
  q = "",
  core = "",
  tokens = [],
  cas = "",
  showHero: showHeroProp,
  watchIds,
  selectedKey = null,
  onSelectHit,
}: Props) {
  const terms = useMemo(
    () => buildHighlightTerms({ q, core, tokens, cas }),
    [q, core, tokens, cas]
  );

  if (hits.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-500">
        未找到站内匹配结果。可尝试「对乙酰氨基酚」「二甲双胍」「NDMA」或 CAS 号；或查看下方「站外可查」。
      </div>
    );
  }

  const byKind: Record<SearchHit["kind"], SearchHit[]> = {
    substance: [],
    impurity: [],
    rs: [],
  };
  for (const h of hits) {
    byKind[h.kind].push(h);
  }

  const top = hits[0];
  // Shell passes confidence-gated showHero; fallback to legacy tier check
  const showHero =
    typeof showHeroProp === "boolean"
      ? showHeroProp && !!top
      : !!(top && isHeroEligible(top));
  const skipIds = new Set<string>();
  if (showHero && top) {
    skipIds.add(`${top.kind}:${top.id}`);
  }

  const impurityHits = byKind.impurity;
  const showCompactTable = compact && impurityHits.length > 0;

  const anchorNav = (
    <nav
      aria-label="结果分组"
      className="flex flex-wrap gap-2 text-sm"
    >
      {kindOrder.map((k) =>
        byKind[k].length > 0 ? (
          <a
            key={k}
            href={`#results-${k}`}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700 no-underline hover:border-teal-400 hover:bg-teal-50 hover:text-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          >
            {kindLabel[k]}
            <span className="ml-1 text-slate-400">({byKind[k].length})</span>
          </a>
        ) : null
      )}
    </nav>
  );

  return (
    <div className="space-y-5">
      {anchorNav}

      {showHero && top ? (
        <ResultCard
          hit={top}
          titleOnly={titleOnly}
          terms={terms}
          hero
          watched={!!watchIds?.has(top.id)}
          selected={selectedKey === `${top.kind}:${top.id}`}
          onSelect={onSelectHit}
        />
      ) : null}

      {showCompactTable ? (
        <div id="results-impurity" className="scroll-mt-24 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 px-3 py-2">
            <h2 className="text-sm font-semibold text-slate-800">
              杂质
              <span className="ml-2 font-normal text-slate-500">
                ({impurityHits.length}) · 紧凑表
              </span>
            </h2>
          </div>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-600">
              <tr>
                <th className="px-3 py-2 font-medium">杂质</th>
                <th className="px-3 py-2 font-medium">英文</th>
                <th className="px-3 py-2 font-medium">类型</th>
                <th className="px-3 py-2 font-medium font-latin">CAS</th>
                <th className="px-3 py-2 font-medium">匹配</th>
              </tr>
            </thead>
            <tbody>
              {impurityHits.map((hit) => (
                <tr
                  key={`imp-row-${hit.id}`}
                  className="border-t border-slate-100 hover:bg-teal-50/40"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={hrefFor(hit)}
                      className="font-medium text-teal-900 no-underline hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                    >
                      {highlightText(hit.titleZh, terms) as ReactNode}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-latin text-slate-600">
                    {highlightText(hit.titleEn, terms) as ReactNode}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {hit.impurityType
                      ? impurityTypeLabel[hit.impurityType] || hit.impurityType
                      : "—"}
                  </td>
                  <td className="px-3 py-2 font-latin text-slate-500">
                    {hit.cas || "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {hit.matchReason
                      ? (<>匹配：{highlightText(hit.matchReason, terms)}</>)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-500">
            杂质紧凑表 · 示例数据 · 非药典全文
          </p>
        </div>
      ) : null}

      {kindOrder.map((k) => {
        if (showCompactTable && k === "impurity") return null;
        return (
          <KindSection
            key={k}
            kind={k}
            hits={byKind[k]}
            titleOnly={titleOnly}
            terms={terms}
            skipIds={skipIds}
            watchIds={watchIds}
            selectedKey={selectedKey}
            onSelectHit={onSelectHit}
          />
        );
      })}
    </div>
  );
}
