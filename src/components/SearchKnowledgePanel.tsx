"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PharmacopoeiaCode, SearchHit } from "@/lib/types";
import { CopyChip } from "./CopyChip";

const MATRIX: PharmacopoeiaCode[] = ["ChP", "USP", "EP", "JP", "BP", "Ph.Int."];

type Props = {
  hit: SearchHit | null;
  /** Mobile starts collapsed */
  defaultCollapsed?: boolean;
};

/**
 * Sticky knowledge panel (lg+): PubChem PNG via server proxy, ID chips, coverage matrix.
 */
export function SearchKnowledgePanel({ hit, defaultCollapsed = true }: Props) {
  const [open, setOpen] = useState(!defaultCollapsed);
  const [imgOk, setImgOk] = useState(true);
  const [resolvedCid, setResolvedCid] = useState<string | null>(null);

  useEffect(() => {
    setImgOk(true);
    setResolvedCid(null);
    if (!hit || (hit.kind !== "substance" && hit.kind !== "impurity")) return;
    let cancelled = false;
    const sp = new URLSearchParams();
    if (hit.cas) sp.set("cas", hit.cas);
    else if (hit.titleEn) sp.set("name", hit.titleEn);
    else if (hit.titleZh) sp.set("name", hit.titleZh);
    if (!sp.toString()) return;
    fetch(`/api/chem/compound?${sp.toString()}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        const cid = j?.data?.cid;
        if (cid != null) setResolvedCid(String(cid));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only when identity fields change
  }, [hit?.id, hit?.kind, hit?.cas, hit?.titleEn, hit?.titleZh]);

  if (!hit || (hit.kind !== "substance" && hit.kind !== "impurity")) {
    return (
      <aside className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 lg:sticky lg:top-24">
        选择一条物质/杂质结果以查看知识面板。
      </aside>
    );
  }

  const coverage = new Set(hit.pharmacopoeias || []);
  const imgSrc = resolvedCid
    ? `/api/chem/image?cid=${encodeURIComponent(resolvedCid)}`
    : hit.cas
      ? `/api/chem/image?cas=${encodeURIComponent(hit.cas)}`
      : hit.titleEn
        ? `/api/chem/image?name=${encodeURIComponent(hit.titleEn)}`
        : null;

  const href =
    hit.kind === "substance"
      ? `/substances/${hit.id}`
      : `/impurities/${hit.id}`;

  const body = (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-teal-800">知识面板</p>
          <Link
            href={href}
            className="mt-0.5 block text-sm font-semibold text-slate-900 no-underline hover:text-teal-800"
          >
            {hit.titleZh}
            <span className="ml-1 font-normal text-slate-500 font-latin text-xs">
              {hit.titleEn}
            </span>
          </Link>
        </div>
      </div>

      {imgSrc && imgOk ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={`${hit.titleZh} 结构示意图`}
            className="mx-auto h-40 w-auto object-contain p-2"
            onError={() => setImgOk(false)}
          />
          <p className="border-t border-slate-100 px-2 py-1.5 text-[10px] leading-snug text-slate-500">
            PubChem 结构示意图，非正式药典附图
          </p>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-xs text-slate-400">
          暂无结构示意图
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {hit.cas ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-latin">
            CAS {hit.cas}
            <CopyChip value={hit.cas} label="CAS" />
          </span>
        ) : null}
        {hit.unii ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-latin">
            UNII {hit.unii}
            <CopyChip value={hit.unii} label="UNII" />
          </span>
        ) : null}
        {resolvedCid ? (
          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-latin text-indigo-900">
            CID {resolvedCid}
          </span>
        ) : null}
        {hit.inchiKey ? (
          <span
            className="max-w-full truncate rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-latin text-slate-700"
            title={hit.inchiKey}
          >
            InChIKey {hit.inchiKey}
          </span>
        ) : null}
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-medium text-slate-600">药典覆盖</p>
        <div className="grid grid-cols-3 gap-1.5">
          {MATRIX.map((code) => {
            const on = coverage.has(code);
            return (
              <span
                key={code}
                className={
                  on
                    ? "rounded-md border border-teal-300 bg-teal-50 px-1.5 py-1 text-center text-[11px] font-medium text-teal-900 font-latin"
                    : "rounded-md border border-slate-100 bg-slate-50 px-1.5 py-1 text-center text-[11px] text-slate-400 font-latin"
                }
                title={on ? `有 ${code} 索引` : `无 ${code} 索引`}
              >
                {on ? "✓ " : "· "}
                {code}
              </span>
            );
          })}
        </div>
      </div>

      {hit.kind === "substance" ? (
        <Link
          href={`/substances/${encodeURIComponent(hit.id)}/compendial`}
          className="inline-flex w-full items-center justify-center rounded-lg border border-sky-500 bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-900 no-underline hover:bg-sky-100"
        >
          详细对照 · 多药典矩阵
        </Link>
      ) : null}
    </div>
  );

  return (
    <>
      {/* Mobile summary strip */}
      <div className="lg:hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-slate-800"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span>
            知识面板 · {hit.titleZh}
            {resolvedCid ? (
              <span className="ml-2 text-xs font-normal text-slate-500 font-latin">
                CID {resolvedCid}
              </span>
            ) : null}
          </span>
          <span className="text-xs text-slate-500">{open ? "收起" : "展开"}</span>
        </button>
        {open ? <div className="border-t border-slate-100 px-3 pb-3 pt-2">{body}</div> : null}
      </div>

      {/* Desktop sticky */}
      <aside className="hidden lg:block lg:sticky lg:top-24 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {body}
      </aside>
    </>
  );
}
