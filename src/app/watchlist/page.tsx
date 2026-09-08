"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { substances, impurities } from "@/data";
import { OfficialQueryLinks } from "@/components/OfficialQueryLinks";
import { DemoBadge } from "@/components/DemoBadge";
import { DisclaimerBanner } from "@/components/Disclaimer";
import {
  loadWatchlist,
  saveWatchlist,
  type WatchlistItem,
} from "@/lib/watchlistStorage";
import { expandQueryWithSynonyms } from "@/lib/synonyms";
import { WatchlistDigestPanel } from "@/components/WatchlistDigestPanel";

function coverageOfSubstance(id: string): string {
  const s = substances.find((x) => x.id === id);
  if (!s) return "—";
  const ph = Array.from(new Set(s.monographRefs.map((m) => m.pharmacopoeia)));
  return `${ph.join("/")} · 专论 ${s.monographRefs.length} · 杂质 ${s.relatedImpurityIds.length}`;
}

function resolveLine(raw: string): WatchlistItem["resolved"] {
  const q = raw.trim();
  if (!q) return { status: "unresolved", note: "空行" };
  const terms = expandQueryWithSynonyms(q).map((t) => t.toLowerCase());
  const casLike = /^\d{2,7}-\d{2}-\d$/.test(q);

  for (const s of substances) {
    const fields = [s.nameZh, s.nameEn, s.inn, s.cas, ...s.aliases]
      .filter(Boolean)
      .map((x) => String(x).toLowerCase());
    if (fields.some((f) => terms.some((t) => f === t || f.includes(t)))) {
      return {
        status: "matched",
        kind: "substance",
        id: s.id,
        nameZh: s.nameZh,
        nameEn: s.nameEn,
        inn: s.inn,
        cas: s.cas,
        unii: s.unii,
        coverage: coverageOfSubstance(s.id),
      };
    }
  }
  for (const i of impurities) {
    const fields = [i.nameZh, i.nameEn, i.chemicalName, i.cas]
      .filter(Boolean)
      .map((x) => String(x).toLowerCase());
    if (fields.some((f) => terms.some((t) => f === t || f.includes(t)))) {
      return {
        status: "matched",
        kind: "impurity",
        id: i.id,
        nameZh: i.nameZh,
        nameEn: i.nameEn,
        cas: i.cas,
        unii: i.unii,
        coverage: `杂质 · ${i.type} · 父物质 ${i.parentSubstanceIds.length}`,
      };
    }
  }

  return {
    status: "external",
    nameHint: q,
    cas: casLike ? q : undefined,
    pubchemUrl: `https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(q)}`,
    note: "未收录-仅外链",
  };
}

