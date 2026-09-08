"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { PHARMACOPOEIA_FILTERS } from "@/lib/constants";

export function SearchFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") || "");
  const [pharmacopoeia, setPharmacopoeia] = useState(sp.get("pharmacopoeia") || "");
  const [type, setType] = useState(sp.get("type") || "");
  const [hasRS, setHasRS] = useState(sp.get("hasRS") || "");

  function apply(e?: FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (pharmacopoeia) params.set("pharmacopoeia", pharmacopoeia);
    if (type) params.set("type", type);
    if (hasRS) params.set("hasRS", hasRS);
    router.push(`/search?${params.toString()}`);
  }

  function reset() {
    setQ("");
    setPharmacopoeia("");
    setType("");
    setHasRS("");
    router.push("/search");
  }

  return (
    <form
      onSubmit={apply}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm">
          <span className="text-slate-600">关键词</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="药名 / INN / CAS / 杂质名"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">药典</span>
          <select
            value={pharmacopoeia}
            onChange={(e) => setPharmacopoeia(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">全部</option>
            {PHARMACOPOEIA_FILTERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">类型</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">全部</option>
            <option value="API">API / 原料药</option>
            <option value="excipient">辅料</option>
            <option value="impurity">杂质</option>
            <option value="rs">对照品</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">有对照品 (RS)</span>
          <select
            value={hasRS}
            onChange={(e) => setHasRS(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">不限</option>
            <option value="yes">有</option>
            <option value="no">无</option>
          </select>
        </label>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          应用筛选
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          重置
        </button>
      </div>
    </form>
  );
}
