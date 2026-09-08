/**
 * Optional Meilisearch candidate retrieval.
 * If MEILI_HOST unset or Meili down -> null (fuse fallback). Never throws.
 */

export type MeiliHitRef = { kind: string; id: string };

function host(): string | null {
  let h = (process.env.MEILI_HOST || "").trim();
  if (h.endsWith("/")) h = h.slice(0, -1);
  return h || null;
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const key = (process.env.MEILI_API_KEY || "").trim();
  if (key) h.Authorization = "Bearer " + key;
  return h;
}

export async function meiliSearchCandidates(
  q: string,
  limit = 40
): Promise<MeiliHitRef[] | null> {
  const base = host();
  if (!base || !q.trim()) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(base + "/indexes/pharm/search", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        q: q.trim(),
        limit,
        attributesToRetrieve: ["kind", "id"],
      }),
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      hits?: Array<{ kind?: string; id?: string }>;
    };
    return (json.hits || [])
      .filter((x) => x.kind && x.id)
      .map((x) => ({ kind: String(x.kind), id: String(x.id) }));
  } catch {
    return null;
  }
}

export function meiliConfigured(): boolean {
  return !!host();
}
