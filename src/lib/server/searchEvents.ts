/**
 * Server-side anonymous search / click event log (JSONL).
 * No PII — only anon session cookie id, query text, entity ids, timestamps.
 * Inspect: GET /api/search-log  Clear: DELETE /api/search-log?confirm=1
 */
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  statSync,
} from "node:fs";
import { join } from "node:path";
import { createHash, randomBytes } from "node:crypto";

export type SearchEventType = "search" | "click";

export type SearchEvent = {
  type: SearchEventType;
  q?: string;
  hitCount?: number;
  entityId?: string;
  kind?: string;
  sid: string;
  at: string;
};

const COOKIE = "pharm_anon_sid";
const MAX_LINES_READ = 50_000;
const MAX_FILE_BYTES = 20 * 1024 * 1024; // rotate soft cap

export function eventsPath() {
  return join(process.cwd(), "data", "search-events.jsonl");
}

export function legacyQueryLogPath() {
  return join(process.cwd(), "data", "query-log.jsonl");
}

function ensureDataDir() {
  const dir = join(process.cwd(), "data");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function mintSid(): string {
  return randomBytes(16).toString("hex");
}

export function normalizeSid(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const s = String(raw).trim().slice(0, 64);
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(s)) return null;
  return s;
}

export function cookieName() {
  return COOKIE;
}

/** Hash sid for any future analytics export (never log emails/IPs). */
export function hashSid(sid: string): string {
  return createHash("sha256").update(sid).digest("hex").slice(0, 16);
}

export function appendEvents(events: SearchEvent[]) {
  if (!events.length) return 0;
  ensureDataDir();
  const path = eventsPath();
  try {
    if (existsSync(path) && statSync(path).size > MAX_FILE_BYTES) {
      // soft rotate: keep last ~half by rewriting truncated
      const raw = readFileSync(path, "utf8");
      const lines = raw.split("\n").filter(Boolean);
      const keep = lines.slice(-Math.floor(lines.length / 2));
      writeFileSync(path, keep.join("\n") + "\n", "utf8");
    }
  } catch {
    /* ignore rotate errors */
  }
  const lines = events.map((e) => JSON.stringify(e));
  appendFileSync(path, lines.join("\n") + "\n", "utf8");
  return lines.length;
}

export function clearEvents(): { ok: true; path: string } {
  ensureDataDir();
  writeFileSync(eventsPath(), "", "utf8");
  // also clear legacy query-log if present
  try {
    writeFileSync(legacyQueryLogPath(), "", "utf8");
  } catch {
    /* ignore */
  }
  return { ok: true, path: "data/search-events.jsonl" };
}

export function readEvents(limit = 500): SearchEvent[] {
  const path = eventsPath();
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, "utf8");
  const lines = raw.split("\n").filter(Boolean);
  const slice = lines.slice(-Math.min(limit, MAX_LINES_READ));
  const out: SearchEvent[] = [];
  for (const line of slice) {
    try {
      const o = JSON.parse(line) as SearchEvent;
      if (o && o.type && o.sid) out.push(o);
    } catch {
      /* skip bad line */
    }
  }
  return out;
}

export function eventStats() {
  const path = eventsPath();
  let bytes = 0;
  let lines = 0;
  if (existsSync(path)) {
    bytes = statSync(path).size;
    const raw = readFileSync(path, "utf8");
    lines = raw.split("\n").filter(Boolean).length;
  }
  return {
    path: "data/search-events.jsonl",
    bytes,
    lines,
    note:
      "Anonymous session cookie only (pharm_anon_sid). No IP/email/user-agent stored. Inspect via GET; clear via DELETE ?confirm=1.",
  };
}

/**
 * Co-occurrence from same anon sid: entities clicked/searched in overlapping windows.
 * Also builds query→entity click pairs for cold-start related.
 */
export function relatedFromEvents(
  focusId: string,
  opts?: { kind?: string; limit?: number; q?: string }
): { id: string; kind?: string; score: number; source: string }[] {
  const limit = opts?.limit ?? 8;
  const events = readEvents(20_000);
  if (!events.length) return [];

  const scores = new Map<string, { kind?: string; score: number; source: string }>();

  // Group by sid
  const bySid = new Map<string, SearchEvent[]>();
  for (const e of events) {
    if (!bySid.has(e.sid)) bySid.set(e.sid, []);
    bySid.get(e.sid)!.push(e);
  }

  for (const [, list] of bySid) {
    const clicks = list.filter((e) => e.type === "click" && e.entityId);
    const ids = Array.from(new Set(clicks.map((c) => c.entityId!)));
    if (ids.includes(focusId)) {
      for (const id of ids) {
        if (id === focusId) continue;
        const kind = clicks.find((c) => c.entityId === id)?.kind;
        const prev = scores.get(id) || { kind, score: 0, source: "co-click" };
        prev.score += 2;
        prev.source = "co-click";
        if (kind) prev.kind = kind;
        scores.set(id, prev);
      }
    }
    // same-session search peers: any click near a search that also clicked focus
    const focusClicks = clicks.filter((c) => c.entityId === focusId);
    if (focusClicks.length) {
      for (const c of clicks) {
        if (c.entityId === focusId) continue;
        const prev = scores.get(c.entityId!) || {
          kind: c.kind,
          score: 0,
          source: "session",
        };
        prev.score += 1;
        prev.source = prev.source === "co-click" ? "co-click" : "session";
        if (c.kind) prev.kind = c.kind;
        scores.set(c.entityId!, prev);
      }
    }
  }

  // Query co-click: users who searched similar q and clicked other entities
  if (opts?.q) {
    const qn = opts.q.trim().toLowerCase().slice(0, 80);
    if (qn.length >= 2) {
      for (const e of events) {
        if (e.type !== "click" || !e.entityId || e.entityId === focusId) continue;
        // find preceding search with similar q in same sid
        const peers = bySid.get(e.sid) || [];
        const hasSimilarSearch = peers.some(
          (s) =>
            s.type === "search" &&
            s.q &&
            (s.q.toLowerCase().includes(qn) || qn.includes(s.q.toLowerCase()))
        );
        if (hasSimilarSearch) {
          const prev = scores.get(e.entityId) || {
            kind: e.kind,
            score: 0,
            source: "query-coclick",
          };
          prev.score += 1.5;
          if (prev.source !== "co-click") prev.source = "query-coclick";
          if (e.kind) prev.kind = e.kind;
          scores.set(e.entityId, prev);
        }
      }
    }
  }

  return Array.from(scores.entries())
    .map(([id, v]) => ({ id, kind: v.kind, score: v.score, source: v.source }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
