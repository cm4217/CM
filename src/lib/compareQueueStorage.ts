import { LS_COMPARE_QUEUE } from "./storageKeys";

/** Max substances in compare queue (2–4). */
export const COMPARE_QUEUE_MAX = 4;
export const COMPARE_QUEUE_MIN = 2;

export function loadCompareQueue(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_COMPARE_QUEUE);
    if (!raw) return [];
    const arr = JSON.parse(raw) as string[];
    if (!Array.isArray(arr)) return [];
    return Array.from(new Set(arr.filter((x) => typeof x === "string"))).slice(
      0,
      COMPARE_QUEUE_MAX
    );
  } catch {
    return [];
  }
}

export function saveCompareQueue(ids: string[]) {
  const next = Array.from(new Set(ids.filter(Boolean))).slice(
    0,
    COMPARE_QUEUE_MAX
  );
  localStorage.setItem(LS_COMPARE_QUEUE, JSON.stringify(next));
  return next;
}

export function addToCompareQueue(id: string): {
  ok: boolean;
  ids: string[];
  message: string;
} {
  const prev = loadCompareQueue();
  if (prev.includes(id)) {
    return { ok: true, ids: prev, message: "已在对比队列中" };
  }
  if (prev.length >= COMPARE_QUEUE_MAX) {
    return {
      ok: false,
      ids: prev,
      message: `对比队列最多 ${COMPARE_QUEUE_MAX} 个物质，请先移除`,
    };
  }
  const ids = saveCompareQueue([...prev, id]);
  return { ok: true, ids, message: "已加入对比" };
}

export function removeFromCompareQueue(id: string): string[] {
  return saveCompareQueue(loadCompareQueue().filter((x) => x !== id));
}

export function clearCompareQueue() {
  localStorage.removeItem(LS_COMPARE_QUEUE);
}
