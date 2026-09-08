"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ChangeEvent } from "@/lib/types";
import { loadWatchlist } from "@/lib/watchlistStorage";
import { analyzeAlertImpact } from "@/lib/alertImpact";
import { LS_ALERT_KEYWORDS } from "@/lib/storageKeys";

export function AlertImpactPanel({ event }: { event: ChangeEvent }) {
  const [open, setOpen] = useState(false);
  const [keywords, setKeywords] = useState("");

  const hits = useMemo(() => {
    if (!open) return [];
    let kw: string[] = [];
    try {
      const raw =
        keywords ||
        (typeof window !== "undefined"
          ? localStorage.getItem(LS_ALERT_KEYWORDS) || ""
          : "");
      kw = raw
        .split(/[,，、\s]+/)
        .map((x) => x.trim())
        .filter(Boolean);
    } catch {
      /* ignore */
    }
    return analyzeAlertImpact(event, loadWatchlist(), kw);
  }, [open, event, keywords]);

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <button
        type="button"
        onClick={() => {
          try {
            setKeywords(localStorage.getItem(LS_ALERT_KEYWORDS) || "");
          } catch {
            /* ignore */
          }
          setOpen((v) => !v);
        }}
        className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-950 hover:bg-amber-100"
      >
        {open ? "收起影响分析" : "影响分析"}
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-sm space-y-2">
          <p className="text-xs text-slate-600">
            对照本地关注列表名称 / 别名 / CAS 与事件标题、摘要、关键词的重叠。
          </p>
          {hits.length === 0 ? (
            <p className="text-xs text-slate-500">
              未命中关注项。可先在「关注」导入相关药名。
            </p>
          ) : (
            <ul className="space-y-1.5">
              {hits.map((h, i) => (
                <li key={`${h.query}-${i}`}>
                  {h.id ? (
                    <Link
                      href={
                        h.kind === "impurity"
                          ? `/impurities/${h.id}`
                          : `/substances/${h.id}`
                      }
                      className="text-teal-800 hover:underline font-medium"
                    >
                      {h.nameZh}
                    </Link>
                  ) : (
                    <span className="font-medium">{h.nameZh}</span>
                  )}
                  {h.nameEn && (
                    <span className="ml-1 text-xs text-slate-500 font-latin">
                      {h.nameEn}
                    </span>
                  )}
                  <span className="ml-2 text-[11px] text-amber-900">
                    匹配：{h.matchedOn.join(" · ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
