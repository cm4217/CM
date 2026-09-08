"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DemoBadge } from "@/components/DemoBadge";
import { SearchBackendChip } from "@/components/SearchBackendChip";
import { DisclaimerBanner } from "@/components/Disclaimer";

export default function SheetsToolsPage() {
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const base = origin || "https://<your-deploy-host>";
  const ex1 = `${base}/api/lookup.csv?q=${encodeURIComponent("阿司匹林")}`;
  const ex2 = `${base}/api/lookup.csv?q=${encodeURIComponent("阿司匹林,布洛芬,对乙酰氨基酚")}`;
  const ex3 = `${base}/api/lookup?q=${encodeURIComponent("aspirin")}`;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Excel / 表格集成</h1>
          <p className="mt-1 text-sm text-slate-500 font-latin">Power Query · From Web</p>
        </div>
        <DemoBadge />
        <SearchBackendChip />
      </div>
      <DisclaimerBanner compact />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 text-sm text-slate-700">
        <h2 className="font-semibold text-slate-900">Excel「数据 → 从 Web」</h2>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Excel → 数据 → 从 Web / From Web</li>
          <li>粘贴下方 CSV URL（当前站点 origin 自动填充）</li>
          <li>转换后加载到工作表。返回为索引元数据，非法定专论全文。</li>
        </ol>
        <div className="space-y-2 text-xs font-latin break-all">
          <p>
            <span className="text-slate-500">单条 CSV：</span>
            <br />
            <a className="text-teal-700 hover:underline" href={ex1}>
              {ex1}
            </a>
          </p>
          <p>
            <span className="text-slate-500">批量 CSV：</span>
            <br />
            <a className="text-teal-700 hover:underline" href={ex2}>
              {ex2}
            </a>
          </p>
          <p>
            <span className="text-slate-500">JSON：</span>
            <br />
            <a className="text-teal-700 hover:underline" href={ex3}>
              {ex3}
            </a>
          </p>
        </div>
        <p className="text-xs text-slate-500">
          POST JSON：<code className="font-latin">POST /api/lookup</code> body{" "}
          <code className="font-latin">{`{ "queries": ["阿司匹林","50-78-2"] }`}</code>
        </p>
        <p className="text-xs">
          文档：<Link href="#" className="pointer-events-none text-slate-400">docs/excel-integration.md</Link>
          （仓库内）· 模板：{" "}
          <a className="text-teal-700 hover:underline" href="/templates/watchlist-import.csv">
            /templates/watchlist-import.csv
          </a>
        </p>
      </section>


      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 text-sm text-slate-700">
        <h2 className="font-semibold text-slate-900">Office Excel add-in (sideload)</h2>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Source: <code className="font-latin">excel-addin/</code> mirrored at <code className="font-latin">public/excel-addin/</code></li>
          <li>Follow <code className="font-latin">excel-addin/SIDELOAD.txt</code></li>
          <li>Task pane calls <code className="font-latin">/api/lookup</code> and can write the selection</li>
        </ol>
        <p className="text-xs text-slate-500">Rewrite manifest.xml URLs for your deploy origin when not on localhost.</p>
      </section>

      <p className="text-sm">
        <Link href="/tools/bookmarklet" className="text-teal-700 hover:underline">
          书签小工具
        </Link>
      </p>
    </div>
  );
}
