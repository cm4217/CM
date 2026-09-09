"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { DemoBadge } from "@/components/DemoBadge";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { showToast } from "@/lib/toastBus";
import { isValidCas } from "@/lib/casValidate";

type Row = {
  nameZh?: string;
  nameEn?: string;
  cas?: string;
  unii?: string;
  synonyms: string[];
  casOk?: boolean;
};

function normHeader(h: string) {
  return h.trim().toLowerCase().replace(/[\s_\-./]+/g, "");
}

const ALIASES: Record<string, string[]> = {
  nameZh: ["namezh", "zh", "chinese", "中文名"],
  nameEn: ["nameen", "en", "name", "english", "英文名"],
  cas: ["cas", "casno", "casrn"],
  unii: ["unii"],
  synonyms: ["synonyms", "synonym", "aliases", "同义词"],
};

function mapHeaders(headers: string[]) {
  const norms = headers.map(normHeader);
  const map: Record<string, number> = {};
  for (const [field, aliases] of Object.entries(ALIASES)) {
    for (let i = 0; i < norms.length; i++) {
      if (aliases.includes(norms[i])) {
        map[field] = i;
        break;
      }
    }
  }
  return map;
}

function splitCsvLine(line: string) {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function cellStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return String(v);
}

/** Shared mapper: header row + data rows → Row[] (CSV & Excel). */
function rowsFromTable(headers: string[], data: string[][]): Row[] {
  const map = mapHeaders(headers);
  const rows: Row[] = [];
  for (const cols of data) {
    const nameZh = map.nameZh != null ? cols[map.nameZh]?.trim() : undefined;
    const nameEn = map.nameEn != null ? cols[map.nameEn]?.trim() : undefined;
    const cas = map.cas != null ? cols[map.cas]?.trim() : undefined;
    const unii = map.unii != null ? cols[map.unii]?.trim() : undefined;
    const synRaw = map.synonyms != null ? cols[map.synonyms] || "" : "";
    const synonyms = synRaw
      .split(/[|;,/]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!nameZh && !nameEn && !cas && !unii) continue;
    rows.push({
      nameZh: nameZh || undefined,
      nameEn: nameEn || undefined,
      cas: cas || undefined,
      unii: unii || undefined,
      synonyms,
      casOk: cas ? isValidCas(cas) : undefined,
    });
  }
  return rows;
}

function parseCsv(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]);
  const data = lines.slice(1).map(splitCsvLine);
  return rowsFromTable(headers, data);
}

function parseExcelBuffer(buf: ArrayBuffer): Row[] {
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName];
  const aoa = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });
  if (!aoa.length) return [];
  const headers = (aoa[0] || []).map((c) => cellStr(c));
  const data = aoa.slice(1).map((row) => (row || []).map((c) => cellStr(c)));
  return rowsFromTable(headers, data);
}

