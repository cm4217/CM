import { NextRequest, NextResponse } from "next/server";
import { cachedFetch, ONE_HOUR } from "@/lib/cache";

export const revalidate = 3600;

const GSRS = "https://gsrs.ncats.nih.gov/api/v1";

type Ctx = { params: { unii: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const unii = (params.unii || "").trim().toUpperCase();
  if (!unii) {
    return NextResponse.json({ error: "缺少 UNII" }, { status: 400 });
  }
  try {
    const data = await cachedFetch(`gsrs:substance:${unii}`, ONE_HOUR, async () => {
      const url = `${GSRS}/substances(${encodeURIComponent(unii)})?view=full`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 3600 },
      });
      if (!res.ok) {
        const sres = await fetch(
          `${GSRS}/substances/search?q=root_codes_code:"${encodeURIComponent(unii)}"&top=1`,
          { headers: { Accept: "application/json" }, next: { revalidate: 3600 } }
        );
        if (!sres.ok) throw new Error(`GSRS HTTP ${res.status}`);
        const sj = await sres.json();
        const first = sj?.content?.[0] || null;
        if (!first) throw new Error("未找到该 UNII");
        return first;
      }
      return res.json();
    });

    const relationships =
      data?.relationships ||
      data?.substance?.relationships ||
      [];

    const impurityParents = (Array.isArray(relationships) ? relationships : [])
      .filter((r: { type?: string }) => {
        const t = (r.type || "").toLowerCase();
        return t.includes("impurit") || t.includes("parent") || t.includes("metabol");
      })
      .map((r: { type?: string; relatedSubstance?: { refPname?: string; approvalID?: string } }) => ({
        type: r.type,
        name: r.relatedSubstance?.refPname,
        approvalID: r.relatedSubstance?.approvalID,
      }));

    return NextResponse.json({
      source: "FDA GSRS",
      live: true,
      label: "实时富化 · 公开 API",
      unii,
      data,
      relationships: Array.isArray(relationships) ? relationships : [],
      impurityParents,
    });
  } catch (e) {
    return NextResponse.json(
      {
        source: "FDA GSRS",
        live: false,
        unii,
        error: String((e as Error).message || e),
        message: "GSRS 物质详情暂不可用，请保留站内种子数据。",
      },
      { status: 502 }
    );
  }
}
