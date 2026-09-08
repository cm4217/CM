import { NextRequest, NextResponse } from "next/server";
import {
  appendEvents,
  clearEvents,
  cookieName,
  eventStats,
  mintSid,
  normalizeSid,
  readEvents,
  type SearchEvent,
} from "@/lib/server/searchEvents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Pharm-Anon-Sid"
  );
  return res;
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }));
}

function resolveSid(req: NextRequest, bodySid?: string): { sid: string; setCookie: boolean } {
  const fromHeader = normalizeSid(req.headers.get("x-pharm-anon-sid"));
  const fromCookie = normalizeSid(req.cookies.get(cookieName())?.value);
  const fromBody = normalizeSid(bodySid);
  const existing = fromHeader || fromCookie || fromBody;
  if (existing) return { sid: existing, setCookie: !fromCookie };
  return { sid: mintSid(), setCookie: true };
}

function withSid(res: NextResponse, sid: string, setCookie: boolean) {
  if (setCookie) {
    res.cookies.set(cookieName(), sid, {
      path: "/",
      sameSite: "lax",
      httpOnly: false, // client may also send via header for extension
      maxAge: 60 * 60 * 24 * 400,
    });
  }
  return cors(res);
}

type BodyEntry = {
  type?: string;
  q?: string;
  hitCount?: number;
  entityId?: string;
  kind?: string;
  at?: string;
  sid?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sid, setCookie } = resolveSid(req, body?.sid);
    const rawEntries: BodyEntry[] = Array.isArray(body?.entries)
      ? body.entries
      : body?.type || body?.q || body?.entityId
        ? [body as BodyEntry]
        : [];

    if (!rawEntries.length) {
      return withSid(
        NextResponse.json({ ok: false, error: "no entries" }, { status: 400 }),
        sid,
        setCookie
      );
    }

    const events: SearchEvent[] = [];
    for (const e of rawEntries.slice(0, 50)) {
      const type: SearchEvent["type"] =
        e.type === "click" ? "click" : "search";
      const at = e.at || new Date().toISOString();
      if (type === "search") {
        const q = String(e.q || "").trim().slice(0, 120);
        if (!q) continue;
        events.push({
          type,
          q,
          hitCount: typeof e.hitCount === "number" ? e.hitCount : 0,
          sid,
          at,
        });
      } else {
        const entityId = String(e.entityId || "").trim().slice(0, 80);
        if (!entityId) continue;
        events.push({
          type,
          entityId,
          kind: e.kind ? String(e.kind).slice(0, 32) : undefined,
          q: e.q ? String(e.q).trim().slice(0, 120) : undefined,
          sid,
          at,
        });
      }
    }

    const appended = appendEvents(events);
    return withSid(
      NextResponse.json({ ok: true, appended, sid }),
      sid,
      setCookie
    );
  } catch (e) {
    return cors(
      NextResponse.json(
        { ok: false, error: e instanceof Error ? e.message : "fail" },
        { status: 500 }
      )
    );
  }
}

export async function GET(req: NextRequest) {
  const stats = eventStats();
  const sample = req.nextUrl.searchParams.get("sample") === "1";
  const limit = Math.min(
    200,
    Math.max(1, Number(req.nextUrl.searchParams.get("limit") || 20) || 20)
  );
  return cors(
    NextResponse.json({
      ...stats,
      inspect: "GET ?sample=1&limit=20 — last N events (no PII)",
      clear: "DELETE ?confirm=1",
      cookie: cookieName(),
      post: {
        search: '{ type:"search", q, hitCount?, at? } or entries[]',
        click: '{ type:"click", entityId, kind?, q?, at? }',
      },
      ...(sample ? { sample: readEvents(limit) } : {}),
    })
  );
}

export async function DELETE(req: NextRequest) {
  if (req.nextUrl.searchParams.get("confirm") !== "1") {
    return cors(
      NextResponse.json(
        { ok: false, error: "pass ?confirm=1 to clear anonymous event log" },
        { status: 400 }
      )
    );
  }
  const r = clearEvents();
  return cors(NextResponse.json({ ...r, cleared: true }));
}
