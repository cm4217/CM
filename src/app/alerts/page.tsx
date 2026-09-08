"use client";

import { useEffect, useMemo, useState } from "react";
import { alertSources } from "@/data";
import type { ChangeEvent } from "@/lib/types";
import { LS_ALERT_KEYWORDS, LS_ALERT_WATCH_TYPES } from "@/lib/storageKeys";
import { AlertCard } from "@/components/AlertCard";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { DemoBadge } from "@/components/DemoBadge";

export default function AlertsPage() {
  const [source, setSource] = useState<string>("");
  const [apiSources, setApiSources] = useState<typeof alertSources | null>(null);
  const [apiEvents, setApiEvents] = useState<ChangeEvent[]>([]);
  const [lastChecked, setLastChecked] = useState<string>("—");
  const [keywords, setKeywords] = useState("");
  const [watchTypes, setWatchTypes] = useState<string[]>(["critical", "watch", "info"]);

  useEffect(() => {
    try {
      const k = localStorage.getItem(LS_ALERT_KEYWORDS);
      if (k) setKeywords(k);
      const w = localStorage.getItem(LS_ALERT_WATCH_TYPES);
      if (w) setWatchTypes(JSON.parse(w));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const qs = source ? ("?source=" + encodeURIComponent(source)) : "";
    fetch("/api/alerts" + qs)
      .then((r) => r.json())
      .then((j) => {
        setApiSources(j.sources || null);
        setApiEvents(j.events || []);
        if (j.lastChecked) setLastChecked(j.lastChecked);
      })
      .catch(() => {
        setApiSources(null);
        setApiEvents([]);
      });
  }, [source]);

  const sources = apiSources || alertSources;

  const events = useMemo(() => {
    return apiEvents.filter((e) => !watchTypes.length || watchTypes.includes(e.severity));
  }, [apiEvents, watchTypes]);

  const filterKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const e of apiEvents) {
      if (e.sourceKey) keys.add(e.sourceKey);
      keys.add(String(e.pharmacopoeia));
    }
    for (const s of sources) keys.add(s.key);
    return Array.from(keys).sort();
  }, [apiEvents, sources]);

  const keywordList = keywords.split(/[,，、\s]+/).map((x) => x.trim()).filter(Boolean);
  const lastCheckedLocal = lastChecked !== "—"
    ? new Date(lastChecked).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }) + " UTC+8"
    : "—";

  function saveKeywords(v: string) {
    setKeywords(v);
    localStorage.setItem(LS_ALERT_KEYWORDS, v);
  }
  function toggleWatchType(key: string) {
    setWatchTypes((prev) => {
      const next = prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key];
      localStorage.setItem(LS_ALERT_WATCH_TYPES, JSON.stringify(next));
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">修订提醒时间线</h1>
          <p className="mt-1 text-sm text-slate-500 font-latin">
            Revision alerts · real watch
          </p>
          <p className="mt-1 text-xs text-slate-500">
            上次检查：{lastCheckedLocal}
          </p>
        </div>
        <DemoBadge />
      </div>

      <DisclaimerBanner />

      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">订阅说明</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          合并本地种子与 fetch:alerts 生成数据，并列出官方公告/目录深链。
          <strong>不抓取</strong> USP/EP/BP 等付费专论正文。网络不可用时保留富化种子。
        </p>
        <ul className="grid gap-2 sm:grid-cols-2 text-xs">
          {sources.map((s) => (
            <li key={s.key} className="rounded-lg border border-slate-100 px-3 py-2">
              <div className="font-medium text-slate-800">{s.nameZh}</div>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-teal-700 hover:underline break-all">
                {s.url}
              </a>
              <p className="mt-1 text-slate-500">{s.notesZh}</p>
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-400 font-latin">GET /api/alerts/sources</p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
        <h2 className="text-sm font-semibold">关注的通告类型</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          {(["critical","watch","info"] as const).map((key) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={watchTypes.includes(key)}
                onChange={() => toggleWatchType(key)}
              />
              {key === "critical" ? "重要" : key === "watch" ? "关注" : "提示"}
            </label>
          ))}
        </div>
        <label className="block text-sm">
          <span className="text-slate-600">订阅关键词（本地高亮）</span>
          <input
            value={keywords}
            onChange={(e) => saveKeywords(e.target.value)}
            placeholder="亚硝胺, NDMA, CRS"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        {keywordList.length > 0 && (
          <p className="text-xs text-slate-500">当前关键词：{keywordList.join(" · ")}</p>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-slate-600">来源筛选</span>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1.5"
          >
            <option value="">全部</option>
            {filterKeys.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <span className="text-xs text-slate-400">{events.length} 条</span>
      </div>

      <ol className="relative space-y-4 border-l-2 border-teal-200 ml-3 pl-6">
        {events.map((e) => (
          <li key={e.id} className="relative">
            <span className="absolute -left-[1.9rem] top-5 h-3 w-3 rounded-full bg-teal-600 ring-4 ring-teal-50" />
            <AlertCard event={e} />
          </li>
        ))}
      </ol>
    </div>
  );
}
