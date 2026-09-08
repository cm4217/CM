"use client";

import { useEffect, useMemo, useState } from "react";
import { changeEvents, alertSources } from "@/data";
import { AlertCard } from "@/components/AlertCard";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { DemoBadge } from "@/components/DemoBadge";

export default function AlertsPage() {
  const [source, setSource] = useState<string>("");
  const [apiSources, setApiSources] = useState<typeof alertSources | null>(null);

  useEffect(() => {
    fetch("/api/alerts/sources")
      .then((r) => r.json())
      .then((j) => setApiSources(j.sources || null))
      .catch(() => setApiSources(null));
  }, []);

  const sources = apiSources || alertSources;

  const events = useMemo(() => {
    return [...changeEvents]
      .filter((e) => {
        if (!source) return true;
        if (e.sourceKey === source) return true;
        if (String(e.pharmacopoeia) === source) return true;
        return false;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [source]);

  const filterKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const e of changeEvents) {
      if (e.sourceKey) keys.add(e.sourceKey);
      keys.add(String(e.pharmacopoeia));
    }
    return Array.from(keys).sort();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">修订提醒时间线</h1>
          <p className="mt-1 text-sm text-slate-500 font-latin">
            Revision alerts · sample ChangeEvents
          </p>
        </div>
        <DemoBadge />
      </div>

      <DisclaimerBanner />

      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">订阅说明</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          当前展示本地示例 ChangeEvents，并列出官方公告/目录深链。后续可通过 RSS 或 cron 拉取公开更新元数据；
          <strong>不抓取</strong> USP/EP/BP 等付费专论正文。CORS 安全的公开 feed 若可用可在客户端可选接入，否则保持本地数据 + 外链。
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
