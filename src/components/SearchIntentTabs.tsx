"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { SearchHit } from "@/lib/types";

export type SearchTab = "all" | "substance" | "impurity" | "rs" | "external";

const LABELS: Record<SearchTab, string> = {
  all: "全部",
  substance: "物质",
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
  const tab = ((sp.get("tab") as SearchTab) || "all") as SearchTab;
  const counts: Record<SearchTab, number> = {
    all: hits.length,
    substance: hits.filter((h) => h.kind === "substance").length,
    impurity: hits.filter((h) => h.kind === "impurity").length,
    rs: hits.filter((h) => h.kind === "rs").length,
    external: fewLocal ? 1 : 0,
  };

  const makeHref = (t: SearchTab) => {
    const p = new URLSearchParams(sp.toString());
    if (t === "all") p.delete("tab");
    else p.set("tab", t);
    const q = p.toString();
    return q ? `/search?${q}` : "/search";
  };

  return (
    <nav aria-label="结果意图" className="flex flex-wrap gap-1.5">
      {(Object.keys(LABELS) as SearchTab[]).map((t) => {
        if (t === "external" && !fewLocal && counts.external === 0) return null;
        const active = tab === t || (t === "all" && !sp.get("tab"));
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

export function filterHitsByTab(hits: SearchHit[], tab: string | undefined | null): SearchHit[] {
  if (!tab || tab === "all" || tab === "external") return hits;
  if (tab === "substance" || tab === "impurity" || tab === "rs") {
    return hits.filter((h) => h.kind === tab);
  }
  return hits;
}