function escapeCsvField(v: string) {
  if (/[",\r\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

/** Convert parsed rows back to CSV text for the paste area / preview source. */
function rowsToCsv(rows: Row[]): string {
  const header = "nameZh,nameEn,cas,unii,synonyms";
  const lines = rows.map((r) =>
    [
      r.nameZh || "",
      r.nameEn || "",
      r.cas || "",
      r.unii || "",
      r.synonyms.join("|"),
    ]
      .map(escapeCsvField)
      .join(",")
  );
  return [header, ...lines].join("\n");
}

const TEMPLATE =
  "nameZh,nameEn,cas,unii,synonyms\n阿司匹林示例,AspirinDemo,50-78-2,R16CO5Y76E,ASA|demo\n";

const TEMPLATE_ROWS: (string | number)[][] = [
  ["nameZh", "nameEn", "cas", "unii", "synonyms"],
  ["阿司匹林示例", "AspirinDemo", "50-78-2", "R16CO5Y76E", "ASA|demo"],
];

function isExcelFile(file: File) {
  const n = file.name.toLowerCase();
  return n.endsWith(".xlsx") || n.endsWith(".xls");
}

export default function ImportToolsPage() {
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const rows = useMemo(() => (raw.trim() ? parseCsv(raw) : []), [raw]);
  const invalidCas = rows.filter((r) => r.cas && r.casOk === false).length;

  function onFile(file: File | null) {
    if (!file) return;
    if (isExcelFile(file)) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const buf = reader.result;
          if (!(buf instanceof ArrayBuffer)) {
            showToast("无法读取 Excel 文件", "err");
            return;
          }
          const parsed = parseExcelBuffer(buf);
          if (!parsed.length) {
            showToast("未解析到有效行（请检查首表表头）", "warn");
            setRaw("");
            return;
          }
          setRaw(rowsToCsv(parsed));
          showToast(`已从 Excel 解析 ${parsed.length} 行`, "ok");
        } catch (e) {
          showToast("Excel 解析失败：" + String((e as Error).message || e), "err");
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setRaw(String(reader.result || ""));
    reader.readAsText(file);
  }

  function downloadCsvTemplate() {
    const blob = new Blob([TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "substance-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadXlsxTemplate() {
    const ws = XLSX.utils.aoa_to_sheet(TEMPLATE_ROWS);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "import");
    XLSX.writeFile(wb, "substance-import-template.xlsx");
  }

  async function submit() {
    if (!rows.length) {
      showToast("无有效行", "warn");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/index/user-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: rows }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "导入失败");
      showToast("已合并 " + json.added + " 条，合计 " + json.count, "ok");
    } catch (e) {
      showToast(String((e as Error).message || e), "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CSV / Excel 批量导入</h1>
          <p className="mt-1 text-sm text-slate-500">
            用户导入 · 支持 .csv / .xlsx / .xls（取首个工作表）· 身份层 · 非药典全文
          </p>
        </div>
        <DemoBadge />
      </div>
      <DisclaimerBanner compact />
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadCsvTemplate}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            下载 CSV 模板
          </button>
          <button
            type="button"
            onClick={downloadXlsxTemplate}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            下载 Excel 模板
          </button>
          <label className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm cursor-pointer hover:bg-slate-50">
            上传 CSV / Excel
            <input
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] || null)}
            />
          </label>
          <Link
            href="/tools/index"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-teal-800 hover:bg-slate-50"
          >
            索引缓存
          </Link>
        </div>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={8}
          placeholder="粘贴 CSV：nameZh,nameEn,cas,unii,synonyms（Excel 请用上方上传）"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-latin"
        />
        <p className="text-xs text-slate-500">
          预览 {rows.length} 行
          {invalidCas ? " · CAS 校验失败 " + invalidCas + " 行（导入时将丢弃无效 CAS）" : ""}
        </p>
        {rows.length > 0 ? (
          <div className="overflow-x-auto max-h-64 overflow-y-auto border rounded-lg">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-2 py-1 text-left">nameZh</th>
                  <th className="px-2 py-1 text-left">nameEn</th>
                  <th className="px-2 py-1 text-left">CAS</th>
                  <th className="px-2 py-1 text-left">UNII</th>
                  <th className="px-2 py-1 text-left">synonyms</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1">{r.nameZh}</td>
                    <td className="px-2 py-1 font-latin">{r.nameEn}</td>
                    <td
                      className={
                        "px-2 py-1 font-latin " +
                        (r.cas && r.casOk === false ? "text-rose-600" : "")
                      }
                    >
                      {r.cas}
                    </td>
                    <td className="px-2 py-1 font-latin">{r.unii}</td>
                    <td className="px-2 py-1">{r.synonyms.join("|")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <button
          type="button"
          disabled={busy || !rows.length}
          onClick={() => void submit()}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "导入中…" : "合并到本地用户索引"}
        </button>
      </section>
    </div>
  );
}
