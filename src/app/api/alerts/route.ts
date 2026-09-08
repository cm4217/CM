import { NextRequest, NextResponse } from "next/server";
import { changeEvents as seedEvents } from "@/data/changeEvents";
import {
  generatedChangeEvents,
  CHANGE_EVENTS_LAST_CHECKED,
} from "@/data/changeEvents.generated";
import { alertSources } from "@/data/alertSources";

export const revalidate = 3600;

function mergeEvents() {
  const map = new Map<string, (typeof seedEvents)[number]>();
  for (const e of [...seedEvents, ...generatedChangeEvents]) {
    map.set(e.id, e);
  }
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
}

export async function GET(req: NextRequest) {
  const source = (req.nextUrl.searchParams.get("source") || "").trim();
  const severity = (req.nextUrl.searchParams.get("severity") || "").trim();
  const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();

  let events = mergeEvents();
  if (source) {
    events = events.filter(
      (e) => e.sourceKey === source || String(e.pharmacopoeia) === source
    );
  }
  if (severity) {
    events = events.filter((e) => e.severity === severity);
  }
  if (q) {
    events = events.filter((e) => {
      const blob = [e.titleZh, e.titleEn, e.summaryZh, e.summaryEn, e.sourceKey]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }

  return NextResponse.json({
    lastChecked: CHANGE_EVENTS_LAST_CHECKED,
    count: events.length,
    sources: alertSources,
    events,
    disclaimer:
      "合并本地种子与 scripts/fetch-alert-sources.mjs 生成数据；不抓取付费专论正文。",
  });
}
