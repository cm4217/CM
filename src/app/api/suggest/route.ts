import { NextRequest, NextResponse } from "next/server";
import { substances, impurities } from "@/data";
import { SYNONYM_CLUSTERS } from "@/lib/synonyms";
import { cachedFetch, ONE_HOUR } from "@/lib/cache";

export const revalidate = 3600;

export type SuggestItem = {
  source: "local" | "pubchem";
  kind?: "substance" | "impurity" | "synonym";
  id?: string;
  label: string;
  labelZh?: string;
  labelEn?: string;
  href?: string;
  cas?: string;
  unii?: string;
};

function norm(s: string) {
  return s.trim().toLowerCase();
}

function localSuggest(q: string, limit = 8): SuggestItem[] {
  const n = norm(q);
  if (n.length < 1) return [];
  const out: SuggestItem[] = [];
  const seen = new Set<string>();

  const push = (item: SuggestItem) => {
    const k = `${item.kind || item.source}:${item.id || item.label}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push(item);
  };

  for (const s of substances) {
    const blob = [s.nameZh, s.nameEn, s.inn, s.cas, s.unii, ...s.aliases]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (blob.includes(n) || norm(s.nameZh).startsWith(n) || norm(s.nameEn).startsWith(n)) {
      push({
        source: "local",
        kind: "substance",
        id: s.id,
        label: `${s.nameZh} / ${s.nameEn}`,
        labelZh: s.nameZh,
        labelEn: s.nameEn,
        href: `/substances/${s.id}`,
        cas: s.cas,
        unii: s.unii,
      });
    }
    if (out.length >= limit) break;
  }

  for (const i of impurities) {
    if (out.length >= limit) break;
    const blob = [i.nameZh, i.nameEn, i.chemicalName, i.cas, ...i.namingCrosswalk.map((x) => x.name)]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (blob.includes(n)) {
      push({
        source: "local",
        kind: "impurity",
        id: i.id,
        label: `${i.nameZh} / ${i.nameEn}`,
        labelZh: i.nameZh,
        labelEn: i.nameEn,
        href: `/impurities/${i.id}`,
        cas: i.cas,
        unii: i.unii,
      });
    }
  }

  for (const cluster of SYNONYM_CLUSTERS) {
    if (out.length >= limit) break;
    if (cluster.some((t) => norm(t).includes(n) || n.includes(norm(t)))) {
      const primary = cluster[0];
      push({
        source: "local",
        kind: "synonym",
        label: primary,
        labelZh: primary,
      });
    }
  }

  return out.slice(0, limit);
}

async function pubchemSuggest(term: string, limit = 8): Promise<SuggestItem[]> {
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound/${encodeURIComponent(term)}/JSON?limit=${limit}`;
  try {
    const data = await cachedFetch(`pubchem:ac:${term.toLowerCase()}:${limit}`, ONE_HOUR, async () => {
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) throw new Error(`PubChem autocomplete HTTP ${res.status}`);
      return res.json();
    });
    const dict = (data as { dictionary_terms?: { compound?: string[] } })
      ?.dictionary_terms?.compound;
    if (!Array.isArray(dict)) return [];
    return dict.slice(0, limit).map((label) => ({
      source: "pubchem" as const,
      label,
      labelEn: label,
    }));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (!q || q.length < 1) {
    return NextResponse.json({ q, suggestions: [] as SuggestItem[] });
  }
  if (q.length > 80) {
    return NextResponse.json({ error: "q too long" }, { status: 400 });
  }

  const local = localSuggest(q, 8);
  const pubchem = await pubchemSuggest(q, 8);

  // Merge: local first, then pubchem not already covered
  const seen = new Set(local.map((s) => norm(s.labelEn || s.label)));
  const merged: SuggestItem[] = [...local];
  for (const p of pubchem) {
    if (seen.has(norm(p.label))) continue;
    seen.add(norm(p.label));
    merged.push(p);
    if (merged.length >= 12) break;
  }

  return NextResponse.json({
    q,
    suggestions: merged,
    sources: { local: local.length, pubchem: pubchem.length },
  });
}
