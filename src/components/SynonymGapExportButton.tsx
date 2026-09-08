"use client";

import { flushSearchLogQueue } from "@/components/SearchLogBeacon";
import { showToast } from "@/lib/toastBus";

export function SynonymGapExportButton() {
  function onExport() {
    flushSearchLogQueue();
    showToast(
      "已刷本地查询队列。请在仓库运行：npm run synonym:gap → data/synonym-gap-report.md"
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
      <h2 className="text-sm font-semibold text-slate-900">同义词缺口</h2>
      <p className="text-xs text-slate-500">
        使用站点检索会写入本地查询日志；点此刷队列后，在仓库运行缺口脚本。
      </p>
      <button
        type="button"
        className="rounded-lg bg-teal-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700"
        onClick={onExport}
      >
        导出同义词缺口
      </button>
    </section>
  );
}
