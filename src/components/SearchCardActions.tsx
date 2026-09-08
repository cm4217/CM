"use client";

import { addToCompareQueue } from "@/lib/compareQueueStorage";
import { addSubstanceToWatchlist } from "@/lib/watchlistActions";
import { showToast } from "@/lib/toastBus";

export function SearchCardActions({
  substanceId,
}: {
  substanceId: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="rounded-lg border border-teal-600 bg-white px-2.5 py-1 text-xs font-medium text-teal-800 hover:bg-teal-50"
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
        className="rounded-lg border border-indigo-500 bg-white px-2.5 py-1 text-xs font-medium text-indigo-800 hover:bg-indigo-50"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const r = addToCompareQueue(substanceId);
          showToast(r.message, r.ok ? "ok" : "warn");
        }}
      >
        加入对比
      </button>
    </div>
  );
}