export default function WatchlistPage() {
  const [text, setText] = useState("阿司匹林\n50-78-2\n布洛芬\nparacetamol\n62-75-9\n");
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setItems(loadWatchlist());
  }, []);

  function persist(next: WatchlistItem[]) {
    setItems(next);
    saveWatchlist(next);
  }

  function parseAndMerge(lines: string[]) {
    const now = new Date().toISOString();
    const existingKeys = new Set(
      items.map((it) => it.query.trim().toLowerCase())
    );
    const added: WatchlistItem[] = [];
    for (const line of lines) {
      const q = line.trim();
      if (!q || existingKeys.has(q.toLowerCase())) continue;
      existingKeys.add(q.toLowerCase());
      added.push({ query: q, resolved: resolveLine(q), addedAt: now });
    }
    if (added.length) persist([...added, ...items]);
  }

  function onImportText() {
    const lines = text.split(/[\r\n]+/);
    parseAndMerge(lines);
  }

  async function onUpload(file: File) {
    setBusy(true);
    try {
      const raw = await file.text();
      const lines = raw.split(/[\r\n,;]+/).map((x) => x.trim()).filter(Boolean);
      // skip header-ish
      const cleaned = lines.filter(
        (l) => !/^(name|药名|cas|drug)$/i.test(l)
      );
      parseAndMerge(cleaned);
    } finally {
      setBusy(false);
    }
  }

  async function enrichExternals() {
    setBusy(true);
    try {
      const next = [...items];
      for (let i = 0; i < next.length; i++) {
        const it = next[i];
        if (it.resolved.status !== "external") continue;
        try {
          const res = await fetch(
            `/api/pubchem/compound?name=${encodeURIComponent(it.query)}`
          );
          if (!res.ok) continue;
          const j = await res.json();
          const cid = j.cid || j.CID;
          if (cid) {
            next[i] = {
              ...it,
              resolved: {
                ...it.resolved,
                status: "external",
                nameHint: j.title || it.resolved.nameHint,
                cas: j.cas || it.resolved.cas,
                pubchemUrl: `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`,
                note: "未收录-仅外链（已解析 PubChem）",
              },
            };
          }
        } catch {
          /* ignore */
        }
      }
      persist(next);
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    const rows = [
      ["query", "status", "nameZh", "nameEn", "cas", "coverage_or_note", "link"],
    ];
    for (const it of items) {
      const r = it.resolved;
      if (r.status === "matched") {
        rows.push([
          it.query,
          "matched",
          r.nameZh,
          r.nameEn,
          r.cas || "",
          r.coverage,
          r.kind === "substance"
            ? `/substances/${r.id}`
            : `/impurities/${r.id}`,
        ]);
      } else if (r.status === "external") {
        rows.push([
          it.query,
          "external",
          r.nameHint,
          "",
          r.cas || "",
          r.note,
          r.pubchemUrl || "",
        ]);
      } else {
        rows.push([it.query, "unresolved", "", "", "", r.note, ""]);
      }
    }
    const csv = rows
      .map((row) =>
        row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `watchlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const stats = useMemo(() => {
    let matched = 0,
      external = 0;
    for (const it of items) {
      if (it.resolved.status === "matched") matched++;
      else if (it.resolved.status === "external") external++;
    }
    return { matched, external, total: items.length };
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">关注列表</h1>
          <p className="mt-1 text-sm text-slate-500 font-latin">
            Watchlist · batch import · localStorage
          </p>
        </div>
        <DemoBadge />
      </div>

      <DisclaimerBanner compact />

      <WatchlistDigestPanel items={items} />

      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
        <h2 className="text-sm font-semibold">批量导入（每行一个药名或 CAS）</h2>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-latin"
        />
        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            onClick={onImportText}
            className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm text-white hover:bg-teal-800"
          >
            解析并加入
          </button>
          <label className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm cursor-pointer hover:bg-slate-50">
            上传 CSV/TXT
            <input
              type="file"
              accept=".csv,.txt,text/plain,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
              }}
            />
          </label>
          <button
            type="button"
            onClick={enrichExternals}
            disabled={busy}
            className="rounded-lg border border-teal-600 px-3 py-1.5 text-sm text-teal-800 disabled:opacity-50"
          >
            对未收录项尝试 PubChem
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!items.length}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            导出 CSV
          </button>
          <button
            type="button"
            onClick={() => persist([])}
            className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm text-rose-700"
          >
            清空
          </button>
        </div>
        <p className="text-xs text-slate-500">
          共 {stats.total} · 命中 {stats.matched} · 未收录外链 {stats.external}
        </p>
      </section>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="prose-table min-w-[800px] text-sm">
          <thead>
            <tr>
              <th>输入</th>
              <th>名称</th>
              <th>CAS</th>
              <th>覆盖 / 说明</th>
              <th>官网查询</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => {
              const r = it.resolved;
              return (
                <tr key={`${it.query}-${idx}`}>
                  <td className="font-latin text-xs">{it.query}</td>
                  <td>
                    {r.status === "matched" ? (
                      <Link
                        href={
                          r.kind === "substance"
                            ? `/substances/${r.id}`
                            : `/impurities/${r.id}`
                        }
                        className="text-teal-800 hover:underline font-medium"
                      >
                        {r.nameZh}{" "}
                        <span className="text-slate-500 font-normal font-latin text-xs">
                          {r.nameEn}
                        </span>
                      </Link>
                    ) : r.status === "external" ? (
                      <span>
                        {r.nameHint}{" "}
                        <span className="text-xs text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                          {r.note}
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-400">{r.note}</span>
                    )}
                  </td>
                  <td className="font-latin text-xs">
                    {r.status === "matched" || r.status === "external"
                      ? r.cas || "—"
                      : "—"}
                  </td>
                  <td className="text-xs text-slate-600">
                    {r.status === "matched"
                      ? r.coverage
                      : r.status === "external"
                        ? r.note
                        : "—"}
                  </td>
                  <td className="min-w-[220px]">
                    {r.status === "matched" ? (
                      <OfficialQueryLinks
                        nameZh={r.nameZh}
                        nameEn={r.nameEn}
                        inn={r.inn}
                        cas={r.cas}
                        unii={r.unii}
                      />
                    ) : r.status === "external" && r.pubchemUrl ? (
                      <a
                        href={r.pubchemUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-teal-700 hover:underline"
                      >
                        PubChem ↗
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="text-xs text-rose-700 hover:underline"
                      onClick={() =>
                        persist(items.filter((_, i) => i !== idx))
                      }
                    >
                      移除
                    </button>
                  </td>
                </tr>
              );
            })}
            {!items.length && (
              <tr>
                <td colSpan={6} className="text-center text-slate-400 py-8">
                  暂无关注项
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
