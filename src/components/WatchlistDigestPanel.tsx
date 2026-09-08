"use client";

import { useMemo, useState } from "react";
import {
  buildWatchlistDigest,
  type DigestScope,
} from "@/lib/watchlistDigest";
import type { WatchlistItem } from "@/lib/watchlistStorage";
import { loadWatchlist } from "@/lib/watchlistStorage";

type Props = {
  /** If omitted, load from localStorage on generate */
  items?: WatchlistItem[];
  className?: string;
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob(["\ufeff" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function WatchlistDigestPanel({ items, className }: Props) {
  const [scope, setScope] = useState<DigestScope>("all");
  const [preview, setPreview] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ matched: number; used: DigestScope } | null>(
    null
  );
  const [copied, setCopied] = useState(false);

  const sourceItems = useMemo(() => items ?? [], [items]);

  function generate() {
    const list = items ?? loadWatchlist();
    const result = buildWatchlistDigest(list, scope);
    setPreview(result.markdown);
    setMeta({ matched: result.matchedEvents, used: result.usedScope });
    setCopied(false);
  }

  return (
    <section
      className={`rounded-xl border border-teal-200 bg-teal-50/30 p-4 space-y-3 shadow-sm ${className || ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-teal-950">生成关注摘要</h2>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label className="flex items-center gap-1 text-slate-700">
            <input
              type="radio"
              name="digest-scope"
              checked={scope === "week"}
              onChange={() => setScope("week")}
            />
            本周
          </label>
          <label className="flex items-center gap-1 text-slate-700">
            <input
              type="radio"
              name="digest-scope"
              checked={scope === "all"}
              onChange={() => setScope("all")}
            />
            全部关注 × 当前通告库
          </label>
        </div>
      </div>
      <p className="text-xs text-slate-600">
        将关注列表与修订通告按名称/关键词交叉匹配，生成中文 Markdown
        摘要（覆盖摘要 + 通告 + 官网提醒）。数据存于 localStorage。
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={generate}
          className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm text-white hover:bg-teal-800"
        >
          生成关注摘要
        </button>
        {preview && (
          <>
            <button
              type="button"
              onClick={async () => {
                const ok = await copyText(preview);
                setCopied(ok);
              }}
              className="rounded-lg border border-teal-600 px-3 py-1.5 text-sm text-teal-800 hover:bg-teal-50"
            >
              {copied ? "已复制" : "复制到剪贴板"}
            </button>
            <button
              type="button"
              onClick={() =>
                download(
                  `watchlist-digest-${new Date().toISOString().slice(0, 10)}.md`,
                  preview,
                  "text/markdown;charset=utf-8"
                )
              }
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-white"
            >
              下载 .md
            </button>
            <button
              type="button"
              onClick={() =>
                download(
                  `watchlist-digest-${new Date().toISOString().slice(0, 10)}.txt`,
                  preview.replace(/^#+ /gm, "").replace(/\*\*/g, ""),
                  "text/plain;charset=utf-8"
                )
              }
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-white"
            >
              下载 .txt
            </button>
          </>
        )}
      </div>
      {meta && (
        <p className="text-xs text-slate-500">
          匹配通告 {meta.matched} 次 · 实际范围：
          {meta.used === "week" ? "本周" : "全部通告库"}
          {sourceItems.length > 0 ? ` · 关注 ${sourceItems.length}` : ""}
        </p>
      )}
      {preview && (
        <pre className="max-h-80 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-800 whitespace-pre-wrap font-latin leading-relaxed">
          {preview}
        </pre>
      )}
    </section>
  );
}
