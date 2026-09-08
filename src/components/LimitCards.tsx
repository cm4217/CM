import type { IchLimitRow } from "@/lib/types";
import { DemoBadge } from "./DemoBadge";
import Link from "next/link";

export function LimitCards({
  rows,
  showHeader = true,
}: {
  rows: IchLimitRow[];
  showHeader?: boolean;
}) {
  if (!rows.length) return null;
  return (
    <section className="space-y-3">
      {showHeader && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">相关限值示例</h2>
            <DemoBadge />
            <Link href="/limits" className="text-xs text-teal-700 hover:underline">
              全部限值 →
            </Link>
          </div>
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            示例/请核官方最新版 — 不替代 ICH / FDA / EMA / 药典法定文本。
          </p>
        </>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <article
            key={r.id}
            id={r.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded bg-indigo-50 text-indigo-800 px-2 py-0.5 font-latin">
                {r.category}
              </span>
              <DemoBadge />
            </div>
            <h3 className="mt-2 font-semibold text-slate-900">
              {r.nameZh}{" "}
              <span className="text-sm font-normal text-slate-500 font-latin">
                {r.nameEn}
              </span>
            </h3>
            <p className="mt-2 text-sm">
              <span className="font-medium font-latin">{r.exampleValue}</span>{" "}
              <span className="text-slate-500 text-xs">{r.unit}</span>
            </p>
            {r.classOrNote && (
              <p className="mt-1 text-xs text-slate-500">{r.classOrNote}</p>
            )}
            <p className="mt-2 text-xs text-amber-900">{r.disclaimerZh}</p>
            <ul className="mt-2 space-y-1">
              {r.officialUrls.map((u) => (
                <li key={u.url}>
                  <a
                    href={u.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-teal-700 hover:underline"
                  >
                    {u.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
