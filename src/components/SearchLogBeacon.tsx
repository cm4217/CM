"use client";

import { useEffect } from "react";
import { LS_QUERY_LOG_QUEUE } from "@/lib/storageKeys";

type Entry = { q: string; hitCount: number; at: string };

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

/**
 * 记录检索 q + hitCount 到 localStorage 队列并尝试刷到 /api/search-log。
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
    try {
      const raw = localStorage.getItem(LS_QUERY_LOG_QUEUE);
      const prev = raw ? (JSON.parse(raw) as Entry[]) : [];
      const next = [
        { q: t, hitCount, at: new Date().toISOString() },
        ...(Array.isArray(prev) ? prev : []),
      ].slice(0, 80);
      localStorage.setItem(LS_QUERY_LOG_QUEUE, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    flushQueue();
  }, [q, hitCount]);

  return null;
}

export { flushQueue as flushSearchLogQueue };
