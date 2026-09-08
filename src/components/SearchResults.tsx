"use client";

import Link from "next/link";
import type { SearchHit } from "@/lib/types";
import { DemoBadge } from "./DemoBadge";
import { OfficialQueryLinks } from "./OfficialQueryLinks";
import { SearchCardActions } from "./SearchCardActions";

function hrefFor(hit: SearchHit) {
  if (hit.kind === "substance") return `/substances/${hit.id}`;
  if (hit.kind === "impurity") return `/impurities/${hit.id}`;
  return `/reference-standards#${hit.id}`;
}

const kindLabel = {
  substance: "物质",
  impurity: "杂质",
  rs: "对照品",
};

const impurityTypeLabel: Record<string, string> = {
  process: "工艺",
  degradation: "降解",
  nitrosamine: "亚硝胺",
  residual_solvent: "残留溶剂",
  elemental: "元素杂质",
  other: "其他",
};

type Props = {
  hits: SearchHit[];
  /** 仅标题 */
  titleOnly?: boolean;
  /** 杂质紧凑表 */
  compact?: boolean;
};

export function SearchResults({ hits, titleOnly = false, compact = false }: Props) {
  if (hits.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-500">
        未找到站内匹配结果。可尝试「对乙酰氨基酚」「二甲双胍」「NDMA」或 CAS 号；或查看下方「站外可查」。
      </div>
    );
  }

  const impurityHits = hits.filter((h) => h.kind === "impurity");
  const otherHits = hits.filter((h) => h.kind !== "impurity");
  const showCompactTable = compact && impurityHits.length > 0;

  return (
    <div className="space-y-4">
      {showCompactTable ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
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
                <tr key={`imp-row-${hit.id}`} className="border-t border-slate-100 hover:bg-teal-50/40">
                  <td className="px-3 py-2">
                    <Link href={hrefFor(hit)} className="font-medium text-teal-900 no-underline hover:underline">
                      {hit.titleZh}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-latin text-slate-600">{hit.titleEn}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {hit.impurityType
                      ? impurityTypeLabel[hit.impurityType] || hit.impurityType
                      : "—"}
                  </td>
                  <td className="px-3 py-2 font-latin text-slate-500">{hit.cas || "—"}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {hit.matchReason ? `匹配：${hit.matchReason}` : "—"}
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

      <ul className="space-y-3">
        {(showCompactTable ? otherHits : hits).map((hit) => (
          <li key={`${hit.kind}-${hit.id}`}>
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm hover:border-teal-300 hover:shadow transition overflow-hidden">
              <Link href={hrefFor(hit)} className="block p-4 no-underline">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {kindLabel[hit.kind]}
                  </span>
                  <DemoBadge />
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
                  {hit.matchReason ? (
                    <span className="rounded-md bg-teal-50 px-2 py-0.5 text-xs text-teal-900">
                      匹配：{hit.matchReason}
                    </span>
                  ) : null}
                </div>

                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  {hit.titleZh}{" "}
                  <span className="text-base font-normal text-slate-500 font-latin">
                    {hit.titleEn}
                  </span>
                </h3>

                {!titleOnly && hit.kind === "substance" &&
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
                        {(hit.impurityCount || 0) > hit.impurityPreview.length
                          ? "…"
                          : ""}
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

                {!titleOnly && (hit.cas || hit.unii) && (
                  <p className="mt-1.5 text-xs text-slate-500 font-latin">
                    {hit.cas ? `CAS ${hit.cas}` : ""}
                    {hit.cas && hit.unii ? " · " : ""}
                    {hit.unii ? `UNII ${hit.unii}` : ""}
                  </p>
                )}

                {!titleOnly && hit.summary && (
                  <p className="mt-1.5 text-sm text-slate-600 line-clamp-2">
                    {hit.summary}
                  </p>
                )}

                {!titleOnly && !hit.summary && hit.subtitle && (
                  <p className="mt-1 text-sm text-slate-500 font-latin">
                    {hit.subtitle}
                  </p>
                )}
              </Link>

              {!titleOnly && hit.kind === "substance" && (
                <div
                  className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 space-y-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <SearchCardActions substanceId={hit.id} />
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
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
