"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildOfficialQueryLinks,
  type OfficialQueryLink,
} from "@/lib/officialQueryLinks";
import { showToast } from "@/lib/toastBus";

type Props = {
  q: string;
  /** Show when local hits are 0 or very few */
  show: boolean;
};

type PubChemBrief = {
  cid?: number | string;
  iupacName?: string;
  molecularFormula?: string;
  canonicalSMILES?: string;
  pubchemUrl?: string | null;
  synonyms?: string[];
};

const AUTO_KEY = "pharm-auto-cache-draft";

/**
 * 「站外可查」— when local search misses (or few hits).
 * Reuses officialQueryLinks; never pretends to be pharmacopoeia full text.
 * Supports draft cache: 「将站外结果加入本地可搜缓存」
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
        [
          "PubChem",
          "PubChem-compound",
          "Inxight",
          "Inxight-search",
          "GSRS",
          "Ph.Int.",
          "GG-ChP",
          "DDG-USP",
          "DDG-EP",
        ].includes(l.code)
    );
  }, [query]);

  const [brief, setBrief] = useState<PubChemBrief | null>(null);
  const [gsrsUnii, setGsrsUnii] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [autoAdd, setAutoAdd] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      setAutoAdd(localStorage.getItem(AUTO_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!show || !query) {
      setBrief(null);
      setGsrsUnii(undefined);
      setSavedId(null);
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
            canonicalSMILES: json.data.canonicalSMILES,
            pubchemUrl: json.data.pubchemUrl,
            synonyms: json.data.synonyms,
          });
        } else setBrief(null);
      })
      .catch(() => {
        if (!cancelled) setBrief(null);
      });

    fetch(`/api/gsrs/search?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const content = json?.data?.content || json?.data?.substances || [];
        const first = Array.isArray(content) ? content[0] : null;
        const unii =
          first?.approvalID ||
          first?.unii ||
          first?.uuid ||
          undefined;
        if (typeof unii === "string") setGsrsUnii(unii);
      })
      .catch(() => {
        if (!cancelled) setGsrsUnii(undefined);
      });

    return () => {
      cancelled = true;
    };
  }, [show, query]);

  async function addDraft(opts?: { silent?: boolean }) {
    if (!query) return;
    setSaving(true);
    try {
      const res = await fetch("/api/index/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: query,
          nameEn: brief?.iupacName || query,
          nameZh: query,
          cid: brief?.cid,
          smiles: brief?.canonicalSMILES,
          unii: gsrsUnii,
          source: brief?.cid ? "pubchem" : gsrsUnii ? "gsrs" : "external",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "保存失败");
      setSavedId(json.draft?.id || "ok");
      if (!opts?.silent) {
        showToast("已加入本地可搜缓存草稿", "ok");
      }
    } catch (e) {
      if (!opts?.silent) {
        showToast(String((e as Error).message || e), "err");
      }
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!show || !autoAdd || !query || savedId) return;
    if (!brief?.cid && !gsrsUnii) return;
    void addDraft({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, autoAdd, query, brief?.cid, gsrsUnii]);

  if (!show || !query) return null;

  return (
    <section className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">站外可查</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          站内种子未命中或结果很少。以下为公开库 / 官网助手链接（已带检索词），
          <strong className="font-medium text-slate-700"> 不是药典全文</strong>
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

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2.5">
        <button
          type="button"
          disabled={saving || !!savedId}
          onClick={() => void addDraft()}
          className="rounded-lg bg-amber-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-60"
        >
          {savedId
            ? "已加入缓存"
            : saving
              ? "保存中…"
              : "将站外结果加入本地可搜缓存"}
        </button>
        <label className="flex items-center gap-1.5 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={autoAdd}
            onChange={(e) => {
              const on = e.target.checked;
              setAutoAdd(on);
              try {
                localStorage.setItem(AUTO_KEY, on ? "1" : "0");
              } catch {
                /* ignore */
              }
            }}
          />
          自动加入草稿（可选）
        </label>
        <a
          href="/tools/index"
          className="text-xs text-teal-800 underline-offset-2 hover:underline"
        >
          管理缓存草稿 →
        </a>
      </div>

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
