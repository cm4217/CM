"use client";

import Link from "next/link";
import { addSubstanceToWatchlist } from "@/lib/watchlistActions";
import { addToCompareQueue } from "@/lib/compareQueueStorage";
import { showToast } from "@/lib/toastBus";

export function SubstanceQuickActions({
  substanceId,
  nameZh,
}: {
  substanceId: string;
  nameZh: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="rounded-lg border border-teal-600 bg-white px-2.5 py-1 text-xs font-medium text-teal-800 hover:bg-teal-50"
        onClick={() => {
          const r = addSubstanceToWatchlist(substanceId);
          showToast(r.message, r.ok ? "ok" : "err");
        }}
      >
        加关注
      </button>
      <button
        type="button"
        className="rounded-lg border border-indigo-500 bg-white px-2.5 py-1 text-xs font-medium text-indigo-800 hover:bg-indigo-50"
        onClick={() => {
          const r = addToCompareQueue(substanceId);
          showToast(r.message, r.ok ? "ok" : "warn");
        }}
      >
        加入对比
      </button>
      <Link
        href={`/checklist?substance=${encodeURIComponent(substanceId)}`}
        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50"
      >
        核查清单
      </Link>
      <span className="self-center text-[11px] text-slate-400">
        快捷键 c 复制「{nameZh}」
      </span>
    </div>
  );
}
