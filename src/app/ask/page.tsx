"use client";

import { useState } from "react";
import Link from "next/link";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { DemoBadge } from "@/components/DemoBadge";

type Hit = {
  kind: string;
  id: string;
  titleZh: string;
  titleEn?: string;
  snippetZh: string;
  href: string;
  score: number;
  officialUrls?: { label: string; url: string }[];
};

const SUGGESTIONS = [
  "阿司匹林有哪些杂质？",
  "NDMA 限值",
  "布洛芬对照品",
  "ICH Q3C 甲醇",
  "亚硝胺修订提醒",
];

export default function AskPage() {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [phrasedBy, setPhrasedBy] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(question?: string) {
    const query = (question ?? q).trim();
    if (!query) return;
    setQ(query);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: query }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "问答失败");
      setAnswer(j.answer || "");
      setHits(j.hits || []);
      setPhrasedBy(j.phrasedBy || "local");
    } catch (e) {
      setError(String((e as Error).message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">智能问答</h1>
          <p className="mt-1 text-sm text-slate-500">
            仅基于站内索引与公开监管表，不替代药典正文
          </p>
        </div>
        <DemoBadge />
      </div>

      <DisclaimerBanner />

      <aside className="rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-3 text-sm text-indigo-950">
        MVP 默认使用本地关键词检索（无需 API Key）。若设置{" "}
        <code className="font-latin text-xs">OPENAI_API_KEY</code> 或{" "}
        <code className="font-latin text-xs">ANTHROPIC_API_KEY</code>
        ，将仅基于检索片段润色回答，不会编造专论限度。
      </aside>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <textarea
          value={q}
          onChange={(e) => setQ(e.target.value)}
          rows={3}
          placeholder="例如：NDMA 的示例限值是多少？阿司匹林相关杂质有哪些？"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              className="text-xs rounded-full border border-slate-200 px-3 py-1 hover:bg-teal-50 hover:border-teal-300"
            >
              {s}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => ask()}
          disabled={loading || !q.trim()}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {loading ? "检索中…" : "提问"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {answer && (
        <div className="space-y-4">
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap gap-2 text-xs mb-2">
              <span className="rounded bg-slate-100 px-2 py-0.5">回答</span>
              <span className="rounded bg-teal-50 text-teal-900 px-2 py-0.5 font-latin">
                {phrasedBy}
              </span>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-slate-800 font-sans leading-relaxed">
              {answer}
            </pre>
          </article>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-800">引用 / Citations</h2>
            <ul className="space-y-2">
              {hits.map((h) => (
                <li
                  key={`${h.kind}-${h.id}`}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                      {h.kind}
                    </span>
                    <Link href={h.href} className="text-teal-800 hover:underline font-medium">
                      {h.titleZh}
                    </Link>
                    <span className="text-xs text-slate-400 font-latin">
                      score {h.score}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{h.snippetZh}</p>
                  {h.officialUrls && h.officialUrls.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-2">
                      {h.officialUrls.map((u) => (
                        <a
                          key={u.url}
                          href={u.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-slate-500 hover:text-teal-700"
                        >
                          {u.label} ↗
                        </a>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
