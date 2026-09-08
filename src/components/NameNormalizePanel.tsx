"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Suggestion = {
  name: string;
  rxcui?: string;
  score?: number;
  confidence?: number;
  localSubstanceId?: string;
  localNameZh?: string;
  localNameEn?: string;
  href?: string;
  source?: string;
};

function looksEnglish(q: string) {
  const t = q.trim();
  if (!t) return false;
  // mostly Latin letters / spaces / punctuation
  const latin = (t.match(/[A-Za-z]/g) || []).length;
  return latin >= Math.max(2, t.length * 0.5);
}

/**
 * 名称归一（RxNorm）— 检索页一等公民面板，展示置信度。
 */
export function NameNormalizePanel({
  q,
  force,
}: {
  q: string;
  /** 强制显示（如少结果）；默认英文查询时显示 */
  force?: boolean;
}) {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const enabled = force || looksEnglish(q);

  useEffect(() => {
    if (!enabled || !q.trim()) {
      setItems([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/resolve?q=${encodeURIComponent(q.trim())}&minScore=40`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setItems((json.suggestions || []) as Suggestion[]);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q, enabled]);

  if (!enabled) return null;
  if (!loading && items.length === 0) return null;

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50/50 px-4 py-3 space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-sky-950">
          名称归一
          <span className="ml-2 text-xs font-normal text-sky-700/80">
            RxNorm · 置信度 · 非药典全文
          </span>
        </p>
        {loading ? (
          <span className="text-xs text-sky-600">解析中…</span>
        ) : null}
      </div>
      <ul className="space-y-1.5">
        {items.map((s, i) => {
          const label =
            s.localNameZh && s.localNameEn
              ? `${s.localNameZh} / ${s.localNameEn}`
              : s.name;
          const href =
            s.href ||
            (s.localSubstanceId
              ? `/substances/${s.localSubstanceId}`
              : `/search?q=${encodeURIComponent(s.name)}`);
          const conf =
            typeof s.confidence === "number"
              ? Math.round(s.confidence * 100)
              : null;
          return (
            <li
              key={`${s.rxcui || s.name}-${i}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm"
            >
              <Link href={href} className="font-medium text-sky-950 no-underline hover:underline">
                {label}
              </Link>
              <div className="flex items-center gap-2 text-[11px] text-sky-700">
                {s.rxcui ? (
                  <span className="font-latin">RxCUI {s.rxcui}</span>
                ) : null}
                {conf != null ? (
                  <span
                    className={`rounded-full px-2 py-0.5 font-latin ${
                      conf >= 80
                        ? "bg-emerald-100 text-emerald-800"
                        : conf >= 50
                          ? "bg-amber-100 text-amber-900"
                          : "bg-slate-100 text-slate-600"
                    }`}
                    title={s.score != null ? `RxNorm score ${s.score}` : undefined}
                  >
                    {conf}%
                  </span>
                ) : null}
                {s.source ? (
                  <span className="text-slate-400">{s.source}</span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
