import { NextRequest, NextResponse } from "next/server";
import { cachedFetch, ONE_HOUR } from "@/lib/cache";

export const revalidate = 3600;

const GSRS = "https://gsrs.ncats.nih.gov/api/v1";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (!q) {
    return NextResponse.json({ error: "缺少参数 q", demo: true }, { status: 400 });
  }
  try {
    const data = await cachedFetch(`gsrs:search:${q.toLowerCase()}`, ONE_HOUR, async () => {
      const url = `${GSRS}/substances/search?q=${encodeURIComponent(q)}&top=10`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 3600 },
      });
      if (!res.ok) throw new Error(`GSRS HTTP ${res.status}`);
      return res.json();
    });
    return NextResponse.json({
      source: "FDA GSRS",
      live: true,
      label: "实时富化 · 公开 API",
      query: q,
      data,
    });
  } catch (e) {
    return NextResponse.json(
      {
        source: "FDA GSRS",
        live: false,
        error: String((e as Error).message || e),
        message: "GSRS 暂不可用，请保留站内种子数据。",
        query: q,
      },
      { status: 502 }
    );
  }
}
