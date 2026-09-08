"use client";

import { useMemo, useState } from "react";
import type { Substance } from "@/lib/types";
import { impurities } from "@/data";
import {
  buildFhirIshDraft,
  buildImpurityRowsForSubstance,
  buildImpurityRowsForWatchlist,
  downloadText,
  impurityRowsToCsv,
} from "@/lib/impurityExport";

type Props =
  | { mode: "substance"; substance: Substance }
  | { mode: "watchlist"; substanceIds: string[] };

export function ImpurityExportPanel(props: Props) {
  const [msg, setMsg] = useState("");

  const rows = useMemo(() => {
    if (props.mode === "substance") return buildImpurityRowsForSubstance(props.substance);
    return buildImpurityRowsForWatchlist(props.substanceIds);
  }, [props]);

  function exportCsv() {
    if (!rows.length) {
      setMsg("无可导出杂质");
      return;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    const name =
      props.mode === "substance"
        ? `impurities-${props.substance.id}-${stamp}.csv`
        : `impurities-watchlist-${stamp}.csv`;
    downloadText(name, impurityRowsToCsv(rows), "text/csv;charset=utf-8");
    setMsg(`已导出 CSV（${rows.length} 行）`);
  }

  function exportJson() {
    if (!rows.length) {
      setMsg("无可导出杂质");
      return;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    const name =
      props.mode === "substance"
        ? `impurities-${props.substance.id}-${stamp}.json`
        : `impurities-watchlist-${stamp}.json`;
    downloadText(
      name,
      JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2),
      "application/json;charset=utf-8"
    );
    setMsg(`已导出 JSON（${rows.length} 行）`);
  }

  function exportFhir() {
    if (props.mode !== "substance") {
      setMsg("FHIR-ish 草稿仅支持单个物质页导出");
      return;
    }
    const s = props.substance;
    const related = s.relatedImpurityIds
      .map((id) => impurities.find((i) => i.id === id))
      .filter(Boolean);
    const draft = buildFhirIshDraft(s, related as NonNullable<(typeof related)[number]>[]);
    downloadText(
      `fhir-ish-${s.id}-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(draft, null, 2),
      "application/json;charset=utf-8"
    );
    setMsg("已导出 FHIR-ish JSON 草稿（非正式申报件）");
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">导出杂质清单</h2>
      <p className="text-xs text-slate-600">
        列含：父物质、杂质中英文名、CAS、类型、ICH 标签、UNII、官网链接提醒。可选 JSON /
        FHIR-ish 草稿（非正式申报件，基于 FDA PQ-CMC 概念但不宣称合规）。
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm text-white hover:bg-teal-800"
        >
          导出杂质清单 CSV
        </button>
        <button
          type="button"
          onClick={exportJson}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          导出 JSON
        </button>
        {props.mode === "substance" && (
          <button
            type="button"
            onClick={exportFhir}
            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm text-amber-900 hover:bg-amber-100"
          >
            FHIR-ish JSON 草稿
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500">
        {rows.length} 条杂质可导出
        {msg ? ` · ${msg}` : ""}
      </p>
    </section>
  );
}
