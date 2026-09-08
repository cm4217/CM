import Link from "next/link";
import type { SearchHit } from "@/lib/types";
import { DemoBadge } from "./DemoBadge";

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

export function SearchResults({ hits }: { hits: SearchHit[] }) {
  if (hits.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-500">
        未找到匹配结果。可尝试「阿司匹林」「布洛芬」「NDMA」或 CAS 号。
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {hits.map((hit) => (
        <li key={`${hit.kind}-${hit.id}`}>
          <Link
            href={hrefFor(hit)}
            className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-teal-300 hover:shadow transition"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {kindLabel[hit.kind]}
              </span>
              <DemoBadge />
              {hit.badges
                .filter((b) => b !== "示例数据")
                .slice(0, 5)
                .map((b) => (
                  <span
                    key={b}
                    className="rounded-md bg-teal-50 px-2 py-0.5 text-xs text-teal-800 font-latin"
                  >
                    {b}
                  </span>
                ))}
            </div>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">
              {hit.titleZh}{" "}
              <span className="text-base font-normal text-slate-500 font-latin">
                {hit.titleEn}
              </span>
            </h3>
            {hit.subtitle && (
              <p className="mt-1 text-sm text-slate-500 font-latin">{hit.subtitle}</p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
