"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { referenceMaterials } from "@/data";
import { CopyrightBadge } from "@/components/CopyrightBadge";
import { DemoBadge } from "@/components/DemoBadge";
import { DisclaimerBanner } from "@/components/Disclaimer";

export default function ReferenceStandardsPage() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return referenceMaterials;
    return referenceMaterials.filter((r) => {
      const blob = [
        r.nameZh,
        r.nameEn,
        r.catalogCode,
        r.issuer,
        r.cas || "",
        r.notes || "",
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(n);
    });
  }, [q]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">对照品目录</h1>
        <p className="mt-1 text-sm text-slate-500 font-latin">
          Reference standards · USP / EDQM / BPCRS-style demo catalog
        </p>
      </div>

      <DisclaimerBanner compact />

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索对照品名称、目录号、CAS、颁发机构…"
          className="w-full sm:max-w-md rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
        <DemoBadge />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="prose-table min-w-[900px]">
          <thead>
            <tr>
              <th>目录号</th>
              <th>名称</th>
              <th>颁发</th>
              <th>CAS</th>
              <th>状态</th>
              <th>关联</th>
              <th>版权</th>
              <th>官方</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} id={r.id}>
                <td className="font-latin text-xs whitespace-nowrap">{r.catalogCode}</td>
                <td>
                  <div className="font-medium">{r.nameZh}</div>
                  <div className="text-xs text-slate-400 font-latin">{r.nameEn}</div>
                </td>
                <td className="font-latin">{r.issuer}</td>
                <td className="font-latin text-xs">{r.cas || "—"}</td>
                <td className="text-xs">{r.status}</td>
                <td className="text-xs space-y-1">
                  {r.linkedSubstanceId && (
                    <div>
                      <Link
                        href={`/substances/${r.linkedSubstanceId}`}
                        className="text-teal-700 hover:underline"
                      >
                        物质
                      </Link>
                    </div>
                  )}
                  {r.linkedImpurityId && (
                    <div>
                      <Link
                        href={`/impurities/${r.linkedImpurityId}`}
                        className="text-teal-700 hover:underline"
                      >
                        杂质
                      </Link>
                    </div>
                  )}
                  {!r.linkedSubstanceId && !r.linkedImpurityId && "—"}
                </td>
                <td>
                  <CopyrightBadge status={r.copyrightStatus} />
                </td>
                <td>
                  {r.officialUrl ? (
                    <a
                      href={r.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-700 hover:underline text-xs"
                    >
                      ↗
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        目录号均为示例虚构，非正式订购信息。请通过 USP / EDQM / BP 官方渠道核验。
      </p>
    </div>
  );
}
