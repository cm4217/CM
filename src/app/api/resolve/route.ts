import { NextRequest, NextResponse } from "next/server";
import { substances } from "@/data";
import { cachedFetch, ONE_HOUR } from "@/lib/cache";

export const revalidate = 3600;

export type ResolveSuggestion = {
  name: string;
  rxcui?: string;
  score?: number;
  localSubstanceId?: string;
  localNameZh?: string;
  localNameEn?: string;
  href?: string;
};

function norm(s: string) {
  return s.trim().toLowerCase();
}

function mapToLocal(name: string): Omit<ResolveSuggestion, "name"> | null {
  const n = norm(name);
  for (const s of substances) {
    const keys = [s.nameEn, s.inn, s.nameZh, ...s.aliases].filter(Boolean) as string[];
    if (keys.some((k) => norm(k) === n || norm(k).includes(n) || n.includes(norm(k)))) {
      return {
        localSubstanceId: s.id,
        localNameZh: s.nameZh,
        localNameEn: s.nameEn,
        href: `/substances/${s.id}`,
      };
    }
  }
  return null;
}

type RxApprox = {
  approximateGroup?: {
    candidate?: Array<{
      rxcui?: string | number;
      name?: string;
      score?: string | number;
    }>;
  };
};

async function rxnormApproximate(term: string, maxEntries = 5): Promise<ResolveSuggestion[]> {
  const url = `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(term)}&maxEntries=${maxEntries}`;
  try {
    const data = await cachedFetch(
      `rxnorm:approx:${term.toLowerCase()}:${maxEntries}`,
      ONE_HOUR,
      async () => {
        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) throw new Error(`RxNorm HTTP ${res.status}`);
        return (await res.json()) as RxApprox;
      }
    );
    const cands = data?.approximateGroup?.candidate || [];
    const out: ResolveSuggestion[] = [];
    const seen = new Set<string>();
    for (const c of cands) {
      const name = (c.name || "").trim();
      if (!name) continue;
      const key = norm(name);
      if (seen.has(key)) continue;
      seen.add(key);
      const local = mapToLocal(name);
      out.push({
        name,
        rxcui: c.rxcui != null ? String(c.rxcui) : undefined,
        score: c.score != null ? Number(c.score) : undefined,
        ...(local || {}),
      });
    }
    return out;
  } catch {
    return [];
  }
}

async function findRxcuiByString(term: string): Promise<ResolveSuggestion[]> {
  const url = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(term)}&search=1`;
  try {
    const data = await cachedFetch(`rxnorm:rxcui:${term.toLowerCase()}`, ONE_HOUR, async () => {
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) throw new Error(`RxNorm rxcui HTTP ${res.status}`);
      return res.json() as Promise<{
        idGroup?: { rxnormId?: string[] };
      }>;
    });
    const ids = data?.idGroup?.rxnormId || [];
    if (!ids.length) return [];
    const local = mapToLocal(term);
    return [
      {
        name: term,
        rxcui: ids[0],
        ...(local || {}),
      },
    ];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (!q) {
    return NextResponse.json({ q, suggestions: [] as ResolveSuggestion[] });
  }
  if (q.length > 80) {
    return NextResponse.json({ error: "q too long" }, { status: 400 });
  }

  const [approx, byString] = await Promise.all([
    rxnormApproximate(q, 5),
    findRxcuiByString(q),
  ]);

  const merged: ResolveSuggestion[] = [];
  const seen = new Set<string>();
  for (const s of [...byString, ...approx]) {
    const k = `${s.rxcui || ""}:${norm(s.name)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    merged.push(s);
  }

  const localDirect = substances
    .filter((s) => {
      const blob = [s.nameZh, s.nameEn, s.inn, ...s.aliases].join(" ").toLowerCase();
      return blob.includes(norm(q));
    })
    .slice(0, 3)
    .map((s) => ({
      name: s.nameEn,
      localSubstanceId: s.id,
      localNameZh: s.nameZh,
      localNameEn: s.nameEn,
      href: `/substances/${s.id}`,
    }));

  for (const s of localDirect) {
    const k = `local:${s.localSubstanceId}`;
    if (seen.has(k)) continue;
    seen.add(k);
    merged.unshift(s);
  }

  return NextResponse.json({
    q,
    suggestions: merged.slice(0, 8),
    source: "RxNorm approximateTerm + findRxcuiByString (NLM) · local map",
    note: "英文名 / RxCUI 提示；映射到站内种子时提供链接。非药典全文。",
  });
}
