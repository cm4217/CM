import { NextRequest, NextResponse } from "next/server";
import { cachedFetch, ONE_HOUR } from "@/lib/cache";

export const revalidate = 3600;

const PUG = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";
const IMG = "https://pubchem.ncbi.nlm.nih.gov/image/imgsrv.fcgi";

/**
 * Server proxy for PubChem PNG. Browser must use this URL, not PubChem CDN directly.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  let cid = (sp.get("cid") || "").trim();
  const cas = (sp.get("cas") || "").trim();
  const name = (sp.get("name") || "").trim();

  try {
    if (!cid && (cas || name)) {
      const key = cas || name;
      const path = `compound/name/${encodeURIComponent(key)}`;
      const resolved = await cachedFetch(
        `chem:resolve:${key.toLowerCase()}`,
        ONE_HOUR,
        async () => {
          const url = `${PUG}/${path}/cids/JSON`;
          const res = await fetch(url, { next: { revalidate: 3600 } });
          if (!res.ok) throw new Error(`resolve HTTP ${res.status}`);
          const j = await res.json();
          const c =
            j?.IdentifierList?.CID?.[0] ??
            j?.InformationList?.Information?.[0]?.CID?.[0];
          if (!c) throw new Error("no CID");
          return String(c);
        }
      );
      cid = resolved;
    }

    if (!cid || !/^\d+$/.test(cid)) {
      return NextResponse.json({ error: "需要有效 cid / cas / name" }, { status: 400 });
    }

    const buf = await cachedFetch(
      `chem:png:${cid}`,
      ONE_HOUR * 6,
      async () => {
        const url = `${IMG}?cid=${encodeURIComponent(cid)}&t=l`;
        const res = await fetch(url, { next: { revalidate: 21600 } });
        if (!res.ok) throw new Error(`image HTTP ${res.status}`);
        const ab = await res.arrayBuffer();
        return Buffer.from(ab).toString("base64");
      }
    );

    const bytes = Buffer.from(buf, "base64");
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=21600, s-maxage=21600",
        "X-Chem-Proxy": "pubchem-png",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: String((e as Error).message || e) },
      { status: 502 }
    );
  }
}
