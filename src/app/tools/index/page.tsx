"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DemoBadge } from "@/components/DemoBadge";
import { SearchBackendChip } from "@/components/SearchBackendChip";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { showToast } from "@/lib/toastBus";
import type { DraftSubstance } from "@/lib/indexTypes";

export default function IndexToolsPage() {
  const [drafts, setDrafts] = useState([] as DraftSubstance[]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/index/draft");
      const json = await res.json();
      setDrafts(json.drafts || []);
    } catch (e) {
      showToast(String((e as Error).message || e), "err");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  async function remove(id: string) {
    const res = await fetch("/api/index/draft?id=" + encodeURIComponent(id), { method: "DELETE" });
    if (!res.ok) { showToast("删除失败", "err"); return; }
    showToast("已删除", "ok");
    void refresh();
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">索引缓存</h1>
          <p className="mt-1 text-sm text-slate-500">缓存草稿 · 身份层</p>
        </div>
        <DemoBadge />
        <SearchBackendChip />
      </div>
      <DisclaimerBanner compact />
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
        <h2 className="text-sm font-semibold">晋升说明</h2>
        <p className="text-sm text-slate-700">草稿仅身份元数据。确认后写入种子或经 CSV 工具合并。开放库请运行 import:open 脚本。</p>
        <p className="text-sm">
          <Link href="/tools/import" className="text-teal-800 hover:underline">CSV 导入</Link>
          {" · "}
          <Link href="/search" className="text-teal-800 hover:underline">检索</Link>
        </p>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex justify-between">
          <h2 className="text-sm font-semibold">缓存草稿（{drafts.length}）</h2>
          <button type="button" onClick={() => void refresh()} className="text-xs border rounded px-2 py-1">刷新</button>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">加载中</p>
        ) : drafts.length === 0 ? (
          <p className="text-sm text-slate-500">暂无草稿</p>
        ) : (
          <ul className="divide-y">
            {drafts.map((d) => (
              <li key={d.id} className="py-3 flex justify-between gap-2">
                <div>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-xs text-slate-500">{d.id}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={"/search?q=" + encodeURIComponent(d.name)} className="text-xs border rounded px-2 py-1">检索</Link>
                  <button type="button" onClick={() => void remove(d.id)} className="text-xs border border-rose-200 text-rose-700 rounded px-2 py-1">删除</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
