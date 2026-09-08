"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { SearchFacets } from "@/lib/search";

export function SearchFacetBar({ facets }: { facets: SearchFacets }) {
  const router = useRouter();
  const sp = useSearchParams();

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(sp.toString());
    if (!value) params.delete(key);
    else params.set(key, value);
    router.push(`/search?${params.toString()}`);
  }

  const hasCAS = sp.get("hasCAS") || "";
  const hasDeepLink = sp.get("hasDeepLink") || "";
  const impurityType = sp.get("impurityType") || "";
  const titleOnly = sp.get("titleOnly") === "1";
  const compact = sp.get("view") === "compact";

  const hasAnyFacet =
    facets.hasCAS.length ||
    facets.hasDeepLink.length ||
    facets.impurityType.length ||
    facets.dosageForm.length;

  if (!hasAnyFacet && !titleOnly && !compact) {
    // still show view toggles when there are hits via parent; parent gates rendering
  }

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-600">分面</span>
        {facets.dosageForm.map((b) => (
          <span
            key={`df-${b.value}`}
            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-700"
          >
            {b.label}
            <span className="ml-1 text-slate-400">{b.count}</span>
          </span>
        ))}
        {facets.hasCAS.map((b) => (
          <button
            key={`cas-${b.value}`}
            type="button"
            onClick={() =>
              setParam("hasCAS", hasCAS === b.value ? null : b.value)
            }
            className={`rounded-full border px-2.5 py-0.5 text-xs ${
              hasCAS === b.value
                ? "border-teal-600 bg-teal-50 text-teal-900"
                : "border-slate-200 bg-white text-slate-700 hover:border-teal-300"
            }`}
          >
            {b.label}
            <span className="ml-1 opacity-60">{b.count}</span>
          </button>
        ))}
        {facets.hasDeepLink.map((b) => (
          <button
            key={`dl-${b.value}`}
            type="button"
            onClick={() =>
              setParam("hasDeepLink", hasDeepLink === b.value ? null : b.value)
            }
            className={`rounded-full border px-2.5 py-0.5 text-xs ${
              hasDeepLink === b.value
                ? "border-teal-600 bg-teal-50 text-teal-900"
                : "border-slate-200 bg-white text-slate-700 hover:border-teal-300"
            }`}
          >
            {b.label}
            <span className="ml-1 opacity-60">{b.count}</span>
          </button>
        ))}
        {facets.impurityType.map((b) => (
          <button
            key={`it-${b.value}`}
            type="button"
            onClick={() =>
              setParam(
                "impurityType",
                impurityType === b.value ? null : b.value
              )
            }
            className={`rounded-full border px-2.5 py-0.5 text-xs ${
              impurityType === b.value
                ? "border-amber-600 bg-amber-50 text-amber-950"
                : "border-slate-200 bg-white text-slate-700 hover:border-amber-300"
            }`}
          >
            {b.label}
            <span className="ml-1 opacity-60">{b.count}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2">
        <span className="text-xs font-medium text-slate-600">视图</span>
        <button
          type="button"
          onClick={() => setParam("titleOnly", titleOnly ? null : "1")}
          className={`rounded-full border px-2.5 py-0.5 text-xs ${
            titleOnly
              ? "border-teal-600 bg-teal-50 text-teal-900"
              : "border-slate-200 bg-white text-slate-700"
          }`}
        >
          仅标题
        </button>
        <button
          type="button"
          onClick={() => setParam("view", compact ? null : "compact")}
          className={`rounded-full border px-2.5 py-0.5 text-xs ${
            compact
              ? "border-teal-600 bg-teal-50 text-teal-900"
              : "border-slate-200 bg-white text-slate-700"
          }`}
        >
          杂质紧凑表
        </button>
      </div>
    </div>
  );
}
