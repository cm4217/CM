import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getSubstance,
  getImpurity,
  getReferenceMaterial,
  substances,
} from "@/data";
import { CopyrightBadge } from "@/components/CopyrightBadge";
import { DemoBadge } from "@/components/DemoBadge";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { LiveEnrichment } from "@/components/LiveEnrichment";
import type { Metadata } from "next";

type Props = { params: { id: string } };

export function generateStaticParams() {
  return substances.map((s) => ({ id: s.id }));
}

export function generateMetadata({ params }: Props): Metadata {
  const s = getSubstance(params.id);
  if (!s) return { title: "物质未找到" };
  return { title: `${s.nameZh} / ${s.nameEn}` };
}

export default function SubstancePage({ params }: Props) {
  const s = getSubstance(params.id);
  if (!s) notFound();

  const relatedImpurities = s.relatedImpurityIds
    .map((id) => getImpurity(id))
    .filter(Boolean);
  const relatedRS = s.relatedRSIds
    .map((id) => getReferenceMaterial(id))
    .filter(Boolean);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <DemoBadge />
          <span className="text-xs rounded-md bg-slate-100 px-2 py-0.5 text-slate-600">
            {s.type}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900">
          {s.nameZh}{" "}
          <span className="text-xl font-normal text-slate-500 font-latin">
            {s.nameEn}
          </span>
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">{s.summaryZh}</p>
        <p className="text-xs text-slate-400 font-latin max-w-3xl">{s.summaryEn}</p>
      </div>

      <DisclaimerBanner />

      <LiveEnrichment name={s.nameEn} cas={s.cas} unii={s.unii} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="INN" value={s.inn || "—"} />
        <InfoCard label="CAS" value={s.cas || "—"} latin />
        <InfoCard label="UNII" value={s.unii || "—"} latin />
        <InfoCard label="别名" value={s.aliases.join(" · ")} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          专论引用 MonographRefs
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="prose-table min-w-[720px]">
            <thead>
              <tr>
                <th>药典</th>
                <th>专论</th>
                <th>版本</th>
                <th>效力</th>
                <th>RS</th>
                <th>版权</th>
                <th>官方</th>
              </tr>
            </thead>
            <tbody>
              {s.monographRefs.map((m) => (
                <tr key={m.id}>
                  <td className="font-medium text-teal-900">{m.pharmacopoeia}</td>
                  <td>
                    <div>{m.monographTitleZh || m.monographTitle}</div>
                    <div className="text-xs text-slate-400 font-latin">
                      {m.monographTitle}
                    </div>
                  </td>
                  <td className="font-latin text-xs">{m.version}</td>
                  <td className="text-xs">{m.efficacy}</td>
                  <td>{m.hasRS ? "有" : "—"}</td>
                  <td>
                    <CopyrightBadge status={m.copyrightStatus} />
                  </td>
                  <td>
                    <a
                      href={m.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-700 hover:underline text-xs"
                    >
                      深链 ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500">
          不含专论全文。版权标记：可用摘要 / 需授权 / 仅深链。
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">相关杂质</h2>
          <ul className="space-y-2">
            {relatedImpurities.map(
              (i) =>
                i && (
                  <li key={i.id}>
                    <Link
                      href={`/impurities/${i.id}`}
                      className="block rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-teal-300"
                    >
                      <div className="flex flex-wrap gap-2 items-center">
                        <DemoBadge />
                        <span className="text-xs bg-rose-50 text-rose-800 px-2 py-0.5 rounded">
                          {i.type}
                        </span>
                      </div>
                      <p className="mt-1 font-medium">
                        {i.nameZh}{" "}
                        <span className="text-sm font-normal text-slate-500 font-latin">
                          {i.nameEn}
                        </span>
                      </p>
                      {i.cas && (
                        <p className="text-xs text-slate-400 font-latin">CAS {i.cas}</p>
                      )}
                    </Link>
                  </li>
                )
            )}
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">对照品 RS</h2>
          <ul className="space-y-2">
            {relatedRS.map(
              (r) =>
                r && (
                  <li key={r.id}>
                    <Link
                      href={`/reference-standards#${r.id}`}
                      className="block rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-teal-300"
                    >
                      <p className="font-medium">
                        {r.nameZh}{" "}
                        <span className="text-sm font-normal text-slate-500 font-latin">
                          {r.nameEn}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 font-latin mt-1">
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
        </div>
      </section>
    </div>
  );
}

function InfoCard({
  label,
  value,
  latin,
}: {
  label: string;
  value: string;
  latin?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-medium text-slate-900 ${latin ? "font-latin" : ""}`}>
        {value}
      </p>
    </div>
  );
}
