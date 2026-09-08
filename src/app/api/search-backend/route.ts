import { NextResponse } from "next/server";
import { meiliConfigured, meiliHealth } from "@/lib/search/meili";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const configured = meiliConfigured();
  let healthy = false;
  let detail: string | undefined;
  if (configured) {
    const h = await meiliHealth();
    healthy = h.ok;
    detail = h.detail;
  }
  const backend = configured && healthy ? "meili+rank" : "fuse+rank";
  return NextResponse.json({
    backend,
    meili: {
      configured,
      healthy,
      host: configured ? (process.env.MEILI_HOST || "").replace(/\/$/, "") : null,
      detail,
    },
    note: "Build/dev works without Meilisearch. Set MEILI_HOST and run meili:index to prefer Meili.",
  });
}
