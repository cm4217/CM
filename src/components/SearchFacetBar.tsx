"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SearchFacets } from "@/lib/search";

function FacetChip({
  active,
  onClick,
  label,
  count,
  activeClass = "border-teal-600 bg-teal-50 text-teal-900",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  activeClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-0.5 text-xs ${
        active
          ? activeClass
          : "border-slate-200 bg-white text-slate-700 hover:border-teal-300"
      }`}
    >
      {label}
      <span className="ml-1 opacity-60">{count}</span>
    </button>
  );
}

export function SearchFacetBar({ facets }: { facets: SearchFacets }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [advOpen, setAdvOpen] = useState(false);

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(sp.toString());
    if (!value) params.delete(key);
    else params.set(key, value);
    router.push(`/search?${params.toString()}`);
  }

  const hasCAS = sp.get("hasCAS") || "";
  const hasDeepLink = sp.get("hasDeepLink") || "";
  const impurityType = sp.get("impurityType") || "";
  const parentId = sp.get("parentId") || "";
  const dosageForm = sp.get("dosageForm") || "";
  const region = sp.get("region") || "";
  const molecularFormula = sp.get("molecularFormula") || "";
  const pharmaVersion = sp.get("pharmaVersion") || "";
  const efficacy = sp.get("efficacy") || "";
  const titleOnly = sp.get("titleOnly") === "1";
  const compact = sp.get("view") === "compact";
  const indexSource = sp.get("indexSource") || "";

  const hasAdvanced =
    facets.molecularFormula.length > 0 ||
    facets.pharmaVersion.length > 0 ||
    facets.efficacy.length > 0;

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-600">分面</span>
        <FacetChip
          active={indexSource === "curated"}
          onClick={() =>
            setParam("indexSource", indexSource === "curated" ? null : "curated")
          }
          label="仅精选种子"
          count={facets.indexSource?.find((x) => x.value === "curated")?.count || 0}
        />
        <FacetChip
          active={!indexSource || indexSource === "all"}
          onClick={() => setParam("indexSource", null)}
          label="含开放索引"
          count={(facets.indexSource || []).reduce((n, b) => n + b.count, 0)}
          activeClass="border-indigo-600 bg-indigo-50 text-indigo-950"
        />
        {(facets.indexSource || [])
          .filter((b) => b.value !== "curated")
          .map((b) => (
            <FacetChip
              key={`ix-${b.value}`}
              active={indexSource === b.value}
              onClick={() =>
                setParam("indexSource", indexSource === b.value ? null : b.value)
              }
              label={b.label}
              count={b.count}
              activeClass="border-violet-600 bg-violet-50 text-violet-950"
            />
          ))}
        {facets.dosageForm.map((b) => (
          <FacetChip
            key={`df-${b.value}`}
            active={dosageForm === b.value}
            onClick={() =>
              setParam("dosageForm", dosageForm === b.value ? null : b.value)
            }
            label={b.label}
            count={b.count}
          />
        ))}
        {(facets.region || []).map((b) => (
          <FacetChip
            key={`rg-${b.value}`}
            active={region === b.value}
            onClick={() =>
              setParam("region", region === b.value ? null : b.value)
            }
            label={b.label}
            count={b.count}
            activeClass="border-amber-600 bg-amber-50 text-amber-950"
          />
        ))}
        {facets.parentDrug.map((b) => (
          <FacetChip
            key={`pd-${b.value}`}
            active={parentId === b.value}
            onClick={() =>
              setParam("parentId", parentId === b.value ? null : b.value)
            }
            label={b.label}
            count={b.count}
            activeClass="border-indigo-600 bg-indigo-50 text-indigo-950"
          />
        ))}
        {facets.hasCAS.map((b) => (
          <FacetChip
            key={`cas-${b.value}`}
            active={hasCAS === b.value}
            onClick={() =>
              setParam("hasCAS", hasCAS === b.value ? null : b.value)
            }
            label={b.label}
            count={b.count}
          />
        ))}
        {facets.hasDeepLink.map((b) => (
          <FacetChip
            key={`dl-${b.value}`}
            active={hasDeepLink === b.value}
            onClick={() =>
              setParam("hasDeepLink", hasDeepLink === b.value ? null : b.value)
            }
            label={b.label}
            count={b.count}
          />
        ))}
        {facets.impurityType.map((b) => (
          <FacetChip
            key={`it-${b.value}`}
            active={impurityType === b.value}
            onClick={() =>
              setParam(
                "impurityType",
                impurityType === b.value ? null : b.value
              )
            }
            label={b.label}
            count={b.count}
            activeClass="border-amber-600 bg-amber-50 text-amber-950"
          />
        ))}
      </div>

      {hasAdvanced ? (
        <div className="border-t border-slate-100 pt-2">
          <button
            type="button"
            onClick={() => setAdvOpen((o) => !o)}
            className="text-xs font-medium text-slate-600 hover:text-teal-800"
            aria-expanded={advOpen}
          >
            {advOpen ? "▾ 高级" : "▸ 高级"}
            <span className="ml-1 font-normal text-slate-400">
              分子式 · 药典版本 · 效力状态
            </span>
          </button>
          {advOpen ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {facets.molecularFormula.map((b) => (
                <FacetChip
                  key={`mf-${b.value}`}
                  active={molecularFormula === b.value}
                  onClick={() =>
                    setParam(
                      "molecularFormula",
                      molecularFormula === b.value ? null : b.value
                    )
                  }
                  label={`分子式 ${b.label}`}
                  count={b.count}
                />
              ))}
              {facets.pharmaVersion.map((b) => (
                <FacetChip
                  key={`pv-${b.value}`}
                  active={pharmaVersion === b.value}
                  onClick={() =>
                    setParam(
                      "pharmaVersion",
                      pharmaVersion === b.value ? null : b.value
                    )
                  }
                  label={b.label}
                  count={b.count}
                />
              ))}
              {facets.efficacy.map((b) => (
                <FacetChip
                  key={`ef-${b.value}`}
                  active={efficacy === b.value}
                  onClick={() =>
                    setParam("efficacy", efficacy === b.value ? null : b.value)
                  }
                  label={b.label}
                  count={b.count}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

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
