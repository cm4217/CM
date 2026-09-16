"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { SearchHit } from "@/lib/types";
import {
  effectiveSearchTab,
  tabFromType,
  type SearchTab,
} from "@/lib/searchTabSync";

const LABELS: Record<SearchTab, string> = {
  all: "全部",
  substance: "原料药",
  drug: "成药",
  impurity: "杂质",
  rs: "对照品",
  external: "站外",
};

type Props = {
  hits: SearchHit[];
  /** When few local hits, external tab is more relevant */
  fewLocal?: boolean;
};

export function SearchIntentTabs({ hits, fewLocal = false }: Props) {
  const sp = useSearchParams();
  const tab = effectiveSearchTab(sp.get("type"), sp.get("tab"));
  const counts: Record<SearchTab, number> = {
    all: hits.length,
    substance: hits.filter((h) => h.kind === "substance").length,
    drug: hits.filter((h) => h.kind === "drug").length,
    impurity: hits.filter((h) => h.kind === "impurity").length,
    rs: hits.filter((h) => h.kind === "rs").length,
    external: fewLocal ? 1 : 0,
  };

  const makeHref = (t: SearchTab) => {
    const p = new URLSearchParams(sp.toString());
    const type = p.get("type");
    const typeImplies = tabFromType(type);

    if (t === "all") {
      p.delete("tab");
      // Drop kind-locking type so「全部」真正展示混排
      if (typeImplies) p.delete("type");
    } else if (t === "external") {
      p.set("tab", "external");
    } else {
      p.set("tab", t);
      // If type locks a different kind, clear it so this tab can take effect
      // (type form remains the way to server-filter; tabs are client intent)
      if (typeImplies && typeImplies !== t) {
        p.delete("type");
      } else if (typeImplies && typeImplies === t) {
        // already aligned — keep type for shareable deep links
      }
    }
    const q = p.toString();
    return q ? `/search?${q}` : "/search";
  };

  return (
    <nav aria-label="结果意图" className="flex flex-wrap gap-1.5">
      {(Object.keys(LABELS) as SearchTab[]).map((t) => {
        if (t === "external" && !fewLocal && counts.external === 0) return null;
        const active = tab === t;
        return (
          <Link
            key={t}
            href={makeHref(t)}
            className={
              active
                ? "rounded-full border border-teal-600 bg-teal-600 px-3 py-1 text-sm font-medium text-white no-underline"
                : "rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 no-underline hover:border-teal-400 hover:bg-teal-50"
            }
            scroll={false}
          >
            {LABELS[t]}
            <span className={`ml-1 ${active ? "text-teal-100" : "text-slate-400"}`}>
              ({counts[t]})
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function filterHitsByTab(
  hits: SearchHit[],
  tab: string | undefined | null,
  type?: string | null
): SearchHit[] {
  const effective = effectiveSearchTab(type, tab);
  if (!effective || effective === "all" || effective === "external") return hits;
  if (
    effective === "substance" ||
    effective === "drug" ||
    effective === "impurity" ||
    effective === "rs"
  ) {
    return hits.filter((h) => h.kind === effective);
  }
  return hits;
}

export { type SearchTab };
