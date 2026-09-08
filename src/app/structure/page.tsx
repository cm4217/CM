"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { DemoBadge } from "@/components/DemoBadge";
import type { KetcherHandle } from "@/components/KetcherSketcher";
import { substances, impurities } from "@/data";

const KetcherSketcher = dynamic(
  () =>
    import("@/components/KetcherSketcher").then((m) => m.KetcherSketcher),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[520px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
        正在加载结构画板…
      </div>
    ),
  }
);

type SearchResult = {
  smiles: string;
  mode: string;
  threshold?: number;
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
    similar?: { cid: number; score?: number }[];
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
  const ketcherRef = useRef<KetcherHandle>(null);
  const [smiles, setSmiles] = useState(EXAMPLES[0].smiles);
  const [molfile, setMolfile] = useState<string | null>(null);
  const [mode, setMode] = useState<"identity" | "similarity" | "substructure">("identity");
  const [threshold, setThreshold] = useState(90);
  const [loading, setLoading] = useState(false);
  const [boardBusy, setBoardBusy] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const localSeedHint = useMemo(() => {
    const withSmiles = [
      ...substances.filter((s) => s.smiles).map((s) => s.nameZh),
      ...impurities.filter((i) => i.smiles).map((i) => i.nameZh),
    ];
    return withSmiles.join("、");
  }, []);

  async function onSearch(overrideSmiles?: string) {
    const q = (overrideSmiles ?? smiles).trim();
    if (!q) {
      setError("请先从画板获取 SMILES，或在文本框中输入 SMILES");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/structure/search?smiles=${encodeURIComponent(q)}&mode=${mode}&threshold=${threshold}`
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

  async function fromBoard() {
    setBoardBusy(true);
    setError(null);
    try {
      const handle = ketcherRef.current;
      if (!handle) throw new Error("画板未就绪");
      const s = await handle.getSmiles();
      if (!s) throw new Error("画板为空，请先绘制结构");
      setSmiles(s);
      try {
        const mol = await handle.getMolfile();
        setMolfile(mol || null);
      } catch {
        setMolfile(null);
      }
    } catch (e) {
      setError(String((e as Error).message || e));
    } finally {
      setBoardBusy(false);
    }
  }

  async function clearBoard() {
    setBoardBusy(true);
    setError(null);
    try {
      await ketcherRef.current?.clear();
      setSmiles("");
      setMolfile(null);
    } catch (e) {
      setError(String((e as Error).message || e));
    } finally {
      setBoardBusy(false);
    }
  }

  async function fromBoardAndSearch() {
    setBoardBusy(true);
    setError(null);
    try {
      const handle = ketcherRef.current;
      if (!handle) throw new Error("画板未就绪");
      const s = await handle.getSmiles();
      if (!s) throw new Error("画板为空，请先绘制结构");
      setSmiles(s);
      try {
        const mol = await handle.getMolfile();
        setMolfile(mol || null);
      } catch {
        setMolfile(null);
      }
      setBoardBusy(false);
      await onSearch(s);
    } catch (e) {
      setError(String((e as Error).message || e));
      setBoardBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">结构检索</h1>
          <p className="mt-1 text-sm text-slate-500 font-latin">
            Ketcher 画板 · SMILES / MOL · PubChem
          </p>
        </div>
        <DemoBadge />
      </div>

      <DisclaimerBanner compact />

      <aside className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 space-y-2">
        <p>
          <strong>用法：</strong>
          在画板中绘制分子，点击「从画板获取 SMILES」填入文本框，再「检索」；或直接点「检索」从画板取 SMILES
          并查询。文本框仍可作为备用输入。结构图与 identity/similarity 由
          PubChem 提供；站内种子含 SMILES/InChIKey 时可精确命中。
        </p>
        <p className="text-xs text-slate-500">
          本地含结构：{localSeedHint || "—"}
        </p>
        <p className="text-xs text-slate-500">
          Ketcher 仅在浏览器加载（关闭 SSR）；首次打开包体较大，请稍候。
        </p>
      </aside>

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-slate-800">结构画板（Ketcher）</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={fromBoard}
              disabled={boardBusy}
              className="rounded-lg border border-teal-600 px-3 py-1.5 text-sm text-teal-800 hover:bg-teal-50 disabled:opacity-50"
            >
              从画板获取 SMILES
            </button>
            <button
              type="button"
              onClick={clearBoard}
              disabled={boardBusy}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              清空
            </button>
            <button
              type="button"
              onClick={fromBoardAndSearch}
              disabled={boardBusy || loading}
              className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
            >
              {loading ? "检索中…" : "检索"}
            </button>
          </div>
        </div>
        <KetcherSketcher ref={ketcherRef} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
        <label className="block text-sm font-medium text-slate-800">
          SMILES（文本备用输入）
        </label>
        <textarea
          value={smiles}
          onChange={(e) => setSmiles(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-latin focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="输入 SMILES，或从上方画板获取，例如 CC(=O)OC1=CC=CC=C1C(=O)O"
        />
        {molfile && (
          <details className="text-xs text-slate-600">
            <summary className="cursor-pointer select-none text-slate-500 hover:text-teal-700">
              MOL 文件（从画板获取）
            </summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-slate-50 p-2 font-latin whitespace-pre-wrap break-all">
              {molfile}
            </pre>
          </details>
        )}
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
          <label className="text-sm text-slate-700 flex items-center gap-2">
            <input
              type="radio"
              checked={mode === "substructure"}
              onChange={() => setMode("substructure")}
            />
            子结构 / Substructure
          </label>
          {mode === "similarity" && (
            <label className="text-sm text-slate-700 flex items-center gap-2">
              阈值 {threshold}%
              <input
                type="range"
                min={60}
                max={100}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
              />
            </label>
          )}
          <button
            type="button"
            onClick={() => onSearch()}
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
                        {s.cid}
                        {typeof (s as { score?: number }).score === "number"
                          ? ` · Tanimoto/score ${(s as { score?: number }).score}`
                          : ""}{" "}
                        ↗
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
