import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getImpurity,
  getSubstance,
  getReferenceMaterial,
  impurities,
} from "@/data";
import { CopyrightBadge } from "@/components/CopyrightBadge";
import { DemoBadge } from "@/components/DemoBadge";
import { DisclaimerBanner } from "@/components/Disclaimer";
import type { Metadata } from "next";

type Props = { params: { id: string } };

export function generateStaticParams() {
  return impurities.map((i) => ({ id: i.id }));
}

export function generateMetadata({ params }: Props): Metadata {
  const i = getImpurity(params.id);
  if (!i) return { title: "杂质未找到" };
  return { title: `${i.nameZh} / ${i.nameEn}` };
}

export default function ImpurityPage({ params }: Props) {
  const i = getImpurity(params.id);
  if (!i) notFound();

  const parents = i.parentSubstanceIds
    .map((id) => getSubstance(id))
    .filter(Boolean);
  const rsList = i.relatedRSIds
    .map((id) => getReferenceMaterial(id))
    .filter(Boolean);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <DemoBadge />
          <span className="text-xs rounded-md bg-rose-50 text-rose-800 px-2 py-0.5">
            {i.type}
          </span>
          {i.ichTags.map((t) => (
            <span
              key={t}
              className="text-xs rounded-md bg-indigo-50 text-indigo-800 px-2 py-0.5 font-latin"
            >
              {t}
            </span>
          ))}
        </div>
        <h1 className="text-3xl font-bold text-slate-900">
          {i.nameZh}{" "}
          <span className="text-xl font-normal text-slate-500 font-latin">
            {i.nameEn}
          </span>
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">{i.summaryZh}</p>
        <p className="text-xs text-slate-400 font-latin max-w-3xl">{i.summaryEn}</p>
      </div>

      <DisclaimerBanner />

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs text-slate-500">化学名</p>
          <p className="mt-1 text-sm font-latin">{i.chemicalName || "—"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs text-slate-500">CAS</p>
          <p className="mt-1 text-sm font-latin">{i.cas || "—"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs text-slate-500">类型</p>
          <p className="mt-1 text-sm">{i.type}</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">命名交叉 Naming Crosswalk</h2>
        <p className="text-sm text-slate-500">
          EP Impurity 字母 ↔ 化学名 ↔ CAS ↔ USP/ChP 名称对照（示例）
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="prose-table min-w-[520px]">
            <thead>
              <tr>
                <th>体系</th>
                <th>名称</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {i.namingCrosswalk.map((row, idx) => (
                <tr key={`${row.system}-${idx}`}>
                  <td className="font-medium text-teal-900 font-latin">{row.system}</td>
                  <td className="font-latin">{row.name}</td>
                  <td className="text-xs text-slate-500">{row.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">父化合物 Parents</h2>
          <ul className="space-y-2">
            {parents.map(
              (p) =>
                p && (
                  <li key={p.id}>
                    <Link
                      href={`/substances/${p.id}`}
                      className="block rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-teal-300"
                    >
                      {p.nameZh}{" "}
                      <span className="text-slate-500 font-latin text-sm">{p.nameEn}</span>
                    </Link>
                  </li>
                )
            )}
          </ul>
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">对照品 RS</h2>
          {rsList.length === 0 ? (
            <p className="text-sm text-slate-500">暂无关联对照品（示例）</p>
          ) : (
            <ul className="space-y-2">
              {rsList.map(
                (r) =>
                  r && (
                    <li key={r.id}>
                      <Link
                        href={`/reference-standards#${r.id}`}
                        className="block rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-teal-300"
                      >
                        <p className="font-medium">
                          {r.nameZh}{" "}
                          <span className="text-sm text-slate-500 font-latin">{r.nameEn}</span>
                        </p>
                        <p className="text-xs font-latin text-slate-500 mt-1">
                          {r.issuer} · {r.catalogCode}
                        </p>
                        <div className="mt-2">
                          <CopyrightBadge status={r.copyrightStatus} />
                        </div>
                      </Link>
                    </li>
                  )
              )}
            </ul>
          )}
          <p className="text-xs text-slate-500">
            ICH 标签：{i.ichTags.join(" · ") || "—"} ·{" "}
            <a
              href="https://database.ich.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-700 hover:underline"
            >
              ICH 数据库 ↗
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
