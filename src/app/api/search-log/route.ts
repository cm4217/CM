import { NextRequest, NextResponse } from "next/server";
import { appendFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Entry = { q?: string; hitCount?: number; at?: string };

function logPath() {
  return join(process.cwd(), "data", "query-log.jsonl");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entries: Entry[] = Array.isArray(body?.entries)
      ? body.entries
      : body?.q
        ? [{ q: body.q, hitCount: body.hitCount, at: body.at }]
        : [];
    if (!entries.length) {
      return NextResponse.json({ ok: false, error: "no entries" }, { status: 400 });
    }
    const dir = join(process.cwd(), "data");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const lines: string[] = [];
    for (const e of entries.slice(0, 50)) {
      const q = String(e.q || "").trim().slice(0, 120);
      if (!q) continue;
      const hitCount = typeof e.hitCount === "number" ? e.hitCount : 0;
      const at = e.at || new Date().toISOString();
      lines.push(JSON.stringify({ q, hitCount, at }));
    }
    if (lines.length) {
      appendFileSync(logPath(), lines.join("\n") + "\n", "utf8");
    }
    return NextResponse.json({ ok: true, appended: lines.length });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "fail" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    note: "POST { entries:[{q,hitCount,at}] } → data/query-log.jsonl",
    path: "data/query-log.jsonl",
  });
}
