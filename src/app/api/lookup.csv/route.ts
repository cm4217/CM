import { NextRequest, NextResponse } from "next/server";
import { lookupMany, lookupResultsToCsv } from "@/lib/lookup";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const queries = q
    .split(/[,，;；|]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 50);
  const results = queries.length ? lookupMany(queries) : [];
  const csv = "\ufeff" + lookupResultsToCsv(results);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Content-Disposition": 'inline; filename="lookup.csv"',
    },
  });
}
