"use client";

import Link from "next/link";
import type { ChangeEvent } from "@/lib/types";
import { DemoBadge } from "./DemoBadge";
import { AlertImpactPanel } from "./AlertImpactPanel";

const severityStyle: Record<ChangeEvent["severity"], string> = {
  info: "bg-slate-100 text-slate-700",
  watch: "bg-amber-100 text-amber-900",
  critical: "bg-rose-100 text-rose-900",
};

const severityLabel: Record<ChangeEvent["severity"], string> = {
  info: "提示",
  watch: "关注",
  critical: "重要",
};

export function AlertCard({
  event,
  showImpact = true,
}: {
  event: ChangeEvent;
  showImpact?: boolean;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-teal-200 transition">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <time className="font-latin text-slate-500" dateTime={event.date}>
          {event.date}
        </time>
        <span className="rounded-md bg-teal-50 text-teal-800 px-2 py-0.5 font-medium">
          {event.pharmacopoeia}
        </span>
        <span
          className={`rounded-md px-2 py-0.5 font-medium ${severityStyle[event.severity]}`}
        >
          {severityLabel[event.severity]}
        </span>
        <DemoBadge />
      </div>
      <h3 className="mt-2 font-semibold text-slate-900">{event.titleZh}</h3>
      <p className="mt-1 text-xs text-slate-500 font-latin">{event.titleEn}</p>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">
        {event.summaryZh}
      </p>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        {event.relatedSubstanceIds?.map((id) => (
          <Link
            key={id}
            href={`/substances/${id}`}
            className="text-teal-700 hover:underline"
          >
            物质详情 →
          </Link>
        ))}
        {event.relatedImpurityIds?.map((id) => (
          <Link
            key={id}
            href={`/impurities/${id}`}
            className="text-teal-700 hover:underline"
          >
            杂质详情 →
          </Link>
        ))}
        {event.officialUrl && (
          <a
            href={event.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-teal-800"
          >
            官方链接 ↗
          </a>
        )}
      </div>
      {showImpact ? <AlertImpactPanel event={event} /> : null}
    </article>
  );
}
