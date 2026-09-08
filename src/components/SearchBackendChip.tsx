"use client";

import { useEffect, useState } from "react";

type State = {
  backend: string;
  meili?: { configured: boolean; healthy: boolean; host?: string | null };
};

/**
 * Status chip: Meili vs fuse retrieval backend (tools / about).
 */
export function SearchBackendChip({ className = "" }: { className?: string }) {
  const [st, setSt] = useState<State | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/search-backend")
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setSt(j as State);
      })
      .catch(() => {
        if (!cancelled) setSt({ backend: "fuse+rank" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const backend = st?.backend || "…";
  const meiliOn = st?.meili?.configured && st?.meili?.healthy;
  const label = meiliOn
    ? "检索后端：Meilisearch"
    : st?.meili?.configured
      ? "检索后端：Fuse（Meili 不可达）"
      : "检索后端：Fuse（未配置 Meili）";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
        meiliOn
          ? "border-teal-300 bg-teal-50 text-teal-900"
          : "border-slate-200 bg-slate-50 text-slate-700"
      } ${className}`}
      title={st?.meili?.host || undefined}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          meiliOn ? "bg-teal-500" : "bg-slate-400"
        }`}
        aria-hidden
      />
      {st ? label : "检索后端检测中…"}
      <span className="font-latin text-[10px] text-slate-400">{backend}</span>
    </span>
  );
}
