"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { substances } from "@/data";
import { CopyrightBadge } from "@/components/CopyrightBadge";
import { DemoBadge } from "@/components/DemoBadge";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { OfficialQueryLinks } from "@/components/OfficialQueryLinks";
import type { Substance } from "@/lib/types";
import {
  COMPARE_QUEUE_MAX,
  loadCompareQueue,
  removeFromCompareQueue,
  saveCompareQueue,
} from "@/lib/compareQueueStorage";
import {
  diffPharmacopoeias,
  downloadText,
  exportCompareCsv,
  exportCompareMarkdown,
} from "@/lib/compareExport";
import { showToast } from "@/lib/toastBus";

function SubstancePicker({
  label,
  value,
  onChange,
  excludeIds,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  excludeIds?: string[];
}) {
  const [q, setQ] = useState("");
  const options = useMemo(() => {
    const n = q.trim().toLowerCase();
    const excl = new Set(excludeIds || []);
    return substances.filter((s) => {
      if (excl.has(s.id)) return false;
      if (!n) return true;
      const blob = [s.nameZh, s.nameEn, s.inn, s.cas, ...s.aliases]
        .join(" ")
        .toLowerCase();
      return blob.includes(n);
    });
  }, [q, excludeIds]);

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <label className="text-sm font-medium text-slate-800">{label}</label>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="搜索种子物质…"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      >
        <option value="">— 未选择 —</option>
        {options.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nameZh} / {s.nameEn}
            {s.cas ? ` · ${s.cas}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

function CompareColumn({ s }: { s: Substance }) {
  return (
    <div className="space-y-4 min-w-0">
      <div>
        <Link
          href={`/substances/${s.id}`}
          className="text-xl font-bold text-teal-900 hover:underline"
        >
          {s.nameZh}
        </Link>
        <p className="text-sm text-slate-500 font-latin">{s.nameEn}</p>
        <p className="text-xs text-slate-400 font-latin mt-1">
          {[s.inn, s.cas ? `CAS ${s.cas}` : null].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-2">
          <DemoBadge />
        </div>
      </div>
      <OfficialQueryLinks
        nameZh={s.nameZh}
        nameEn={s.nameEn}
        inn={s.inn}
        cas={s.cas}
        unii={s.unii}
        epTextNumber={s.epTextNumber}
        uspDoi={s.uspDoi}
        phIntDocPath={s.phIntDocPath}
      />
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="prose-table min-w-[520px] text-sm">
          <thead>
            <tr>
              <th>药典</th>
              <th>专论 Zh/En</th>
              <th>版本</th>
              <th>效力</th>
              <th>RS</th>
              <th>版权</th>
              <th>官方</th>
            </tr>
          </thead>
          <tbody>
            {s.monographRefs.map((m) => (
              <tr key={m.id}>
                <td className="font-medium text-teal-900">{m.pharmacopoeia}</td>
                <td>
                  <div>{m.monographTitleZh || m.monographTitle}</div>
                  <div className="text-xs text-slate-400 font-latin">
                    {m.monographTitle}
                  </div>
                </td>
                <td className="font-latin text-xs">{m.version}</td>
                <td className="text-xs">{m.efficacy}</td>
                <td>{m.hasRS ? "有" : "—"}</td>
                <td>
                  <CopyrightBadge status={m.copyrightStatus} />
                </td>
                <td>
                  <a
                    href={m.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 hover:underline text-xs"
                  >
                    深链 ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        仅公开元数据索引，不含接受标准数值或专论全文。
      </p>
    </div>
  );
}

export default function ComparePage() {
  const [queue, setQueue] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [a, setA] = useState("sub-aspirin");
  const [b, setB] = useState("sub-ibuprofen");

  useEffect(() => {
    const q = loadCompareQueue();
    setQueue(q);
    if (q.length >= 1) {
      setSelected(q.slice(0, COMPARE_QUEUE_MAX));
      setA(q[0]);
      if (q[1]) setB(q[1]);
    }
  }, []);

  const selectedSubs = useMemo(() => {
    const ids =
      selected.length >= 2
        ? selected
        : [a, b].filter(Boolean);
    return ids
      .map((id) => substances.find((s) => s.id === id))
      .filter(Boolean) as Substance[];
  }, [selected, a, b]);

  const sa = substances.find((s) => s.id === a);
  const sb = substances.find((s) => s.id === b);
  const diffs = diffPharmacopoeias(selectedSubs);

  function refreshQueue() {
    setQueue(loadCompareQueue());
  }

  function toggleQueuePick(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= COMPARE_QUEUE_MAX) {
        showToast(`最多对比 ${COMPARE_QUEUE_MAX} 个`, "warn");
        return prev;
      }
      return [...prev, id];
    });
  }

  function applyQueueToPickers() {
    if (selected.length < 1) {
      showToast("请先从队列勾选物质", "warn");
      return;
    }
    setA(selected[0]);
    setB(selected[1] || "");
    showToast("已应用到对比区");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">跨药典对比工作台</h1>
          <p className="mt-1 text-sm text-slate-500 font-latin">
            Compare · queue · diff highlight · export
          </p>
        </div>
        <DemoBadge />
      </div>

      <DisclaimerBanner />

      <section className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-indigo-950">
            对比队列（localStorage，最多 {COMPARE_QUEUE_MAX}）
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={applyQueueToPickers}
              className="rounded-lg bg-indigo-700 px-3 py-1.5 text-xs text-white hover:bg-indigo-800"
            >
              用勾选填充对比
            </button>
            <button
              type="button"
              onClick={() => {
                saveCompareQueue([]);
                setQueue([]);
                setSelected([]);
                showToast("已清空对比队列");
              }}
              className="rounded-lg border border-indigo-300 px-3 py-1.5 text-xs text-indigo-900"
            >
              清空队列
            </button>
          </div>
        </div>
        {queue.length === 0 ? (
          <p className="text-sm text-slate-600">
            队列为空。在检索结果卡片点击「加入对比」，或下方手动选择。
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {queue.map((id) => {
              const s = substances.find((x) => x.id === id);
              if (!s) return null;
              const checked = selected.includes(id);
              return (
                <li
                  key={id}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    checked
                      ? "border-indigo-400 bg-white"
                      : "border-slate-200 bg-white/70"
                  }`}
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleQueuePick(id)}
                    />
                    <span>
                      {s.nameZh}{" "}
                      <span className="text-xs text-slate-500 font-latin">
                        {s.nameEn}
                      </span>
                    </span>
                  </label>
                  <button
                    type="button"
                    className="text-xs text-rose-700 hover:underline"
                    onClick={() => {
                      removeFromCompareQueue(id);
                      setSelected((prev) => prev.filter((x) => x !== id));
                      refreshQueue();
                    }}
                  >
                    移除
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <SubstancePicker
          label="物质 A（必选）"
          value={a}
          onChange={setA}
          excludeIds={b ? [b] : []}
        />
        <SubstancePicker
          label="物质 B（可选）"
          value={b}
          onChange={setB}
          excludeIds={a ? [a] : []}
        />
      </div>

      {selectedSubs.length >= 2 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-amber-950">
              差集高亮 · 药典有无对照
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs hover:bg-slate-50"
                onClick={() => {
                  downloadText(
                    `compare-${new Date().toISOString().slice(0, 10)}.csv`,
                    exportCompareCsv(selectedSubs),
                    "text/csv;charset=utf-8"
                  );
                  showToast("已导出 CSV");
                }}
              >
                导出对比 CSV
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs hover:bg-slate-50"
                onClick={() => {
                  downloadText(
                    `compare-${new Date().toISOString().slice(0, 10)}.md`,
                    exportCompareMarkdown(selectedSubs),
                    "text/markdown;charset=utf-8"
                  );
                  showToast("已导出 Markdown");
                }}
              >
                导出对比 Markdown
              </button>
              <button
                type="button"
                className="rounded-lg border border-teal-600 px-3 py-1.5 text-xs text-teal-800"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      exportCompareMarkdown(selectedSubs)
                    );
                    showToast("已复制 Markdown");
                  } catch {
                    showToast("复制失败", "err");
                  }
                }}
              >
                复制 Markdown
              </button>
            </div>
          </div>
          {diffs.length === 0 ? (
            <p className="text-sm text-slate-600">
              所选物质药典覆盖完全一致（或仅选 1 个）。
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {diffs.map((d) => (
                <li
                  key={d.code}
                  className="rounded-lg border border-amber-200 bg-white px-3 py-2"
                >
                  <span className="font-latin font-semibold text-amber-900">
                    {d.code}
                  </span>
                  <span className="ml-2 text-emerald-800">
                    有：{d.present.join("、")}
                  </span>
                  <span className="ml-2 text-rose-800">
                    无：{d.absent.join("、")}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="overflow-x-auto">
            <table className="prose-table min-w-[480px] text-xs">
              <thead>
                <tr>
                  <th>药典</th>
                  {selectedSubs.map((s) => (
                    <th key={s.id}>{s.nameZh}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    "ChP",
                    "USP",
                    "EP",
                    "JP",
                    "BP",
                    "IP",
                    "Ph.Int.",
                  ] as const
                ).map((code) => {
                  const present = selectedSubs.filter((s) =>
                    s.monographRefs.some((m) => m.pharmacopoeia === code)
                  );
                  const isDiff =
                    present.length > 0 && present.length < selectedSubs.length;
                  return (
                    <tr
                      key={code}
                      className={isDiff ? "bg-amber-100/80" : undefined}
                    >
                      <td className="font-latin font-medium">{code}</td>
                      {selectedSubs.map((s) => {
                        const has = s.monographRefs.some(
                          (m) => m.pharmacopoeia === code
                        );
                        return (
                          <td
                            key={s.id}
                            className={
                              isDiff
                                ? has
                                  ? "text-emerald-800 font-medium"
                                  : "text-rose-800 font-medium"
                                : ""
                            }
                          >
                            {has ? "有" : "无"}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!sa ? (
        <p className="text-sm text-slate-500">请选择至少一个物质。</p>
      ) : (
        <div className={`grid gap-8 ${sb ? "lg:grid-cols-2" : "grid-cols-1"}`}>
          <CompareColumn s={sa} />
          {sb && <CompareColumn s={sb} />}
        </div>
      )}
    </div>
  );
}
