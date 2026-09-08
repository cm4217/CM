import { NextRequest, NextResponse } from "next/server";
import {
  isValidCas,
  loadDrafts,
  saveDrafts,
  slugFromIdentity,
  type DraftSubstance,
} from "@/lib/runtimeIndex";

export const dynamic = "force-dynamic";

export async function GET() {
  const drafts = loadDrafts();
  return NextResponse.json({
    count: drafts.length,
    drafts,
    note: "缓存草稿 · 身份层 · 非正式药典条目",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || body.nameEn || body.nameZh || "").trim();
    if (!name) {
      return NextResponse.json({ error: "缺少 name" }, { status: 400 });
    }
    let cas = body.cas ? String(body.cas).trim() : undefined;
    if (cas && !isValidCas(cas)) {
      // keep but flag — still allow draft
    }
    const unii = body.unii ? String(body.unii).trim() : undefined;
    const drafts = loadDrafts();
    const id =
      body.id ||
      slugFromIdentity({
        name,
        nameEn: body.nameEn,
        nameZh: body.nameZh,
        cas,
        unii,
        prefix: "draft",
      });
    const existing = drafts.findIndex(
      (d) =>
        d.id === id ||
        (cas && d.cas === cas) ||
        (unii && d.unii === unii) ||
        d.name.toLowerCase() === name.toLowerCase()
    );
    const row: DraftSubstance = {
      id,
      name,
      nameEn: body.nameEn ? String(body.nameEn).trim() : undefined,
      nameZh: body.nameZh ? String(body.nameZh).trim() : undefined,
      cas,
      unii,
      cid: body.cid,
      smiles: body.smiles ? String(body.smiles).trim() : undefined,
      source: String(body.source || "pubchem"),
      createdAt: new Date().toISOString(),
      status: "draft",
    };
    if (existing >= 0) drafts[existing] = { ...drafts[existing], ...row };
    else drafts.unshift(row);
    saveDrafts(drafts);
    return NextResponse.json({ ok: true, draft: row, count: drafts.length });
  } catch (e) {
    return NextResponse.json(
      { error: String((e as Error).message || e) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") || "";
  if (!id) {
    return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  }
  const drafts = loadDrafts().filter((d) => d.id !== id);
  saveDrafts(drafts);
  return NextResponse.json({ ok: true, count: drafts.length });
}
