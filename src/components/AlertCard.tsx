"use client";

import Link from "next/link";
import type { ChangeEvent } from "@/lib/types";
import { DemoBadge } from "./DemoBadge";
import { AlertImpactPanel } from "./AlertImpactPanel";
import {
  labelForImpurityId,
  labelForSubstanceId,
} from "@/lib/entityLinksLite";

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
  highlightSubstanceId,
  highlightImpurityId,
}: {
  event: ChangeEvent;
  showImpact?: boolean;
  highlightSubstanceId?: string;
  highlightImpurityId?: string;
}) {
  const relatedSubs = event.relatedSubstanceIds || [];
  const relatedImps = event.relatedImpurityIds || [];
  const highlighted =
    (highlightSubstanceId && relatedSubs.includes(highlightSubstanceId)) ||
    (highlightImpurityId && relatedImps.includes(highlightImpurityId));

  return (
    <article
      className={`rounded-xl border bg-white p-4 shadow-sm transition ${
        highlighted
          ? "border-amber-400 ring-1 ring-amber-200"
          : "border-slate-200 hover:border-teal-200"
      }`}
    >
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
        {highlighted ? (
          <span className="rounded-md bg-amber-100 px-2 py-0.5 font-medium text-amber-950">
            与当前实体相关
          </span>
        ) : null}
        <DemoBadge />
      </div>
      <h3 className="mt-2 font-semibold text-slate-900">{event.titleZh}</h3>
      <p className="mt-1 text-xs text-slate-500 font-latin">{event.titleEn}</p>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">
        {event.summaryZh}
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        {relatedSubs.map((id) => (
          <Link
            key={`s-${id}`}
            href={`/substances/${id}`}
            className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-900 no-underline hover:border-sky-400"
          >
            物质 · {labelForSubstanceId(id)}
          </Link>
        ))}
        {relatedImps.map((id) => (
          <Link
            key={`i-${id}`}
            href={`/impurities/${id}`}
            className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-900 no-underline hover:border-rose-400"
          >
            杂质 · {labelForImpurityId(id)}
          </Link>
        ))}
        {event.officialUrl && (
          <a
            href={event.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs text-slate-600 hover:text-teal-800"
          >
            官方链接 ↗
          </a>
        )}
      </div>
      {relatedSubs.length > 0 ? (
        <p className="mt-2 text-[11px] text-slate-500">
          枢纽：
          {relatedSubs.slice(0, 3).map((id) => (
            <Link
              key={`hub-${id}`}
              href={`/substances/${id}#entity-hub`}
              className="ml-1.5 text-teal-800 hover:underline"
            >
              {labelForSubstanceId(id)} 关联模块
            </Link>
          ))}
        </p>
      ) : null}
      {showImpact ? <AlertImpactPanel event={event} /> : null}
    </article>
  );
}
