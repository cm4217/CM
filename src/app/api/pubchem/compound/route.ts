import { NextRequest, NextResponse } from "next/server";
import { cachedFetch, ONE_HOUR } from "@/lib/cache";

export const revalidate = 3600;

const PUG = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";

function pickProps(props: Record<string, unknown> | undefined) {
  if (!props) return {};
  return {
    cid: props.CID ?? props.Cid,
    molecularFormula: props.MolecularFormula,
    molecularWeight: props.MolecularWeight,
    inchiKey: props.InChIKey,
    iupacName: props.IUPACName,
    canonicalSMILES: props.CanonicalSMILES || props.ConnectivitySMILES,
  };
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const name = (sp.get("name") || "").trim();
  const cid = (sp.get("cid") || "").trim();
  const cas = (sp.get("cas") || "").trim();

  let path = "";
  let key = "";
  if (cid) {
    path = `compound/cid/${encodeURIComponent(cid)}`;
    key = `cid:${cid}`;
  } else if (cas) {
    path = `compound/name/${encodeURIComponent(cas)}`;
    key = `cas:${cas}`;
  } else if (name) {
    path = `compound/name/${encodeURIComponent(name)}`;
    key = `name:${name.toLowerCase()}`;
  } else {
    return NextResponse.json(
      { error: "请提供 name、cid 或 cas 之一" },
      { status: 400 }
    );
  }

  try {
    const payload = await cachedFetch(`pubchem:${key}`, ONE_HOUR, async () => {
      const propUrl = `${PUG}/${path}/property/MolecularFormula,MolecularWeight,InChIKey,IUPACName,CanonicalSMILES/JSON`;
      const synUrl = `${PUG}/${path}/synonyms/JSON`;

      const [propRes, synRes] = await Promise.all([
        fetch(propUrl, { next: { revalidate: 3600 } }),
        fetch(synUrl, { next: { revalidate: 3600 } }),
      ]);

      if (!propRes.ok) throw new Error(`PubChem property HTTP ${propRes.status}`);
      const propJson = await propRes.json();
      const props = propJson?.PropertyTable?.Properties?.[0];
      const picked = pickProps(props);
      const resolvedCid = picked.cid;

      let synonyms: string[] = [];
      if (synRes.ok) {
        const synJson = await synRes.json();
        synonyms =
          synJson?.InformationList?.Information?.[0]?.Synonym?.slice(0, 20) ||
          [];
      }

      const imageUrl = resolvedCid
        ? `https://pubchem.ncbi.nlm.nih.gov/image/imgsrv.fcgi?cid=${resolvedCid}&t=l`
        : null;

      return {
        ...picked,
        synonyms,
        imageUrl,
        pubchemUrl: resolvedCid
          ? `https://pubchem.ncbi.nlm.nih.gov/compound/${resolvedCid}`
          : null,
      };
    });

    return NextResponse.json({
      source: "PubChem PUG REST",
      live: true,
      label: "实时富化 · 公开 API",
      query: { name, cid, cas },
      data: payload,
    });
  } catch (e) {
    return NextResponse.json(
      {
        source: "PubChem PUG REST",
        live: false,
        error: String((e as Error).message || e),
        message: "PubChem 暂不可用，请保留站内种子数据。",
        query: { name, cid, cas },
      },
      { status: 502 }
    );
  }
}
