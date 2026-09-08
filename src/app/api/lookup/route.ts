import { NextRequest, NextResponse } from "next/server";
import { lookupMany, lookupOne, lookupResultsToCsv } from "@/lib/lookup";

export const dynamic = "force-dynamic";

function parseQueriesFromGet(req: NextRequest): string[] {
  const q = req.nextUrl.searchParams.get("q") || "";
  if (!q.trim()) return [];
  return q.split(/[,，;；|]+/).map((x) => x.trim()).filter(Boolean).slice(0, 50);
}

export async function GET(req: NextRequest) {
  const queries = parseQueriesFromGet(req);
  if (!queries.length) {
    return NextResponse.json({
      results: [],
      hint: "GET /api/lookup?q=name-or-cas (comma-separated for batch)",
    });
  }
  const results = lookupMany(queries);
  const format = req.nextUrl.searchParams.get("format");
  if (format === "csv") {
    const csv = "\ufeff" + lookupResultsToCsv(results);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'inline; filename="lookup.csv"',
      },
    });
  }
  return NextResponse.json({ results, count: results.length });
}

export async function POST(req: NextRequest) {
  let body: { queries?: string[]; q?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const list =
    Array.isArray(body.queries) && body.queries.length
      ? body.queries.map(String)
      : body.q
        ? [String(body.q)]
        : [];
  const queries = list.map((x) => x.trim()).filter(Boolean).slice(0, 50);
  if (!queries.length) {
    return NextResponse.json({ error: "queries required" }, { status: 400 });
  }
  const results = queries.length === 1 ? [lookupOne(queries[0])] : lookupMany(queries);
  return NextResponse.json({ results, count: results.length });
}
