import { NextRequest, NextResponse } from "next/server";
import { substances } from "@/data";
import { cachedFetch, ONE_HOUR } from "@/lib/cache";

export const revalidate = 3600;

/** RxNorm approximateTerm score is 0–100 style; keep modest threshold */
const MIN_APPROX_SCORE = 40;

export type ResolveSuggestion = {
  name: string;
  rxcui?: string;
  score?: number;
  /** 0–1 confidence for UI */
  confidence?: number;
  localSubstanceId?: string;
  localNameZh?: string;
  localNameEn?: string;
  href?: string;
  source?: "rxcui" | "approximate" | "local";
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

function scoreToConfidence(score?: number, exactRxcui = false): number {
  if (exactRxcui) return 0.95;
  if (score == null || Number.isNaN(score)) return 0.5;
  // approximateTerm scores often 0–100
  const c = Math.min(1, Math.max(0, score / 100));
  return Math.round(c * 100) / 100;
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

async function rxnormApproximate(term: string, maxEntries = 8): Promise<ResolveSuggestion[]> {
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
      const score = c.score != null ? Number(c.score) : undefined;
      if (typeof score === "number" && score < MIN_APPROX_SCORE) continue;
      const key = norm(name);
      if (seen.has(key)) continue;
      seen.add(key);
      const local = mapToLocal(name);
      out.push({
        name,
        rxcui: c.rxcui != null ? String(c.rxcui) : undefined,
        score,
        confidence: scoreToConfidence(score),
        source: "approximate",
        ...(local || {}),
      });
    }
    return out;
  } catch {
    return [];
  }
}

async function findRxcuiByString(term: string): Promise<ResolveSuggestion[]> {
  // search=1 enables approximate matching on findRxcuiByString
  const url = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(term)}&search=1`;
  try {
    const data = await cachedFetch(`rxnorm:rxcui:s1:${term.toLowerCase()}`, ONE_HOUR, async () => {
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
        confidence: scoreToConfidence(undefined, true),
        source: "rxcui",
        ...(local || {}),
      },
    ];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  const minScore = Number(req.nextUrl.searchParams.get("minScore") || MIN_APPROX_SCORE);
  if (!q) {
    return NextResponse.json({ q, suggestions: [] as ResolveSuggestion[] });
  }
  if (q.length > 80) {
    return NextResponse.json({ error: "q too long" }, { status: 400 });
  }

  const [approxRaw, byString] = await Promise.all([
    rxnormApproximate(q, 8),
    findRxcuiByString(q),
  ]);
  const approx = approxRaw.filter(
    (s) => s.score == null || s.score >= (Number.isFinite(minScore) ? minScore : MIN_APPROX_SCORE)
  );

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
      confidence: 0.9,
      source: "local" as const,
    }));

  for (const s of localDirect) {
    const k = `local:${s.localSubstanceId}`;
    if (seen.has(k)) continue;
    seen.add(k);
    merged.unshift(s);
  }

  merged.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

  return NextResponse.json({
    q,
    suggestions: merged.slice(0, 8),
    minScore: Number.isFinite(minScore) ? minScore : MIN_APPROX_SCORE,
    source: "RxNorm search=1 + approximateTerm (NLM) · local map",
    note: "英文名 / RxCUI 名称归一；映射到站内种子时提供链接。非药典全文。",
  });
}
