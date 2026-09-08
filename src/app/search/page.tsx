import { Suspense } from "react";
import { SearchFilters } from "@/components/SearchFilters";
import { SearchResults } from "@/components/SearchResults";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { searchAll } from "@/lib/search";
import type { PharmacopoeiaCode } from "@/lib/types";
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
  };
};

export default function SearchPage({ searchParams }: Props) {
  const hits = searchAll({
    q: searchParams.q,
    pharmacopoeia: (searchParams.pharmacopoeia || "") as PharmacopoeiaCode | "",
    type: searchParams.type || "",
    hasRS: (searchParams.hasRS || "") as "yes" | "no" | "",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">检索结果</h1>
        <p className="mt-1 text-sm text-slate-500 font-latin">
          Search · filters for pharmacopoeia / type / RS
        </p>
      </div>

      <DisclaimerBanner compact />

      <Suspense fallback={<div className="text-sm text-slate-500">加载筛选…</div>}>
        <SearchFilters />
      </Suspense>

      <p className="text-sm text-slate-600">
        共 <span className="font-semibold text-teal-800">{hits.length}</span> 条结果
        {searchParams.q ? (
          <>
            {" "}
            · 关键词「<span className="font-medium">{searchParams.q}</span>」
          </>
        ) : null}
      </p>

      <SearchResults hits={hits} />
    </div>
  );
}
