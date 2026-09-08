"use client";

import { useEffect, useState } from "react";

type Props = {
  name?: string;
  cas?: string;
  unii?: string;
};

type PubChemData = {
  live?: boolean;
  message?: string;
  error?: string;
  data?: {
    cid?: number;
    molecularFormula?: string;
    molecularWeight?: string | number;
    inchiKey?: string;
    iupacName?: string;
    synonyms?: string[];
    imageUrl?: string | null;
    pubchemUrl?: string | null;
  };
};

type GsrsData = {
  live?: boolean;
  message?: string;
  error?: string;
  impurityParents?: { type?: string; name?: string; approvalID?: string }[];
  relationships?: unknown[];
};

export function LiveEnrichment({ name, cas, unii }: Props) {
  const [pubchem, setPubchem] = useState<PubChemData | null>(null);
  const [gsrs, setGsrs] = useState<GsrsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      const tasks: Promise<void>[] = [];

      if (cas || name) {
        const qs = cas
          ? `cas=${encodeURIComponent(cas)}`
          : `name=${encodeURIComponent(name!)}`;
        tasks.push(
          fetch(`/api/pubchem/compound?${qs}`)
            .then(async (r) => {
              const j = await r.json();
              if (!cancelled) setPubchem(j);
            })
            .catch(() => {
              if (!cancelled)
                setPubchem({
                  live: false,
                  message: "PubChem 请求失败，保留站内种子数据。",
                });
            })
        );
      }

      if (unii) {
        tasks.push(
          fetch(`/api/gsrs/substance/${encodeURIComponent(unii)}`)
            .then(async (r) => {
              const j = await r.json();
              if (!cancelled) setGsrs(j);
            })
            .catch(() => {
              if (!cancelled)
                setGsrs({
                  live: false,
                  message: "GSRS 请求失败，保留站内种子数据。",
                });
            })
        );
      } else if (name) {
        tasks.push(
          fetch(`/api/gsrs/search?q=${encodeURIComponent(name)}`)
            .then(async (r) => {
              const j = await r.json();
              if (!cancelled)
                setGsrs({
                  live: j.live,
                  message: j.message,
                  error: j.error,
                  relationships: j.data?.content || [],
                });
            })
            .catch(() => {
              if (!cancelled)
                setGsrs({ live: false, message: "GSRS 搜索失败。" });
            })
        );
      }

      await Promise.all(tasks);
      if (!cancelled) setLoading(false);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [name, cas, unii]);

  if (!cas && !name && !unii) return null;

  return (
    <section className="space-y-3 rounded-xl border border-teal-200 bg-teal-50/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-teal-950">实时富化</h2>
        <span className="text-xs rounded-md bg-teal-100 text-teal-900 px-2 py-0.5">
          GSRS / PubChem · 公开 API
        </span>
        {loading && (
          <span className="text-xs text-slate-500">加载中…</span>
        )}
      </div>
      <p className="text-xs text-slate-600">
        演示/实时富化已标注；失败时保留站内种子数据。不替代药典正文。
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
          <h3 className="text-sm font-semibold text-slate-800">PubChem</h3>
          {!pubchem && !loading && (
            <p className="text-xs text-slate-500">无查询条件</p>
          )}
          {pubchem?.live === false && (
            <p className="text-xs text-amber-800">
              {pubchem.message || pubchem.error || "PubChem 暂不可用"}
            </p>
          )}
          {pubchem?.data && (
            <div className="space-y-2 text-sm">
              {pubchem.data.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pubchem.data.imageUrl}
                  alt="PubChem 2D structure"
                  className="mx-auto h-40 w-40 object-contain bg-white rounded border border-slate-100"
                />
              )}
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                <dt className="text-slate-500">CID</dt>
                <dd className="font-latin">{pubchem.data.cid ?? "—"}</dd>
                <dt className="text-slate-500">Formula</dt>
                <dd className="font-latin">{pubchem.data.molecularFormula ?? "—"}</dd>
                <dt className="text-slate-500">InChIKey</dt>
                <dd className="font-latin break-all">{pubchem.data.inchiKey ?? "—"}</dd>
                <dt className="text-slate-500">IUPAC</dt>
                <dd className="font-latin text-[11px]">{pubchem.data.iupacName ?? "—"}</dd>
              </dl>
              {pubchem.data.synonyms && pubchem.data.synonyms.length > 0 && (
                <p className="text-xs text-slate-600">
                  同义词：{pubchem.data.synonyms.slice(0, 8).join(" · ")}
                </p>
              )}
              {pubchem.data.pubchemUrl && (
                <a
                  href={pubchem.data.pubchemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-teal-700 hover:underline"
                >
                  打开 PubChem ↗
                </a>
              )}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
          <h3 className="text-sm font-semibold text-slate-800">FDA GSRS</h3>
          {gsrs?.live === false && (
            <p className="text-xs text-amber-800">
              {gsrs.message || gsrs.error || "GSRS 暂不可用"}
            </p>
          )}
          {gsrs?.live && (
            <p className="text-xs text-teal-800">已连接公开 API</p>
          )}
          {gsrs?.impurityParents && gsrs.impurityParents.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-slate-700 mb-1">
                关系（杂质→母体等）
              </p>
              <ul className="text-xs space-y-1">
                {gsrs.impurityParents.slice(0, 8).map((r, idx) => (
                  <li key={idx} className="font-latin text-slate-700">
                    {r.type || "rel"}: {r.name || "—"}
                    {r.approvalID ? ` (${r.approvalID})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : gsrs?.relationships && Array.isArray(gsrs.relationships) ? (
            <p className="text-xs text-slate-500">
              返回 {gsrs.relationships.length} 条关系/检索结果（详见 API）
            </p>
          ) : (
            !loading && (
              <p className="text-xs text-slate-500">
                暂无关系摘要或未提供 UNII
              </p>
            )
          )}
          {unii && (
            <p className="text-xs text-slate-400 font-latin">UNII {unii}</p>
          )}
        </div>
      </div>
    </section>
  );
}
