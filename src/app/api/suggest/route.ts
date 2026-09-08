import { NextRequest, NextResponse } from "next/server";
import { substances, impurities } from "@/data";
import { SYNONYM_CLUSTERS } from "@/lib/synonyms";
import { cachedFetch, ONE_HOUR } from "@/lib/cache";

export const revalidate = 3600;

export type SuggestItem = {
  source: "local" | "pubchem";
  kind?: "substance" | "impurity" | "synonym" | "cas";
  id?: string;
  label: string;
  labelZh?: string;
  labelEn?: string;
  href?: string;
  cas?: string;
  unii?: string;
};

export type SuggestGroupType = "品种" | "杂质" | "CAS" | "同义词" | "PubChem";

export type SuggestGroup = {
  type: SuggestGroupType;
  items: SuggestItem[];
};

function norm(s: string) {
  return s.trim().toLowerCase();
}

const CAS_RE = /^\d{2,7}-\d{2}-\d$/;

function looksLikeCas(q: string) {
  const t = q.trim().replace(/^cas\s*[:=]?\s*/i, "");
  return CAS_RE.test(t) || /^\d{2,7}-/.test(t);
}

function localBuckets(q: string, limitPer = 6) {
  const n = norm(q);
  const rawCas = q.trim().replace(/^cas\s*[:=]?\s*/i, "");
  const substancesOut: SuggestItem[] = [];
  const impuritiesOut: SuggestItem[] = [];
  const casOut: SuggestItem[] = [];
  const synonymOut: SuggestItem[] = [];
  const seen = new Set<string>();

  const push = (bucket: SuggestItem[], item: SuggestItem) => {
    const k = `${item.kind || item.source}:${item.id || item.label}`;
    if (seen.has(k)) return;
    seen.add(k);
    bucket.push(item);
  };

  for (const s of substances) {
    const casHit = s.cas && (norm(s.cas) === norm(rawCas) || norm(s.cas).startsWith(n));
    const blob = [s.nameZh, s.nameEn, s.inn, s.cas, s.unii, ...s.aliases]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const nameHit =
      blob.includes(n) ||
      norm(s.nameZh).startsWith(n) ||
      norm(s.nameEn).startsWith(n);
    if (!nameHit && !casHit) continue;
    const item: SuggestItem = {
      source: "local",
      kind: casHit && (looksLikeCas(q) || norm(s.cas || "") === n) ? "cas" : "substance",
      id: s.id,
      label: `${s.nameZh} / ${s.nameEn}`,
      labelZh: s.nameZh,
      labelEn: s.nameEn,
      href: `/substances/${s.id}`,
      cas: s.cas,
      unii: s.unii,
    };
    if (item.kind === "cas") push(casOut, item);
    else push(substancesOut, { ...item, kind: "substance" });
    if (casHit && item.kind !== "cas" && substancesOut.length <= limitPer) {
      push(casOut, { ...item, kind: "cas" });
    }
  }

  for (const i of impurities) {
    const casHit = i.cas && (norm(i.cas) === norm(rawCas) || norm(i.cas).startsWith(n));
    const blob = [i.nameZh, i.nameEn, i.chemicalName, i.cas, ...i.namingCrosswalk.map((x) => x.name)]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!blob.includes(n) && !casHit) continue;
    const item: SuggestItem = {
      source: "local",
      kind: casHit && (looksLikeCas(q) || norm(i.cas || "") === n) ? "cas" : "impurity",
      id: i.id,
      label: `${i.nameZh} / ${i.nameEn}`,
      labelZh: i.nameZh,
      labelEn: i.nameEn,
      href: `/impurities/${i.id}`,
      cas: i.cas,
      unii: i.unii,
    };
    if (item.kind === "cas") push(casOut, item);
    else push(impuritiesOut, { ...item, kind: "impurity" });
  }

  for (const cluster of SYNONYM_CLUSTERS) {
    if (cluster.some((t) => norm(t).includes(n) || n.includes(norm(t)))) {
      const primary = cluster[0];
      push(synonymOut, {
        source: "local",
        kind: "synonym",
        label: primary,
        labelZh: primary,
      });
    }
  }

  return {
    substances: substancesOut.slice(0, limitPer),
    impurities: impuritiesOut.slice(0, limitPer),
    cas: casOut.slice(0, limitPer),
    synonyms: synonymOut.slice(0, limitPer),
  };
}

async function pubchemSuggest(term: string, limit = 6): Promise<SuggestItem[]> {
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
    return NextResponse.json({ q, groups: [] as SuggestGroup[], suggestions: [] as SuggestItem[] });
  }
  if (q.length > 80) {
    return NextResponse.json({ error: "q too long" }, { status: 400 });
  }

  const local = localBuckets(q, 6);
  const pubchem = await pubchemSuggest(q, 6);

  const localLabels = new Set(
    [...local.substances, ...local.impurities, ...local.cas, ...local.synonyms].map(
      (s) => norm(s.labelEn || s.label)
    )
  );
  const pubFiltered = pubchem.filter((p) => !localLabels.has(norm(p.label)));

  const groups: SuggestGroup[] = [];
  if (local.substances.length) groups.push({ type: "品种", items: local.substances });
  if (local.impurities.length) groups.push({ type: "杂质", items: local.impurities });
  if (local.cas.length) groups.push({ type: "CAS", items: local.cas });
  if (local.synonyms.length) groups.push({ type: "同义词", items: local.synonyms });
  if (pubFiltered.length) groups.push({ type: "PubChem", items: pubFiltered.slice(0, 6) });

  const suggestions = groups.flatMap((g) => g.items).slice(0, 16);

  return NextResponse.json({
    q,
    groups,
    suggestions,
    sources: {
      local:
        local.substances.length +
        local.impurities.length +
        local.cas.length +
        local.synonyms.length,
      pubchem: pubFiltered.length,
    },
  });
}
