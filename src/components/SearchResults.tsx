"use client";

import Link from "next/link";
import type { SearchHit } from "@/lib/types";
import { DemoBadge } from "./DemoBadge";
import { OfficialQueryLinks } from "./OfficialQueryLinks";

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

export function SearchResults({ hits }: { hits: SearchHit[] }) {
  if (hits.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-500">
        未找到匹配结果。可尝试「对乙酰氨基酚」「二甲双胍」「NDMA」或 CAS 号。
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {hits.map((hit) => (
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
                  <span
                    className="rounded-md bg-amber-50 px-2 py-0.5 text-xs text-amber-900"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {impurityTypeLabel[hit.impurityType] || hit.impurityType}
                  </span>
                )}
              </div>

              <h3 className="mt-2 text-lg font-semibold text-slate-900">
                {hit.titleZh}{" "}
                <span className="text-base font-normal text-slate-500 font-latin">
                  {hit.titleEn}
                </span>
              </h3>

              {/* Pharmacopoeia coverage chips (substance) */}
              {hit.kind === "substance" &&
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
                  </div>
                )}

              {/* Impurity: parents + ICH */}
              {hit.kind === "impurity" && (
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

              {/* CAS / UNII */}
              {(hit.cas || hit.unii) && (
                <p className="mt-1.5 text-xs text-slate-500 font-latin">
                  {hit.cas ? `CAS ${hit.cas}` : ""}
                  {hit.cas && hit.unii ? " · " : ""}
                  {hit.unii ? `UNII ${hit.unii}` : ""}
                </p>
              )}

              {/* Short summary */}
              {hit.summary && (
                <p className="mt-1.5 text-sm text-slate-600 line-clamp-2">
                  {hit.summary}
                </p>
              )}

              {!hit.summary && hit.subtitle && (
                <p className="mt-1 text-sm text-slate-500 font-latin">
                  {hit.subtitle}
                </p>
              )}
            </Link>

            {hit.kind === "substance" && (
              <div
                className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5"
                onClick={(e) => e.stopPropagation()}
              >
                <OfficialQueryLinks
                  compact
                  nameZh={hit.titleZh}
                  nameEn={hit.titleEn}
                  inn={hit.inn}
                  cas={hit.cas}
                  unii={hit.unii}
                />
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
