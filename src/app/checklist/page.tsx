"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  getImpurity,
  getReferenceMaterial,
  substances,
} from "@/data";
import { DemoBadge } from "@/components/DemoBadge";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { buildOfficialQueryLinks } from "@/lib/officialQueryLinks";
import type { PharmacopoeiaCode } from "@/lib/types";
import { showToast } from "@/lib/toastBus";
import {
  resolveEpIdStatus,
  resolvePhIntIdStatus,
  resolveUspDoiStatus,
} from "@/lib/provenance";
import { IdStatusBadge } from "@/components/ProvenanceBadge";

const MARKET_OPTS: { code: PharmacopoeiaCode; label: string }[] = [
  { code: "ChP", label: "ChP 中国药典" },
  { code: "USP", label: "USP" },
  { code: "EP", label: "EP / Ph. Eur." },
  { code: "JP", label: "JP" },
  { code: "BP", label: "BP" },
];

function ChecklistInner() {
  const sp = useSearchParams();
  const initialId = sp.get("substance") || "sub-aspirin";
  const [substanceId, setSubstanceId] = useState(initialId);
  const [markets, setMarkets] = useState<PharmacopoeiaCode[]>([
    "ChP",
    "USP",
    "EP",
  ]);
  const [q, setQ] = useState("");

  useEffect(() => {
    const id = sp.get("substance");
    if (id) setSubstanceId(id);
  }, [sp]);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return substances;
    return substances.filter((s) => {
      const blob = [s.nameZh, s.nameEn, s.inn, s.cas, ...s.aliases]
        .join(" ")
        .toLowerCase();
      return blob.includes(n);
    });
  }, [q]);

  const s = substances.find((x) => x.id === substanceId);

  const links = useMemo(() => {
    if (!s) return [];
    return buildOfficialQueryLinks({
      nameZh: s.nameZh,
      nameEn: s.nameEn,
      inn: s.inn,
      cas: s.cas,
      unii: s.unii,
      epTextNumber: s.epTextNumber,
      uspDoi: s.uspDoi,
      phIntDocPath: s.phIntDocPath,
    }).filter((l) => {
      if (l.code === "PubChem" || l.code === "Inxight" || l.code === "GSRS")
        return true;
      if (l.code === "site") return false;
      return markets.some(
        (m) =>
          l.code === m ||
          (m === "EP" && (l.code === "EP" || l.labelZh.includes("Eur")))
      );
    });
  }, [s, markets]);

  const impurities = useMemo(() => {
    if (!s) return [];
    return s.relatedImpurityIds
      .map((id) => getImpurity(id))
      .filter(Boolean);
  }, [s]);

  const rsList = useMemo(() => {
    if (!s) return [];
    return s.relatedRSIds
      .map((id) => getReferenceMaterial(id))
      .filter(Boolean);
  }, [s]);

  function toggleMarket(code: PharmacopoeiaCode) {
    setMarkets((prev) =>
      prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code]
    );
  }

  function buildMarkdown() {
    if (!s) return "";
    const lines: string[] = [
      `# 市场核查清单 · ${s.nameZh}`,
      "",
      `物质：${s.nameZh} / ${s.nameEn}`,
      `CAS：${s.cas || "—"} · UNII：${s.unii || "—"}`,
      `目标市场：${markets.join(", ") || "（未选）"}`,
      `生成时间：${new Date().toISOString()}`,
      "",
      "> 本清单仅为索引与外链提示，**不含**接受标准数值或专论全文。请以现行官方药典为准。",
      "",
      "## 官方 / 文档深链",
      "",
    ];
    for (const l of links) {
      lines.push(`- [${l.labelZh}](${l.url})${l.note ? ` — ${l.note}` : ""}`);
    }
    if (s.epTextNumber) {
      lines.push(
        `- Ph. Eur. text：\`${s.epTextNumber}\`（状态：${resolveEpIdStatus(s) || "—"}）`
      );
    }
    if (s.uspDoi) {
      lines.push(
        `- USP DOI：\`${s.uspDoi}\`（状态：${resolveUspDoiStatus(s) || "—"}）`
      );
    }

    lines.push("", "## 覆盖药典（种子索引）", "");
    for (const m of s.monographRefs) {
      const mark = markets.includes(m.pharmacopoeia) ? "☑" : "☐";
      lines.push(
        `- ${mark} **${m.pharmacopoeia}** ${m.monographTitleZh || m.monographTitle} · ${m.version} · [官方](${m.officialUrl})`
      );
    }

    lines.push("", "## 相关杂质（提示，无限度）", "");
    for (const i of impurities) {
      if (!i) continue;
      lines.push(
        `- ${i.nameZh} / ${i.nameEn}${i.cas ? ` · CAS ${i.cas}` : ""} · 类型 ${i.type}`
      );
    }

    lines.push("", "## 对照品 RS 提示", "");
    for (const r of rsList) {
      if (!r) continue;
      lines.push(
        `- ${r.nameZh} · ${r.issuer} · ${r.catalogCode}${r.officialUrl ? ` · [目录](${r.officialUrl})` : ""}`
      );
    }

    lines.push(
      "",
      "## 核查勾选（打印用）",
      "",
      "- [ ] 已打开目标市场官方专论并核对版本/效力",
      "- [ ] 已核对杂质/降解物命名与本地清单",
      "- [ ] 已核对对照品目录号与状态",
      "- [ ] **未**将本页任何示例数值当作接受标准",
      ""
    );
    return lines.join("\n");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">核查清单</h1>
          <p className="mt-1 text-sm text-slate-500 font-latin">
            Market checklist · printable · no acceptance criteria
          </p>
        </div>
        <DemoBadge />
      </div>

      <div className="print:hidden">
        <DisclaimerBanner />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm print:hidden">
        <label className="block text-sm font-medium">选择物质</label>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="筛选…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <select
          value={substanceId}
          onChange={(e) => setSubstanceId(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          {filtered.map((x) => (
            <option key={x.id} value={x.id}>
              {x.nameZh} / {x.nameEn}
            </option>
          ))}
        </select>

        <div>
          <p className="text-sm font-medium mb-2">目标市场</p>
          <div className="flex flex-wrap gap-3 text-sm">
            {MARKET_OPTS.map((m) => (
              <label key={m.code} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={markets.includes(m.code)}
                  onChange={() => toggleMarket(m.code)}
                />
                {m.label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm text-white hover:bg-teal-800"
          >
            打印
          </button>
          <button
            type="button"
            onClick={async () => {
              const md = buildMarkdown();
              try {
                await navigator.clipboard.writeText(md);
                showToast("已复制 Markdown");
              } catch {
                showToast("复制失败", "err");
              }
            }}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
          >
            复制 Markdown
          </button>
          <button
            type="button"
            onClick={() => {
              const md = buildMarkdown();
              const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `checklist-${substanceId}-${new Date().toISOString().slice(0, 10)}.md`;
              a.click();
              URL.revokeObjectURL(url);
              showToast("已导出 Markdown");
            }}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
          >
            导出 Markdown
          </button>
        </div>
      </section>

      {!s ? (
        <p className="text-sm text-slate-500">请选择物质。</p>
      ) : (
        <article
          id="checklist-print"
          className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm print:border-0 print:shadow-none"
        >
          <header className="space-y-1 border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">
              {s.nameZh}{" "}
              <span className="text-base font-normal text-slate-500 font-latin">
                {s.nameEn}
              </span>
            </h2>
            <p className="text-sm text-slate-600 font-latin">
              CAS {s.cas || "—"} · UNII {s.unii || "—"} · INN {s.inn || "—"}
            </p>
            <p className="text-xs text-amber-800">
              不含接受标准 / 限度数值。请以官方现行文本为准。
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <IdStatusBadge status={resolveEpIdStatus(s)} label="EP" />
              <IdStatusBadge status={resolveUspDoiStatus(s)} label="USP" />
              <IdStatusBadge status={resolvePhIntIdStatus(s)} label="Ph.Int." />
            </div>
          </header>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">目标市场</h3>
            <p className="text-sm">{markets.join(" · ") || "（未选）"}</p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">官方链接 / 文档深链</h3>
            <ul className="space-y-1.5 text-sm">
              {links.map((l) => (
                <li key={`${l.code}-${l.url}`}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-800 hover:underline"
                  >
                    {l.labelZh} ↗
                  </a>
                  {l.note && (
                    <span className="ml-2 text-xs text-slate-500">{l.note}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">种子专论覆盖</h3>
            <ul className="space-y-1 text-sm">
              {s.monographRefs.map((m) => (
                <li key={m.id} className="flex flex-wrap gap-2 items-center">
                  <span
                    className={
                      markets.includes(m.pharmacopoeia)
                        ? "font-semibold text-teal-900"
                        : "text-slate-500"
                    }
                  >
                    {markets.includes(m.pharmacopoeia) ? "☑" : "☐"}{" "}
                    {m.pharmacopoeia}
                  </span>
                  <span>{m.monographTitleZh || m.monographTitle}</span>
                  <span className="text-xs text-slate-400 font-latin">
                    {m.version}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">相关杂质（无限度）</h3>
            <ul className="space-y-1 text-sm">
              {impurities.map(
                (i) =>
                  i && (
                    <li key={i.id}>
                      <Link
                        href={`/impurities/${i.id}`}
                        className="text-teal-800 hover:underline print:text-slate-900 print:no-underline"
                      >
                        {i.nameZh} / {i.nameEn}
                      </Link>
                      {i.cas ? (
                        <span className="ml-2 text-xs text-slate-500 font-latin">
                          CAS {i.cas}
                        </span>
                      ) : null}
                    </li>
                  )
              )}
              {!impurities.length && (
                <li className="text-slate-400">无关联杂质种子</li>
              )}
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">对照品 RS 提示</h3>
            <ul className="space-y-1 text-sm">
              {rsList.map(
                (r) =>
                  r && (
                    <li key={r.id}>
                      {r.nameZh} · {r.issuer} ·{" "}
                      <span className="font-latin text-xs">{r.catalogCode}</span>
                    </li>
                  )
              )}
              {!rsList.length && (
                <li className="text-slate-400">无关联对照品种子</li>
              )}
            </ul>
          </section>

          <section className="space-y-2 border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold">打印勾选</h3>
            <ul className="space-y-1 text-sm text-slate-700">
              <li>☐ 已打开目标市场官方专论并核对版本/效力</li>
              <li>☐ 已核对杂质/降解物命名与本地清单</li>
              <li>☐ 已核对对照品目录号与状态</li>
              <li>☐ 未将本页任何示例数值当作接受标准</li>
            </ul>
          </section>
        </article>
      )}
    </div>
  );
}

export default function ChecklistPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-slate-500">加载核查清单…</p>}
    >
      <ChecklistInner />
    </Suspense>
  );
}
