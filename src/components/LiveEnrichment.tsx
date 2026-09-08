"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";

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

const memCache = new Map<string, { at: number; pubchem?: PubChemData; gsrs?: GsrsData }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function cacheKey(name?: string, cas?: string, unii?: string) {
  return `${cas || ""}|${unii || ""}|${name || ""}`;
}

export function LiveEnrichment({ name, cas, unii }: Props) {
  const [pubchem, setPubchem] = useState<PubChemData | null>(null);
  const [gsrs, setGsrs] = useState<GsrsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    if (!cas && !name && !unii) return;

    const key = cacheKey(name, cas, unii);
    const cached = memCache.get(key);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS && retryToken === 0) {
      setPubchem(cached.pubchem ?? null);
      setGsrs(cached.gsrs ?? null);
      setLoading(false);
      setError(null);
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError(null);
    setPubchem(null);
    setGsrs(null);

    let pub: PubChemData | undefined;
    let gs: GsrsData | undefined;
    const failures: string[] = [];

    try {
      const tasks: Promise<void>[] = [];

      if (cas || name) {
        const qs = cas
          ? `cas=${encodeURIComponent(cas)}`
          : `name=${encodeURIComponent(name!)}`;
        tasks.push(
          fetch(`/api/pubchem/compound?${qs}`, { signal: ac.signal })
            .then(async (r) => {
              const j = await r.json();
              if (!r.ok) {
                pub = {
                  live: false,
                  message: j.message || j.error || `PubChem HTTP ${r.status}`,
                };
                failures.push("PubChem");
              } else {
                pub = j;
                if (j.live === false) failures.push("PubChem");
              }
            })
            .catch((e) => {
              if ((e as Error).name === "AbortError") return;
              pub = {
                live: false,
                message: "PubChem 请求失败，保留站内种子数据。",
              };
              failures.push("PubChem");
            })
        );
      }

      if (unii) {
        tasks.push(
          fetch(`/api/gsrs/substance/${encodeURIComponent(unii)}`, {
            signal: ac.signal,
          })
            .then(async (r) => {
              const j = await r.json();
              if (!r.ok) {
                gs = {
                  live: false,
                  message: j.message || j.error || `GSRS HTTP ${r.status}`,
                };
                failures.push("GSRS");
              } else {
                gs = j;
                if (j.live === false) failures.push("GSRS");
              }
            })
            .catch((e) => {
              if ((e as Error).name === "AbortError") return;
              gs = {
                live: false,
                message: "GSRS 请求失败，保留站内种子数据。",
              };
              failures.push("GSRS");
            })
        );
      } else if (name) {
        tasks.push(
          fetch(`/api/gsrs/search?q=${encodeURIComponent(name)}`, {
            signal: ac.signal,
          })
            .then(async (r) => {
              const j = await r.json();
              gs = {
                live: j.live,
                message: j.message,
                error: j.error,
                relationships: j.data?.content || [],
              };
              if (!r.ok || j.live === false) failures.push("GSRS");
            })
            .catch((e) => {
              if ((e as Error).name === "AbortError") return;
              gs = { live: false, message: "GSRS 搜索失败。" };
              failures.push("GSRS");
            })
        );
      }

      await Promise.all(tasks);
      if (ac.signal.aborted) return;

      setPubchem(pub ?? null);
      setGsrs(gs ?? null);
      memCache.set(key, { at: Date.now(), pubchem: pub, gsrs: gs });
      if (failures.length === 2 || (failures.length === 1 && !pub && !gs)) {
        setError("实时富化暂时不可用，请稍后重试。站内种子数据仍有效。");
      } else {
        setError(null);
      }
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, [name, cas, unii, retryToken]);

  useEffect(() => {
    const t = setTimeout(() => {
      run();
    }, 280); // debounce mount / prop churn
    return () => {
      clearTimeout(t);
      abortRef.current?.abort();
    };
  }, [run]);

  if (!cas && !name && !unii) return null;

  function onRetry() {
    const key = cacheKey(name, cas, unii);
    memCache.delete(key);
    setRetryToken((n) => n + 1);
  }

  return (
    <section className="space-y-3 rounded-xl border border-teal-200 bg-teal-50/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-teal-950">实时富化</h2>
        <span className="text-xs rounded-md bg-teal-100 text-teal-900 px-2 py-0.5">
          GSRS / PubChem · 公开 API
        </span>
        {loading && (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <span className="h-3 w-3 animate-spin rounded-full border border-teal-600 border-t-transparent" />
            加载中…
          </span>
        )}
        {!loading && (
          <button
            type="button"
            onClick={onRetry}
            className="text-xs rounded-md border border-teal-300 px-2 py-0.5 text-teal-800 hover:bg-teal-100"
          >
            重试
          </button>
        )}
      </div>
      <p className="text-xs text-slate-600">
        演示/实时富化已标注；失败时保留站内种子数据。不替代药典正文。结果缓存约 5 分钟，避免频繁请求。
      </p>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2">
          <span>{error}</span>
          <button
            type="button"
            onClick={onRetry}
            className="rounded border border-amber-300 px-2 py-0.5 hover:bg-amber-100"
          >
            重试
          </button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2 min-h-[120px]">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-800">PubChem</h3>
            <ProvenanceBadge source="pubchem" />
          </div>
          {loading && !pubchem && (
            <div className="space-y-2 animate-pulse">
              <div className="mx-auto h-24 w-24 rounded bg-slate-100" />
              <div className="h-3 w-2/3 rounded bg-slate-100" />
              <div className="h-3 w-1/2 rounded bg-slate-100" />
            </div>
          )}
          {!loading && !pubchem && (
            <p className="text-xs text-slate-500">
              无 PubChem 结果。可核对 CAS/名称后重试，或仅使用站内种子。
            </p>
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

        <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2 min-h-[120px]">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-800">FDA GSRS</h3>
            <ProvenanceBadge source="gsrs" />
          </div>
          {loading && !gsrs && (
            <div className="space-y-2 animate-pulse">
              <div className="h-3 w-3/4 rounded bg-slate-100" />
              <div className="h-3 w-1/2 rounded bg-slate-100" />
              <div className="h-3 w-2/3 rounded bg-slate-100" />
            </div>
          )}
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
              {gsrs.relationships.length > 0
                ? `返回 ${gsrs.relationships.length} 条关系/检索结果（详见 API）`
                : "检索无关系摘要"}
            </p>
          ) : (
            !loading && (
              <p className="text-xs text-slate-500">
                暂无关系摘要或未提供 UNII。可点击重试，或仅依赖站内种子。
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
