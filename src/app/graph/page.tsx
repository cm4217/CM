"use client";

import { useMemo, useState } from "react";
import { substances, impurities } from "@/data";
import { ImpurityGraph } from "@/components/ImpurityGraph";
import { DemoBadge } from "@/components/DemoBadge";
import { DisclaimerBanner } from "@/components/Disclaimer";

export default function GraphPage() {
  const [focus, setFocus] = useState<string>("");
  const [gsrsNote, setGsrsNote] = useState<string | null>(null);
  const [gsrsBusy, setGsrsBusy] = useState(false);

  const focusSub = useMemo(
    () => substances.find((s) => s.id === focus),
    [focus]
  );

  async function tryGsrs() {
    if (!focusSub?.unii && !focusSub?.nameEn) {
      setGsrsNote("请先选择含 UNII/英文名的物质");
      return;
    }
    setGsrsBusy(true);
    setGsrsNote(null);
    try {
      const q = focusSub.unii || focusSub.nameEn;
      const res = await fetch(`/api/gsrs/search?q=${encodeURIComponent(q)}`);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "GSRS 请求失败");
      const n = Array.isArray(j.results) ? j.results.length : j.content?.length || 0;
      setGsrsNote(
        `GSRS 公开检索返回约 ${n} 条（可选富化；图谱仍以本地种子关系为准）。`
      );
    } catch (e) {
      setGsrsNote(`GSRS 可选拉取失败：${String((e as Error).message || e)}（不影响本地图谱）`);
    } finally {
      setGsrsBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">杂质关系图谱</h1>
          <p className="mt-1 text-sm text-slate-500 font-latin">
            Parent substance → impurities
          </p>
        </div>
        <DemoBadge />
      </div>

      <DisclaimerBanner compact />

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-slate-600">聚焦物质</span>
          <select
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1.5"
          >
            <option value="">全部</option>
            {substances.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nameZh}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={tryGsrs}
          disabled={gsrsBusy || !focus}
          className="rounded-lg border border-teal-600 px-3 py-1.5 text-teal-800 hover:bg-teal-50 disabled:opacity-50"
        >
          {gsrsBusy ? "拉取中…" : "可选：GSRS 关系探测"}
        </button>
      </div>
      {gsrsNote && (
        <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          {gsrsNote}
        </p>
      )}

      <ImpurityGraph
        substances={substances}
        impurities={impurities}
        focusSubstanceId={focus || undefined}
      />
    </div>
  );
}
