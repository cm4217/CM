import { NextRequest, NextResponse } from "next/server";
import { relatedFromEvents } from "@/lib/server/searchEvents";
import { substances, impurities, referenceMaterials } from "@/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RelatedItem = {
  id: string;
  kind: string;
  labelZh: string;
  labelEn?: string;
  href: string;
  note: string;
  score: number;
};

function resolveEntity(id: string, kindHint?: string): RelatedItem | null {
  if (!id) return null;
  const sub = substances.find((s) => s.id === id);
  if (sub && (!kindHint || kindHint === "substance")) {
    return {
      id: sub.id,
      kind: "substance",
      labelZh: sub.nameZh,
      labelEn: sub.nameEn,
      href: `/substances/${sub.id}`,
      note: "服务端共现",
      score: 0,
    };
  }
  const imp = impurities.find((i) => i.id === id);
  if (imp && (!kindHint || kindHint === "impurity")) {
    return {
      id: imp.id,
      kind: "impurity",
      labelZh: imp.nameZh,
      labelEn: imp.nameEn,
      href: `/impurities/${imp.id}`,
      note: "服务端共现",
      score: 0,
    };
  }
  const rs = referenceMaterials.find((r) => r.id === id);
  if (rs && (!kindHint || kindHint === "rs")) {
    return {
      id: rs.id,
      kind: "rs",
      labelZh: rs.nameZh,
      labelEn: rs.nameEn,
      href: `/reference-standards#${rs.id}`,
      note: "服务端共现",
      score: 0,
    };
  }
  // try without kind hint
  if (kindHint) return resolveEntity(id, undefined);
  return null;
}

/** Cold-start: same pharmacopoeia coverage peers or related impurities from seed. */
function coldStart(focusId: string, limit: number): RelatedItem[] {
  const sub = substances.find((s) => s.id === focusId);
  if (!sub) return [];
  const out: RelatedItem[] = [];
  for (const iid of sub.relatedImpurityIds.slice(0, 4)) {
    const imp = impurities.find((i) => i.id === iid);
    if (!imp) continue;
    out.push({
      id: imp.id,
      kind: "impurity",
      labelZh: imp.nameZh,
      labelEn: imp.nameEn,
      href: `/impurities/${imp.id}`,
      note: "种子关联杂质",
      score: 0.5,
    });
  }
  const codes = new Set(sub.monographRefs.map((m) => m.pharmacopoeia));
  for (const peer of substances) {
    if (out.length >= limit) break;
    if (peer.id === focusId) continue;
    const overlap = peer.monographRefs.filter((m) => codes.has(m.pharmacopoeia))
      .length;
    if (overlap < 2) continue;
    out.push({
      id: peer.id,
      kind: "substance",
      labelZh: peer.nameZh,
      labelEn: peer.nameEn,
      href: `/substances/${peer.id}`,
      note: "冷启动·覆盖相近",
      score: overlap * 0.2,
    });
  }
  return out.slice(0, limit);
}

export async function GET(req: NextRequest) {
  const id = (req.nextUrl.searchParams.get("id") || "").trim();
  const kind = (req.nextUrl.searchParams.get("kind") || "").trim() || undefined;
  const q = (req.nextUrl.searchParams.get("q") || "").trim() || undefined;
  const limit = Math.min(
    12,
    Math.max(1, Number(req.nextUrl.searchParams.get("limit") || 8) || 8)
  );

  if (!id) {
    return NextResponse.json({
      items: [],
      hint: "GET /api/related?id=<entityId>&kind=substance|impurity|rs&q=",
    });
  }

  const scored = relatedFromEvents(id, { kind, limit: limit * 2, q });
  const items: RelatedItem[] = [];
  const seen = new Set<string>();

  for (const s of scored) {
    if (items.length >= limit) break;
    const resolved = resolveEntity(s.id, s.kind);
    if (!resolved) continue;
    const k = `${resolved.kind}:${resolved.id}`;
    if (seen.has(k)) continue;
    seen.add(k);
    const note =
      s.source === "co-click"
        ? "共点击"
        : s.source === "query-coclick"
          ? "同查询共点"
          : "同会话";
    items.push({ ...resolved, note, score: s.score });
  }

  let source: "server" | "cold-start" | "mixed" = items.length
    ? "server"
    : "cold-start";
  if (items.length < Math.min(3, limit)) {
    for (const c of coldStart(id, limit)) {
      if (items.length >= limit) break;
      const k = `${c.kind}:${c.id}`;
      if (seen.has(k)) continue;
      seen.add(k);
      items.push(c);
    }
    if (source === "server" && items.some((i) => i.note.startsWith("冷启动") || i.note === "种子关联杂质")) {
      source = "mixed";
    } else if (!scored.length) {
      source = "cold-start";
    }
  }

  return NextResponse.json({
    id,
    items: items.slice(0, limit),
    source,
  });
}
