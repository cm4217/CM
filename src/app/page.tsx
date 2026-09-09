import Link from "next/link";
import { SearchHero } from "@/components/SearchHero";
import { StatsCards } from "@/components/StatsCards";
import { AlertCard } from "@/components/AlertCard";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { recentAlerts, substances } from "@/data";
import { DemoBadge } from "@/components/DemoBadge";

export default function HomePage() {
  const alerts = recentAlerts(3);
  // Homepage shows curated demo substances only (avoid dumping the full open index).
  const demoSubstances = substances.slice(0, 24);

  return (
    <div className="space-y-12">
      <SearchHero />

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <div>
            <h2 className="ph-section-title">示例库规模</h2>
            <p className="mt-0.5 text-xs text-slate-500 font-latin">Identity index counts · demo seed</p>
          </div>
          <DemoBadge />
        </div>
        <StatsCards />
      </section>

      <DisclaimerBanner />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="ph-section-title">最近修订提醒</h2>
          <Link href="/alerts" className="text-sm font-medium text-teal-700 hover:underline ph-focus-ring rounded">
            全部 →
          </Link>
        </div>
        {alerts.length === 0 ? (
          <div className="ph-empty">暂无修订提醒</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {alerts.map((e) => (
              <AlertCard key={e.id} event={e} showImpact={false} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <div>
            <h2 className="ph-section-title">示例物质</h2>
            <p className="mt-0.5 text-xs text-slate-500">精选演示种子 · 非开放库全量</p>
          </div>
          <Link href="/search" className="text-sm font-medium text-teal-700 hover:underline ph-focus-ring rounded">
            去检索 →
          </Link>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {demoSubstances.map((s) => (
            <li key={s.id}>
              <Link
                href={`/substances/${s.id}`}
                className="block h-full ph-card-hover p-4 no-underline ph-focus-ring"
              >
                <div className="flex flex-wrap gap-2 items-center">
                  <DemoBadge />
                  <span className="ph-chip font-latin">{s.type}</span>
                </div>
                <p className="mt-2.5 text-lg font-semibold tracking-tight text-slate-900">
                  {s.nameZh}{" "}
                  <span className="text-base font-normal text-slate-500 font-latin">
                    {s.nameEn}
                  </span>
                </p>
                <p className="mt-1 text-sm text-slate-500 font-latin">
                  INN {s.inn} · CAS {s.cas}
                </p>
                <p className="mt-2 text-sm text-slate-600 line-clamp-2 leading-relaxed">{s.summaryZh}</p>
              </Link>
            </li>
          ))}
        </ul>
        <div className="rounded-2xl bg-gradient-to-br from-teal-950 via-teal-900 to-slate-900 text-teal-50 p-6 shadow-md">
          <p className="font-semibold tracking-tight">产品定位</p>
          <p className="mt-2 text-sm text-teal-100/95 leading-relaxed max-w-3xl">
            本站是药典 + 杂质发现层索引，而非全文盗版药典站点。版权标记区分「可用摘要 /
            需授权 / 仅深链」，全文请通过官方渠道获取。
          </p>
          <Link
            href="/about"
            className="mt-4 inline-flex items-center rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20 transition ph-focus-ring"
          >
            了解法律模型与数据来源 →
          </Link>
        </div>
      </section>
    </div>
  );
}
