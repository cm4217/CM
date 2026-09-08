"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { substances } from "@/data";
import { CopyrightBadge } from "@/components/CopyrightBadge";
import { DemoBadge } from "@/components/DemoBadge";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { OfficialQueryLinks } from "@/components/OfficialQueryLinks";
import type { Substance } from "@/lib/types";

function SubstancePicker({
  label,
  value,
  onChange,
  excludeId,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  excludeId?: string;
}) {
  const [q, setQ] = useState("");
  const options = useMemo(() => {
    const n = q.trim().toLowerCase();
    return substances.filter((s) => {
      if (excludeId && s.id === excludeId) return false;
      if (!n) return true;
      const blob = [s.nameZh, s.nameEn, s.inn, s.cas, ...s.aliases]
        .join(" ")
        .toLowerCase();
      return blob.includes(n);
    });
  }, [q, excludeId]);

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
  const [a, setA] = useState("sub-aspirin");
  const [b, setB] = useState("sub-ibuprofen");

  const sa = substances.find((s) => s.id === a);
  const sb = substances.find((s) => s.id === b);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">跨药典对比工作台</h1>
          <p className="mt-1 text-sm text-slate-500 font-latin">
            Compare · public monograph metadata only
          </p>
        </div>
        <DemoBadge />
      </div>

      <DisclaimerBanner />

      <div className="grid gap-4 sm:grid-cols-2">
        <SubstancePicker label="物质 A（必选）" value={a} onChange={setA} excludeId={b} />
        <SubstancePicker label="物质 B（可选）" value={b} onChange={setB} excludeId={a} />
      </div>

      {!sa ? (
        <p className="text-sm text-slate-500">请选择至少一个物质。</p>
      ) : (
        <div
          className={`grid gap-8 ${sb ? "lg:grid-cols-2" : "grid-cols-1"}`}
        >
          <CompareColumn s={sa} />
          {sb && <CompareColumn s={sb} />}
        </div>
      )}
    </div>
  );
}
