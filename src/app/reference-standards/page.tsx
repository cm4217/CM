"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  referenceMaterials,
  REFERENCE_MATERIALS_LAST_SYNCED,
} from "@/data";
import { CopyrightBadge } from "@/components/CopyrightBadge";
import { DemoBadge } from "@/components/DemoBadge";
import { DisclaimerBanner } from "@/components/Disclaimer";

export default function ReferenceStandardsPage() {
  const [q, setQ] = useState("");
  const [issuer, setIssuer] = useState<string>("");
  const [hasCas, setHasCas] = useState<"" | "yes" | "no">("");

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return referenceMaterials.filter((r) => {
      if (issuer && r.issuer !== issuer) return false;
      if (hasCas === "yes" && !r.cas) return false;
      if (hasCas === "no" && r.cas) return false;
      if (!n) return true;
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
  }, [q, issuer, hasCas]);

  const syncedLocal = REFERENCE_MATERIALS_LAST_SYNCED
    ? new Date(REFERENCE_MATERIALS_LAST_SYNCED).toLocaleString("zh-CN", {
        timeZone: "Asia/Shanghai",
      }) + " (UTC+8)"
    : "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">对照品目录</h1>
        <p className="mt-1 text-sm text-slate-500 font-latin">
          Reference standards · USP / EDQM / BPCRS-style demo catalog
        </p>
        <p className="mt-1 text-xs text-slate-500">上次同步：{syncedLocal} · sync:rs</p>
      </div>

      <DisclaimerBanner compact />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索对照品名称、目录号、CAS、颁发机构…"
            className="w-full sm:max-w-md rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <DemoBadge />
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-slate-600">来源</span>
            <select value={issuer} onChange={(e) => setIssuer(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
              <option value="">全部</option>
              <option value="USP">USP</option>
              <option value="EDQM">EDQM</option>
              <option value="BPCRS">BPCRS</option>
              <option value="NIFDC">NIFDC</option>
              <option value="other">other</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-slate-600">有 CAS</span>
            <select value={hasCas} onChange={(e) => setHasCas(e.target.value as "" | "yes" | "no")} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
              <option value="">全部</option>
              <option value="yes">是</option>
              <option value="no">否</option>
            </select>
          </label>
          <span className="text-xs text-slate-400 self-center">{filtered.length} / {referenceMaterials.length}</span>
        </div>
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
