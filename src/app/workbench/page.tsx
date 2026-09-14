"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import {
  isClientBoostEnabled,
  setClientBoostEnabled,
} from "@/lib/clientBoost";

function WorkbenchInner() {
  const sp = useSearchParams();
  const focusId = (sp.get("focus") || sp.get("substance") || "").trim();
  const [history, setHistory] = useState<string[]>([]);
  const [watch, setWatch] = useState<WatchlistItem[]>([]);
  const [queue, setQueue] = useState<string[]>([]);
  const [boostOn, setBoostOn] = useState(true);

  useEffect(() => {
    setHistory(loadSearchHistory());
    setWatch(loadWatchlist());
    setQueue(loadCompareQueue());
    setBoostOn(isClientBoostEnabled());
  }, []);

  const alerts = useMemo(() => recentAlerts(4), []);

  const focusSub = useMemo(
    () => (focusId ? substances.find((x) => x.id === focusId) : undefined),
    [focusId]
  );

  const queueRows = queue.map((id) => {
    const s = substances.find((x) => x.id === id);
    return {
      id,
      nameZh: s?.nameZh || id,
      cas: s?.cas,
      unii: s?.unii,
    };
  });

  const matchedWatch = watch.filter((w) => w.resolved.status === "matched");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="ph-page-hero">
          <h1>工作台</h1>
          <p className="font-latin">
            Workbench · history · watchlist · shortcuts
          </p>
        </div>
        <DemoBadge />
      </div>

      <DisclaimerBanner compact />

      {focusSub ? (
        <section className="ph-card border-teal-200 bg-teal-50/50 p-4 space-y-2">
          <h2 className="text-sm font-semibold text-teal-950">当前实体焦点</h2>
          <p className="text-sm">
            <Link href={`/substances/${focusSub.id}`} className="font-medium text-teal-900 hover:underline">
              {focusSub.nameZh}
            </Link>
            <span className="ml-2 text-xs font-latin text-slate-500">
              {focusSub.id}
              {focusSub.cas ? ` · CAS ${focusSub.cas}` : ""}
              {focusSub.unii ? ` · UNII ${focusSub.unii}` : ""}
            </span>
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link href={`/substances/${focusSub.id}#entity-hub`} className="ph-chip-teal no-underline">实体枢纽</Link>
            <Link href={`/graph?focus=${encodeURIComponent(focusSub.id)}`} className="ph-chip no-underline">杂质图谱</Link>
            <Link href={`/compare?add=${encodeURIComponent(focusSub.id)}`} className="ph-chip no-underline">加入对比</Link>
            <Link href={`/alerts?substance=${encodeURIComponent(focusSub.id)}`} className="ph-chip no-underline">相关预警</Link>
            <Link href={`/search?q=${encodeURIComponent(focusSub.inn || focusSub.nameEn)}&type=drug`} className="ph-chip no-underline">同 INN 成药</Link>
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/search", label: "检索", desc: "药名 / CAS / 杂质" },
          { href: "/compare", label: "对比队列", desc: `队列 ${queue.length}/${COMPARE_QUEUE_MAX}` },
          { href: "/tools/import", label: "CSV 导入", desc: "用户批量扩库" },
          { href: "/tools/index", label: "索引缓存", desc: "草稿 · 晋升说明" },
          { href: "/checklist", label: "核查清单", desc: "市场勾选 · 打印" },
          { href: "/alerts", label: "修订提醒", desc: "影响分析" },
          { href: "/graph", label: "杂质图谱", desc: "物质→杂质" },
          { href: "/watchlist", label: "关注列表", desc: "本地订阅" },
          { href: "/reference-standards", label: "对照品", desc: "RS 目录" },
          { href: "/limits", label: "限度", desc: "ICH 示例" },
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

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
        <h2 className="text-sm font-semibold text-slate-900">检索结果客户端提升</h2>
        <p className="text-xs text-slate-500">
          开启后，/search 在 SSR 命中基础上对关注列表与最近浏览物质做轻量、稳定重排，并显示「关注」徽章。
        </p>
        <label className="flex items-center gap-2 text-sm text-slate-800">
          <input
            type="checkbox"
            checked={boostOn}
            onChange={(e) => {
              const on = e.target.checked;
              setClientBoostEnabled(on);
              setBoostOn(on);
              showToast(on ? "已开启关注/最近提升" : "已关闭客户端提升", "ok");
            }}
          />
          启用关注 / 最近浏览轻量提升
        </label>
      </section>

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
            <ul className="space-y-1.5">
              {queueRows.map((row) => (
                <li key={row.id} className="text-sm">
                  <Link href={`/substances/${row.id}`} className="text-teal-800 hover:underline">
                    {row.nameZh}
                  </Link>
                  <span className="ml-2 text-[11px] font-latin text-slate-400">
                    {row.id}
                    {row.cas ? ` · CAS ${row.cas}` : ""}
                    {row.unii ? ` · UNII ${row.unii}` : ""}
                  </span>
                  <Link
                    href={`/substances/${row.id}#entity-hub`}
                    className="ml-2 text-[11px] text-teal-700 hover:underline"
                  >
                    枢纽
                  </Link>
                </li>
              ))}
            </ul>
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
                <Link href="/alerts" className="text-slate-800 hover:text-teal-800 hover:underline">
                  {e.titleZh}
                </Link>
                {e.relatedSubstanceIds?.[0] ? (
                  <Link
                    href={`/substances/${e.relatedSubstanceIds[0]}`}
                    className="ml-2 text-[11px] text-teal-700 hover:underline"
                  >
                    相关物质 →
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default function WorkbenchPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">加载工作台…</p>}>
      <WorkbenchInner />
    </Suspense>
  );
}
