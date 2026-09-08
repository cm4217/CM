import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSubstance, substances } from "@/data";
import {
  getCompendialMatrix,
  hasRichCompendialMatrix,
} from "@/data/compendialMatrices";
import { CompendialMatrixTable } from "@/components/CompendialMatrixTable";
import { DemoBadge } from "@/components/DemoBadge";
import { DisclaimerBanner } from "@/components/Disclaimer";

type Props = { params: { id: string } };

export function generateStaticParams() {
  return substances.map((s) => ({ id: s.id }));
}

export function generateMetadata({ params }: Props): Metadata {
  const s = getSubstance(params.id);
  if (!s) return { title: "多药典详细对照" };
  return {
    title: `多药典详细对照 · ${s.nameZh}`,
    description: `示例对照矩阵（ChP/USP/EP/BP/JP/Ph.Int.）— ${s.nameZh} / ${s.nameEn}`,
  };
}

export default function CompendialComparePage({ params }: Props) {
  const s = getSubstance(params.id);
  if (!s) notFound();

  const matrix = getCompendialMatrix(s);

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap items-center gap-2 text-xs text-slate-500 print:hidden">
        <Link href="/search" className="hover:text-teal-800 hover:underline">
          检索
        </Link>
        <span aria-hidden>/</span>
        <Link
          href={`/substances/${s.id}`}
          className="hover:text-teal-800 hover:underline"
        >
          {s.nameZh}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-slate-700">多药典详细对照</span>
      </nav>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
          <DemoBadge />
          <span className="text-xs rounded-md bg-slate-100 px-2 py-0.5 text-slate-600">
            {s.type}
          </span>
          {hasRichCompendialMatrix(s.id) ? (
            <span className="text-xs rounded-md bg-sky-50 text-sky-900 px-2 py-0.5 ring-1 ring-sky-200">
              精选 DEMO
            </span>
          ) : null}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          多药典详细对照
          <span className="ml-2 text-lg font-normal text-slate-500">
            {s.nameZh}
            <span className="ml-1.5 font-latin text-base">{s.nameEn}</span>
          </span>
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl">
          行 = 属性，列 = ChP / USP / EP / BP / JP / Ph.Int.。叙述与限度单元格均为
          <strong className="font-medium"> 示例数据</strong>
          ，请以现行官方药典为准。
        </p>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Link
            href={`/substances/${s.id}`}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50 no-underline"
          >
            ← 物质详情
          </Link>
          <Link
            href={`/compare?a=${encodeURIComponent(s.id)}`}
            className="rounded-lg border border-indigo-500 bg-white px-2.5 py-1 text-xs font-medium text-indigo-800 hover:bg-indigo-50 no-underline"
          >
            打开对比页
          </Link>
        </div>
      </div>

      <div className="sticky top-0 z-20 -mx-1 px-1 py-2 bg-slate-50/95 backdrop-blur-sm border-b border-amber-200/60 print:static print:border-0 print:bg-transparent">
        <aside
          className="border-l-4 border-amber-500 bg-amber-50 text-amber-950 px-3 py-2 text-xs sm:text-sm"
          role="note"
        >
          <p className="font-medium leading-relaxed">
            示例对照 · 限度与方法以现行官方药典为准 · 本站不替代法定文本
          </p>
        </aside>
      </div>

      <DisclaimerBanner compact />

      <CompendialMatrixTable substance={s} matrix={matrix} />

      {!matrix.rich ? (
        <p className="text-sm text-slate-600 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3">
          本物质为元数据级对照。精选 DEMO 叙述矩阵目前覆盖阿司匹林等少数条目；开放索引物质请通过底部「查看原文」进入官方入口。
        </p>
      ) : null}
    </div>
  );
}
