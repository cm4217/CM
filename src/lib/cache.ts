/** Simple in-memory TTL cache for upstream API responses (server-side). */
type Entry = { exp: number; data: unknown };

const store = new Map<string, Entry>();

export async function cachedFetch<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.exp > Date.now()) {
    return hit.data as T;
  }
  const data = await loader();
  store.set(key, { exp: Date.now() + ttlMs, data });
  return data;
}

export const ONE_HOUR = 60 * 60 * 1000;
