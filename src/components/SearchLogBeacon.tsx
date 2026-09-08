"use client";

import { useEffect } from "react";
import { LS_QUERY_LOG_QUEUE } from "@/lib/storageKeys";

type Entry = {
  type: "search" | "click";
  q?: string;
  hitCount?: number;
  entityId?: string;
  kind?: string;
  at: string;
};

function flushQueue() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LS_QUERY_LOG_QUEUE);
    if (!raw) return;
    const arr = JSON.parse(raw) as Entry[];
    if (!Array.isArray(arr) || arr.length === 0) return;
    const batch = arr.slice(0, 40);
    fetch("/api/search-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: batch }),
      keepalive: true,
      credentials: "same-origin",
    })
      .then((r) => {
        if (!r.ok) return;
        const rest = arr.slice(batch.length);
        if (rest.length) localStorage.setItem(LS_QUERY_LOG_QUEUE, JSON.stringify(rest));
        else localStorage.removeItem(LS_QUERY_LOG_QUEUE);
      })
      .catch(() => {});
  } catch {
    /* ignore */
  }
}

function enqueue(entry: Entry) {
  try {
    const raw = localStorage.getItem(LS_QUERY_LOG_QUEUE);
    const prev = raw ? (JSON.parse(raw) as Entry[]) : [];
    const next = [entry, ...(Array.isArray(prev) ? prev : [])].slice(0, 80);
    localStorage.setItem(LS_QUERY_LOG_QUEUE, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/**
 * 记录检索 q + hitCount 到队列并刷到 /api/search-log（服务端 JSONL + anon cookie）。
 */
export function SearchLogBeacon({
  q,
  hitCount,
}: {
  q: string;
  hitCount: number;
}) {
  useEffect(() => {
    const t = q.trim();
    if (!t) return;
    enqueue({
      type: "search",
      q: t,
      hitCount,
      at: new Date().toISOString(),
    });
    flushQueue();
  }, [q, hitCount]);

  return null;
}

/** Log a result / substance click for server co-occurrence. */
export function logSearchClick(opts: {
  entityId: string;
  kind?: string;
  q?: string;
}) {
  if (typeof window === "undefined" || !opts.entityId) return;
  enqueue({
    type: "click",
    entityId: opts.entityId,
    kind: opts.kind,
    q: opts.q,
    at: new Date().toISOString(),
  });
  flushQueue();
}

export { flushQueue as flushSearchLogQueue };
