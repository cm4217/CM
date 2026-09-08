"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildOfficialQueryLinks,
  type OfficialQueryLink,
} from "@/lib/officialQueryLinks";

type Props = {
  q: string;
  /** Show when local hits are 0 or very few */
  show: boolean;
};

type PubChemBrief = {
  cid?: number | string;
  iupacName?: string;
  molecularFormula?: string;
  pubchemUrl?: string | null;
};

/**
 * 「站外可查」— when local search misses (or few hits).
 * Reuses officialQueryLinks; never pretends to be pharmacopoeia full text.
 */
export function ExternalSearchCards({ q, show }: Props) {
  const query = q.trim();
  const links = useMemo(() => {
    if (!query) return [] as OfficialQueryLink[];
    return buildOfficialQueryLinks({
      nameZh: query,
      nameEn: query,
      inn: query,
    }).filter(
      (l) =>
        l.group === "withQuery" &&
        ["PubChem", "PubChem-compound", "Inxight", "Inxight-search", "GSRS", "Ph.Int.", "GG-ChP", "DDG-USP", "DDG-EP"].includes(
          l.code
        )
    );
  }, [query]);

  const [brief, setBrief] = useState<PubChemBrief | null>(null);

  useEffect(() => {
    if (!show || !query) {
      setBrief(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/pubchem/compound?name=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json?.live && json?.data) {
          setBrief({
            cid: json.data.cid,
            iupacName: json.data.iupacName,
            molecularFormula: json.data.molecularFormula,
            pubchemUrl: json.data.pubchemUrl,
          });
        } else setBrief(null);
      })
      .catch(() => {
        if (!cancelled) setBrief(null);
      });
    return () => {
      cancelled = true;
    };
  }, [show, query]);

  if (!show || !query) return null;

  return (
    <section className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">站外可查</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          站内种子未命中或结果很少。以下为公开库 / 官网助手链接（已带检索词），
          <strong className="font-medium text-slate-700">
            {" "}
            不是药典全文
          </strong>
          ，限度与方法以官方为准。
        </p>
      </div>

      {brief?.cid ? (
        <a
          href={
            brief.pubchemUrl ||
            `https://pubchem.ncbi.nlm.nih.gov/compound/${brief.cid}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg border border-teal-200 bg-white px-4 py-3 no-underline hover:border-teal-400"
        >
          <p className="text-xs font-medium text-teal-800">PubChem 简要</p>
          <p className="mt-1 text-sm text-slate-900">
            CID {brief.cid}
            {brief.molecularFormula ? (
              <span className="ml-2 font-latin text-slate-600">
                {brief.molecularFormula}
              </span>
            ) : null}
          </p>
          {brief.iupacName ? (
            <p className="mt-0.5 text-xs text-slate-500 font-latin line-clamp-2">
              {brief.iupacName}
            </p>
          ) : null}
        </a>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <a
            key={link.code}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            title={link.note}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 no-underline hover:border-teal-300 hover:shadow-sm"
          >
            <p className="text-sm font-medium text-slate-900">{link.labelZh}</p>
            <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">
              {link.note || "外链检索"}
            </p>
            <p className="mt-1 text-[10px] text-teal-700">打开 ↗</p>
          </a>
        ))}
      </div>
    </section>
  );
}
