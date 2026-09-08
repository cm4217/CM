import { NextRequest, NextResponse } from "next/server";
import { substances, impurities } from "@/data";
import { cachedFetch, ONE_HOUR } from "@/lib/cache";

export const revalidate = 3600;

const PUG = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";

export async function GET(req: NextRequest) {
  const smiles = (req.nextUrl.searchParams.get("smiles") || "").trim();
  const mode = (req.nextUrl.searchParams.get("mode") || "identity").trim(); // identity | similarity
  if (!smiles) {
    return NextResponse.json({ error: "请提供 smiles 参数" }, { status: 400 });
  }

  const localMatches = [
    ...substances
      .filter(
        (s) =>
          s.smiles &&
          (s.smiles === smiles ||
            s.smiles.replace(/\s/g, "") === smiles.replace(/\s/g, ""))
      )
      .map((s) => ({
        kind: "substance" as const,
        id: s.id,
        nameZh: s.nameZh,
        nameEn: s.nameEn,
        cas: s.cas,
        smiles: s.smiles,
        href: `/substances/${s.id}`,
      })),
    ...impurities
      .filter(
        (i) =>
          i.smiles &&
          (i.smiles === smiles ||
            i.smiles.replace(/\s/g, "") === smiles.replace(/\s/g, ""))
      )
      .map((i) => ({
        kind: "impurity" as const,
        id: i.id,
        nameZh: i.nameZh,
        nameEn: i.nameEn,
        cas: i.cas,
        smiles: i.smiles,
        href: `/impurities/${i.id}`,
      })),
  ];

  // Also fuzzy: match by InChIKey from PubChem against local
  let pubchem: {
    live: boolean;
    cid?: number;
    inchiKey?: string;
    formula?: string;
    imageUrl?: string;
    pubchemUrl?: string;
    similar?: { cid: number; score?: number }[];
    error?: string;
  } = { live: false };

  try {
    pubchem = await cachedFetch(
      `struct:${mode}:${smiles}`,
      ONE_HOUR,
      async () => {
        const propRes = await fetch(
          `${PUG}/compound/smiles/${encodeURIComponent(smiles)}/property/InChIKey,MolecularFormula,CanonicalSMILES/JSON`,
          { next: { revalidate: 3600 } }
        );
        if (!propRes.ok) throw new Error(`PubChem ${propRes.status}`);
        const pj = await propRes.json();
        const props = pj?.PropertyTable?.Properties?.[0];
        const cid = props?.CID as number | undefined;
        const inchiKey = props?.InChIKey as string | undefined;
        const formula = props?.MolecularFormula as string | undefined;

        let similar: { cid: number; score?: number }[] = [];
        if (mode === "similarity" && cid) {
          const simRes = await fetch(
            `${PUG}/compound/fastsimilarity_2d/cid/${cid}/cids/JSON?Threshold=90&MaxRecords=10`,
            { next: { revalidate: 3600 } }
          );
          if (simRes.ok) {
            const sj = await simRes.json();
            const cids: number[] = sj?.IdentifierList?.CID || [];
            similar = cids.slice(0, 10).map((c) => ({ cid: c }));
          }
        }

        return {
          live: true,
          cid,
          inchiKey,
          formula,
          imageUrl: cid
            ? `https://pubchem.ncbi.nlm.nih.gov/image/imgsrv.fcgi?cid=${cid}&t=l`
            : `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(smiles)}/PNG`,
          pubchemUrl: cid
            ? `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`
            : undefined,
          similar,
        };
      }
    );
  } catch (e) {
    pubchem = {
      live: false,
      error: String((e as Error).message || e),
      imageUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(smiles)}/PNG`,
    };
  }

  // Cross-link local by InChIKey
  const byKey = pubchem.inchiKey
    ? [
        ...substances
          .filter((s) => s.inchiKey === pubchem.inchiKey)
          .map((s) => ({
            kind: "substance" as const,
            id: s.id,
            nameZh: s.nameZh,
            nameEn: s.nameEn,
            cas: s.cas,
            smiles: s.smiles,
            href: `/substances/${s.id}`,
          })),
        ...impurities
          .filter((i) => i.inchiKey === pubchem.inchiKey)
          .map((i) => ({
            kind: "impurity" as const,
            id: i.id,
            nameZh: i.nameZh,
            nameEn: i.nameEn,
            cas: i.cas,
            smiles: i.smiles,
            href: `/impurities/${i.id}`,
          })),
      ]
    : [];

  const seen = new Set<string>();
  const local = [...localMatches, ...byKey].filter((m) => {
    const k = `${m.kind}:${m.id}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return NextResponse.json({
    smiles,
    mode,
    local,
    pubchem,
    note: "结构检索：Ketcher 画板 / SMILES + PubChem。结构图来自 PubChem 公开服务。",
  });
}
