"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { recentAlerts, substances } from "@/data";
import { DemoBadge } from "@/components/DemoBadge";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { loadSearchHistory, clearSearchHistory } from "@/lib/searchHistory";
import { loadWatchlist, type WatchlistItem } from "@/lib/watchlistStorage";
import {
  COMPARE_QUEUE_MAX,
  loadCompareQueue,
} from "@/lib/compareQueueStorage";
import { showToast } from "@/lib/toastBus";
import { SynonymGapExportButton } from "@/components/SynonymGapExportButton";

export default function WorkbenchPage() {
  const [history, setHistory] = useState<string[]>([]);
  const [watch, setWatch] = useState<WatchlistItem[]>([]);
  const [queue, setQueue] = useState<string[]>([]);

  useEffect(() => {
    setHistory(loadSearchHistory());
    setWatch(loadWatchlist());
    setQueue(loadCompareQueue());
  }, []);

  const alerts = useMemo(() => recentAlerts(4), []);

  const queueNames = queue.map((id) => {
    const s = substances.find((x) => x.id === id);
    return s ? `${s.nameZh}` : id;
  });

  const matchedWatch = watch.filter((w) => w.resolved.status === "matched");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">工作台</h1>
          <p className="mt-1 text-sm text-slate-500 font-latin">
            Workbench · history · watchlist · shortcuts
          </p>
        </div>
        <DemoBadge />
      </div>

      <DisclaimerBanner compact />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/search", label: "检索", desc: "药名 / CAS / 杂质" },
          { href: "/compare", label: "对比队列", desc: `队列 ${queue.length}/${COMPARE_QUEUE_MAX}` },
          { href: "/checklist", label: "核查清单", desc: "市场勾选 · 打印" },
          { href: "/alerts", label: "修订提醒", desc: "影响分析" },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-teal-300 transition"
          >
            <p className="font-semibold text-teal-900">{c.label}</p>
            <p className="mt-1 text-xs text-slate-500">{c.desc}</p>
          </Link>
        ))}
      </section>

      <SynonymGapExportButton />

      <section className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 space-y-2">
        <h2 className="text-sm font-semibold text-teal-950">快捷键</h2>
        <ul className="text-sm text-slate-700 space-y-1">
          <li>
            <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-latin text-xs">
              /
            </kbd>{" "}
            聚焦检索框（若当前页有）
          </li>
          <li>
            <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-latin text-xs">
              c
            </kbd>{" "}
            在物质详情页复制主药名（需{" "}
            <code className="text-xs font-latin">data-pharm-primary-name</code>）
          </li>
          <li>
            <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-latin text-xs">
              Esc
            </kbd>{" "}
            关闭自动补全下拉
          </li>
        </ul>
        <p className="text-xs text-slate-500">
          在 input / textarea 中输入时快捷键不会触发（Esc 除外）。
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">最近检索</h2>
            <button
              type="button"
              className="text-xs text-slate-500 hover:underline"
              onClick={() => {
                clearSearchHistory();
                setHistory([]);
                showToast("已清空检索历史");
              }}
            >
              清空
            </button>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-slate-400">暂无历史</p>
          ) : (
            <ul className="space-y-1.5">
              {history.map((h) => (
                <li key={h}>
                  <Link
                    href={`/search?q=${encodeURIComponent(h)}`}
                    className="text-sm text-teal-800 hover:underline font-latin"
                  >
                    {h}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">关注快照</h2>
            <Link href="/watchlist" className="text-xs text-teal-700 hover:underline">
              管理 →
            </Link>
          </div>
          <p className="text-xs text-slate-500">
            共 {watch.length} · 命中 {matchedWatch.length}
          </p>
          {matchedWatch.length === 0 ? (
            <p className="text-sm text-slate-400">暂无关注命中项</p>
          ) : (
            <ul className="space-y-1.5">
              {matchedWatch.slice(0, 8).map((it, idx) => {
                const r = it.resolved;
                if (r.status !== "matched") return null;
                return (
                  <li key={`${it.query}-${idx}`} className="text-sm">
                    <Link
                      href={
                        r.kind === "substance"
                          ? `/substances/${r.id}`
                          : `/impurities/${r.id}`
                      }
                      className="text-teal-800 hover:underline"
                    >
                      {r.nameZh}
                    </Link>
                    <span className="ml-2 text-xs text-slate-400">{r.coverage}</span>
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href="/checklist"
            className="inline-block text-xs text-indigo-700 hover:underline"
          >
            打开核查清单 →
          </Link>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">对比队列</h2>
            <Link href="/compare" className="text-xs text-teal-700 hover:underline">
              去对比 →
            </Link>
          </div>
          {queue.length === 0 ? (
            <p className="text-sm text-slate-400">
              空。检索卡片点「加入对比」。
            </p>
          ) : (
            <p className="text-sm text-slate-700">{queueNames.join(" · ")}</p>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">最近修订提醒</h2>
            <Link href="/alerts" className="text-xs text-teal-700 hover:underline">
              全部 →
            </Link>
          </div>
          <ul className="space-y-2">
            {alerts.map((e) => (
              <li key={e.id} className="text-sm">
                <span className="text-xs text-slate-400 font-latin mr-2">
                  {e.date}
                </span>
                {e.titleZh}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
