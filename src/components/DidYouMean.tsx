"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Suggestion = {
  name: string;
  rxcui?: string;
  localSubstanceId?: string;
  localNameZh?: string;
  localNameEn?: string;
  href?: string;
};

/**
 * 「你是不是想找」chips from /api/resolve (RxNorm + local map).
 * Shown when local search has few hits.
 */
export function DidYouMean({
  q,
  enabled,
}: {
  q: string;
  enabled: boolean;
}) {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !q.trim()) {
      setItems([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/resolve?q=${encodeURIComponent(q.trim())}`)
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

  if (!enabled || (!loading && items.length === 0)) return null;

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/60 px-4 py-3 space-y-2">
      <p className="text-sm font-medium text-violet-950">
        你是不是想找
        <span className="ml-2 text-xs font-normal text-violet-700/80">
          RxNorm / 站内映射 · 非药典全文
        </span>
      </p>
      {loading ? (
        <p className="text-xs text-violet-600">解析中…</p>
      ) : (
        <div className="flex flex-wrap gap-2">
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
            return (
              <Link
                key={`${s.rxcui || s.name}-${i}`}
                href={href}
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white px-3 py-1 text-xs text-violet-950 no-underline hover:border-violet-400 hover:bg-violet-50"
              >
                <span>{label}</span>
                {s.rxcui ? (
                  <span className="font-latin text-[10px] text-violet-500">
                    RxCUI {s.rxcui}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
