"use client";

import Link from "next/link";
import type { SearchHit } from "@/lib/types";
import { deriveScore, HERO_SCORE_MARGIN } from "@/lib/search/confidence";
import { addToCompareQueue } from "@/lib/compareQueueStorage";
import { showToast } from "@/lib/toastBus";

type Props = {
  hits: SearchHit[];
  /** Force show even if margin large */
  force?: boolean;
};

/** Mini-compare top2 when scores are close (SERP strip). */
export function SearchMiniCompare({ hits, force = false }: Props) {
  const a = hits[0];
  const b = hits[1];
  if (!a || !b) return null;
  if (a.kind !== "substance" || b.kind !== "substance") return null;

  const s1 = deriveScore(a);
  const s2 = deriveScore(b);
  const margin = s1 - s2;
  if (!force && margin >= HERO_SCORE_MARGIN) return null;

  const pharmas = (h: SearchHit) => h.pharmacopoeias || [];
  const allCodes = Array.from(
    new Set([...pharmas(a), ...pharmas(b)])
  ).slice(0, 8);

  return (
    <section
      aria-label="接近结果快比"
      className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 shadow-sm print:border-slate-300 print:bg-white"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-amber-950">
          接近结果快比
          <span className="ml-2 text-xs font-normal text-amber-800/80 font-latin">
            Δscore {margin.toFixed(0)}
          </span>
        </h2>
        <button
          type="button"
          className="rounded-lg border border-indigo-400 bg-white px-2.5 py-1 text-xs font-medium text-indigo-800 hover:bg-indigo-50 print:hidden"
          onClick={() => {
            const r1 = addToCompareQueue(a.id);
            const r2 = addToCompareQueue(b.id);
            showToast(
              r2.ok || r1.ok ? "已加入对比队列" : r2.message || r1.message,
              r2.ok || r1.ok ? "ok" : "warn"
            );
          }}
        >
          两者加入对比
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {[a, b].map((h, idx) => (
          <div
            key={`${h.kind}-${h.id}`}
            className="rounded-lg border border-amber-100 bg-white p-2.5"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 font-latin">
              #{idx + 1} · {h.matchTier || "—"} · {deriveScore(h).toFixed(0)}
            </p>
            <Link
              href={`/substances/${h.id}`}
              className="mt-0.5 block text-sm font-semibold text-slate-900 no-underline hover:text-teal-800"
            >
              {h.titleZh}
            </Link>
            <p className="text-xs text-slate-500 font-latin">{h.titleEn}</p>
            <p className="mt-1 text-[11px] text-slate-600 font-latin">
              {h.cas ? `CAS ${h.cas}` : "无 CAS"}
              {h.unii ? ` · UNII ${h.unii}` : ""}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {allCodes.map((c) => {
                const on = pharmas(h).includes(c);
                return (
                  <span
                    key={c}
                    className={
                      on
                        ? "rounded bg-teal-50 px-1.5 py-0.5 text-[10px] text-teal-900 font-latin"
                        : "rounded bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400 font-latin"
                    }
                  >
                    {on ? "✓" : "–"} {c}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-amber-900/70">
        分差较小，建议人工确认 · 仅元数据对照，非法定正文
      </p>
    </section>
  );
}
