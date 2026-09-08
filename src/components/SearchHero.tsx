"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  clearSearchHistory,
  loadSearchHistory,
  pushSearchHistory,
} from "@/lib/searchHistory";

export function SearchHero() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setHistory(loadSearchHistory());
  }, []);

  function go(query: string) {
    const t = query.trim();
    if (t) {
      pushSearchHistory(t);
      setHistory(loadSearchHistory());
    }
    router.push(t ? `/search?q=${encodeURIComponent(t)}` : "/search");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    go(q);
  }

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white shadow-lg">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-300 via-transparent to-transparent" />
      <div className="relative px-6 py-12 sm:px-10 sm:py-16">
        <p className="text-teal-200 text-sm font-medium tracking-wide">
          药典索引 · 杂质发现层 · 示例数据
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
          以索引与对照连接多药典
        </h1>
        <p className="mt-3 max-w-2xl text-teal-50/90 text-sm sm:text-base leading-relaxed">
          按药名 / INN / CAS / 杂质名检索。支持同义词、拼音首字母与模糊容错。限度与方法以现行官方药典为准。
        </p>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-2xl">
          <label className="sr-only" htmlFor="hero-q">检索</label>
          <input
            id="hero-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="药名 / INN / CAS / 杂质名 / 拼音首字母，如 aspl、ASA"
            className="flex-1 rounded-xl border-0 px-4 py-3 text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300"
          />
          <button
            type="submit"
            className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-teal-900 shadow hover:bg-teal-50 transition"
          >
            检索
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-teal-100/90">
          {["阿司匹林", "乙酰水杨酸", "布洛芬", "NDMA", "aspl", "15687-27-1"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => go(t)}
              className="rounded-full bg-white/10 px-3 py-1 hover:bg-white/20 transition font-latin"
            >
              {t}
            </button>
          ))}
        </div>

        {history.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-teal-200/80">最近检索：</span>
            {history.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => go(t)}
                className="rounded-full bg-black/20 px-3 py-1 hover:bg-black/30 font-latin"
              >
                {t}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                clearSearchHistory();
                setHistory([]);
              }}
              className="text-teal-200/70 hover:text-white underline"
            >
              清除
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
