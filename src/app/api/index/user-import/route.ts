import { NextRequest, NextResponse } from "next/server";
import {
  isValidCas,
  loadUserImports,
  saveUserImports,
  slugFromIdentity,
  type UserImportRecord,
} from "@/lib/runtimeIndex";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = loadUserImports();
  return NextResponse.json({
    count: rows.length,
    records: rows,
    note: "用户 CSV 导入 · 身份层",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const incoming = Array.isArray(body.records) ? body.records : [body];
    const existing = loadUserImports();
    const byKey = new Map<string, UserImportRecord>();
    for (const r of existing) {
      const k = (r.unii || r.cas || r.nameEn || r.nameZh || r.id).toLowerCase();
      byKey.set(k, r);
    }
    let added = 0;
    for (const raw of incoming) {
      const nameEn = raw.nameEn ? String(raw.nameEn).trim() : undefined;
      const nameZh = raw.nameZh ? String(raw.nameZh).trim() : undefined;
      let cas = raw.cas ? String(raw.cas).trim() : undefined;
      if (cas && !isValidCas(cas)) cas = undefined;
      const unii = raw.unii ? String(raw.unii).trim() : undefined;
      const synonyms = Array.isArray(raw.synonyms)
        ? raw.synonyms.map(String)
        : String(raw.synonyms || "")
            .split(/[|;,/]/)
            .map((s: string) => s.trim())
            .filter(Boolean);
      if (!nameEn && !nameZh && !cas && !unii) continue;
      const id =
        raw.id ||
        slugFromIdentity({ nameEn, nameZh, cas, unii, prefix: "user" });
      const key = (unii || cas || nameEn || nameZh || id).toLowerCase();
      const row: UserImportRecord = {
        id,
        nameEn,
        nameZh,
        cas,
        unii,
        synonyms,
        importedAt: new Date().toISOString(),
      };
      if (!byKey.has(key)) added++;
      byKey.set(key, row);
    }
    const rows = Array.from(byKey.values());
    saveUserImports(rows);
    return NextResponse.json({
      ok: true,
      added,
      count: rows.length,
    });
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
    // clear all if ?all=1
    if (req.nextUrl.searchParams.get("all") === "1") {
      saveUserImports([]);
      return NextResponse.json({ ok: true, count: 0 });
    }
    return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  }
  const rows = loadUserImports().filter((r) => r.id !== id);
  saveUserImports(rows);
  return NextResponse.json({ ok: true, count: rows.length });
}
