import { NextResponse } from "next/server";
import { alertSources } from "@/data/alertSources";

export const revalidate = 3600;

export async function GET() {
  return NextResponse.json({
    label: "修订提醒 · 官方来源元数据",
    disclaimer:
      "仅列出可关注的公开公告/目录 URL；不抓取付费专论正文。订阅 RSS/cron 为后续能力。",
    sources: alertSources,
  });
}
