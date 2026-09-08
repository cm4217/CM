import { NextRequest, NextResponse } from "next/server";
import { cachedFetch, ONE_HOUR } from "@/lib/cache";

export const revalidate = 3600;

const PUG = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";

/**
 * Server-side PubChem compound resolve (CID / formula / InChIKey).
 * Browser must not call PubChem directly — use this + /api/chem/image.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const name = (sp.get("name") || "").trim();
  const cid = (sp.get("cid") || "").trim();
  const cas = (sp.get("cas") || "").trim();

  let path = "";
  let key = "";
  if (cid) {
    path = `compound/cid/${encodeURIComponent(cid)}`;
    key = `chem:cid:${cid}`;
  } else if (cas) {
    path = `compound/name/${encodeURIComponent(cas)}`;
    key = `chem:cas:${cas}`;
  } else if (name) {
    path = `compound/name/${encodeURIComponent(name)}`;
    key = `chem:name:${name.toLowerCase()}`;
  } else {
    return NextResponse.json(
      { error: "请提供 name、cid 或 cas 之一" },
      { status: 400 }
    );
  }

  try {
    const payload = await cachedFetch(key, ONE_HOUR, async () => {
      const propUrl = `${PUG}/${path}/property/MolecularFormula,MolecularWeight,InChIKey,IUPACName/JSON`;
      const propRes = await fetch(propUrl, { next: { revalidate: 3600 } });
      if (!propRes.ok) throw new Error(`PubChem HTTP ${propRes.status}`);
      const propJson = await propRes.json();
      const props = propJson?.PropertyTable?.Properties?.[0] || {};
      const resolvedCid = props.CID ?? props.Cid ?? null;
      return {
        cid: resolvedCid,
        molecularFormula: props.MolecularFormula ?? null,
        molecularWeight: props.MolecularWeight ?? null,
        inchiKey: props.InChIKey ?? null,
        iupacName: props.IUPACName ?? null,
        /** Proxied image path — do not expose raw PubChem CDN to browser as sole path */
        imagePath: resolvedCid
          ? `/api/chem/image?cid=${encodeURIComponent(String(resolvedCid))}`
          : null,
        pubchemUrl: resolvedCid
          ? `https://pubchem.ncbi.nlm.nih.gov/compound/${resolvedCid}`
          : null,
      };
    });

    return NextResponse.json({
      source: "PubChem PUG REST (server proxy)",
      live: true,
      query: { name, cid, cas },
      data: payload,
    });
  } catch (e) {
    return NextResponse.json(
      {
        source: "PubChem PUG REST (server proxy)",
        live: false,
        error: String((e as Error).message || e),
        message: "PubChem 暂不可用",
        query: { name, cid, cas },
      },
      { status: 502 }
    );
  }
}
