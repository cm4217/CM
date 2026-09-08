"use client";

import Link from "next/link";
import { addToCompareQueue } from "@/lib/compareQueueStorage";
import { addSubstanceToWatchlist } from "@/lib/watchlistActions";
import { showToast } from "@/lib/toastBus";

export function SearchCardActions({
  substanceId,
  nameZh,
  cas,
}: {
  substanceId: string;
  nameZh?: string;
  cas?: string;
}) {
  const btn =
    "rounded-lg border bg-white px-2.5 py-1 text-xs font-medium " +
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={`${btn} border-teal-600 text-teal-800 hover:bg-teal-50`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const r = addSubstanceToWatchlist(substanceId);
          showToast(r.message, r.ok ? "ok" : "err");
        }}
      >
        加关注
      </button>
      <button
        type="button"
        className={`${btn} border-indigo-500 text-indigo-800 hover:bg-indigo-50`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const r = addToCompareQueue(substanceId);
          showToast(r.message, r.ok ? "ok" : "warn");
        }}
      >
        加入对比
      </button>
      <Link
        href={`/substances/${encodeURIComponent(substanceId)}/compendial`}
        className={`${btn} border-sky-500 text-sky-900 hover:bg-sky-50 no-underline`}
        onClick={(e) => e.stopPropagation()}
      >
        详细对照
      </Link>
      <Link
        href={`/checklist?substance=${encodeURIComponent(substanceId)}`}
        className={`${btn} border-slate-300 text-slate-800 hover:bg-slate-50 no-underline`}
        onClick={(e) => e.stopPropagation()}
      >
        核查清单
      </Link>
      {nameZh ? (
        <button
          type="button"
          className={`${btn} border-slate-200 text-slate-600 hover:bg-slate-50`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void (async () => {
              try {
                await navigator.clipboard.writeText(nameZh);
                showToast(`已复制：${nameZh}`, "ok");
              } catch {
                showToast("复制失败", "err");
              }
            })();
          }}
        >
          复制中文名
        </button>
      ) : null}
      {cas ? (
        <button
          type="button"
          className={`${btn} border-slate-200 text-slate-600 hover:bg-slate-50 font-latin`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void (async () => {
              try {
                await navigator.clipboard.writeText(cas);
                showToast(`已复制 CAS：${cas}`, "ok");
              } catch {
                showToast("复制失败", "err");
              }
            })();
          }}
        >
          复制 CAS
        </button>
      ) : null}
    </div>
  );
}
