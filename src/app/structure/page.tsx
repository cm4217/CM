"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { DemoBadge } from "@/components/DemoBadge";
import { substances, impurities } from "@/data";

type SearchResult = {
  smiles: string;
  mode: string;
  local: {
    kind: string;
    id: string;
    nameZh: string;
    nameEn: string;
    cas?: string;
    href: string;
  }[];
  pubchem: {
    live: boolean;
    cid?: number;
    inchiKey?: string;
    formula?: string;
    imageUrl?: string;
    pubchemUrl?: string;
    similar?: { cid: number }[];
    error?: string;
  };
  note?: string;
};

const EXAMPLES = [
  { label: "Aspirin", smiles: "CC(=O)OC1=CC=CC=C1C(=O)O" },
  { label: "Ibuprofen", smiles: "CC(C)CC1=CC=C(C=C1)C(C)C(=O)O" },
  { label: "NDMA", smiles: "CN(C)N=O" },
  { label: "Salicylic acid", smiles: "OC(=O)C1=CC=CC=C1O" },
];

export default function StructurePage() {
  const [smiles, setSmiles] = useState(EXAMPLES[0].smiles);
  const [mode, setMode] = useState<"identity" | "similarity">("identity");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const localSeedHint = useMemo(() => {
    const withSmiles = [
      ...substances.filter((s) => s.smiles).map((s) => s.nameZh),
      ...impurities.filter((i) => i.smiles).map((i) => i.nameZh),
    ];
    return withSmiles.join("、");
  }, []);

  async function onSearch() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/structure/search?smiles=${encodeURIComponent(smiles.trim())}&mode=${mode}`
      );
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "检索失败");
      setResult(j);
    } catch (e) {
      setError(String((e as Error).message || e));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">结构检索</h1>
          <p className="mt-1 text-sm text-slate-500 font-latin">
            SMILES + PubChem · Ketcher deferred for build size
          </p>
        </div>
        <DemoBadge />
      </div>

      <DisclaimerBanner compact />

      <aside className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 space-y-2">
        <p>
          <strong>实现选择：</strong>未集成 Ketcher（构建体积/兼容性风险），改用
          SMILES 文本输入 + PubChem identity/similarity + PubChem 2D
          结构图。站内种子含 SMILES/InChIKey 时可精确命中。
        </p>
        <p className="text-xs text-slate-500">
          本地含结构：{localSeedHint || "—"}
        </p>
      </aside>

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
        <label className="block text-sm font-medium text-slate-800">
          SMILES
        </label>
        <textarea
          value={smiles}
          onChange={(e) => setSmiles(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-latin focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="输入 SMILES，例如 CC(=O)OC1=CC=CC=C1C(=O)O"
        />
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => setSmiles(ex.smiles)}
              className="text-xs rounded-full border border-slate-200 px-3 py-1 hover:border-teal-400 hover:bg-teal-50"
            >
              {ex.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-slate-700 flex items-center gap-2">
            <input
              type="radio"
              checked={mode === "identity"}
              onChange={() => setMode("identity")}
            />
            精确 / Identity
          </label>
          <label className="text-sm text-slate-700 flex items-center gap-2">
            <input
              type="radio"
              checked={mode === "similarity"}
              onChange={() => setMode("similarity")}
            />
            相似 / Similarity
          </label>
          <button
            type="button"
            onClick={onSearch}
            disabled={loading || !smiles.trim()}
            className="ml-auto rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {loading ? "检索中…" : "检索结构"}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {result && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <h2 className="font-semibold">结构预览（PubChem）</h2>
            {result.pubchem.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.pubchem.imageUrl}
                alt="structure"
                className="mx-auto h-48 w-48 object-contain"
              />
            ) : (
              <p className="text-sm text-slate-500">无结构图</p>
            )}
            <dl className="text-xs grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt className="text-slate-500">CID</dt>
              <dd className="font-latin">{result.pubchem.cid ?? "—"}</dd>
              <dt className="text-slate-500">Formula</dt>
              <dd className="font-latin">{result.pubchem.formula ?? "—"}</dd>
              <dt className="text-slate-500">InChIKey</dt>
              <dd className="font-latin break-all">
                {result.pubchem.inchiKey ?? "—"}
              </dd>
            </dl>
            {!result.pubchem.live && (
              <p className="text-xs text-amber-800">
                PubChem 实时查询失败：{result.pubchem.error || "未知"}（仍可查看站内命中）
              </p>
            )}
            {result.pubchem.pubchemUrl && (
              <a
                href={result.pubchem.pubchemUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-teal-700 hover:underline"
              >
                PubChem ↗
              </a>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <h2 className="font-semibold">站内命中</h2>
            {result.local.length === 0 ? (
              <p className="text-sm text-slate-500">无本地 SMILES/InChIKey 命中</p>
            ) : (
              <ul className="space-y-2">
                {result.local.map((m) => (
                  <li key={`${m.kind}-${m.id}`}>
                    <Link
                      href={m.href}
                      className="block rounded-lg border border-slate-100 px-3 py-2 hover:border-teal-300"
                    >
                      <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded mr-2">
                        {m.kind}
                      </span>
                      {m.nameZh}{" "}
                      <span className="text-slate-500 font-latin text-sm">
                        {m.nameEn}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {result.pubchem.similar && result.pubchem.similar.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <h3 className="text-sm font-medium mb-2">PubChem 相似 CID</h3>
                <ul className="flex flex-wrap gap-2 text-xs font-latin">
                  {result.pubchem.similar.map((s) => (
                    <li key={s.cid}>
                      <a
                        href={`https://pubchem.ncbi.nlm.nih.gov/compound/${s.cid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-700 hover:underline"
                      >
                        {s.cid} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
