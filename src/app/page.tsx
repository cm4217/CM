import Link from "next/link";
import { SearchHero } from "@/components/SearchHero";
import { StatsCards } from "@/components/StatsCards";
import { AlertCard } from "@/components/AlertCard";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { recentAlerts, substances } from "@/data";
import { DemoBadge } from "@/components/DemoBadge";

export default function HomePage() {
  const alerts = recentAlerts(3);

  return (
    <div className="space-y-10">
      <SearchHero />

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">示例库规模</h2>
          <DemoBadge />
        </div>
        <StatsCards />
      </section>

      <DisclaimerBanner />

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">最近修订提醒</h2>
            <Link href="/alerts" className="text-sm text-teal-700 hover:underline">
              全部 →
            </Link>
          </div>
          <div className="space-y-3">
            {alerts.map((e) => (
              <AlertCard key={e.id} event={e} />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">示例物质</h2>
          <ul className="space-y-3">
            {substances.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/substances/${s.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-teal-300 transition"
                >
                  <div className="flex flex-wrap gap-2 items-center">
                    <DemoBadge />
                    <span className="text-xs text-slate-500 font-latin">{s.type}</span>
                  </div>
                  <p className="mt-2 text-lg font-semibold">
                    {s.nameZh}{" "}
                    <span className="text-base font-normal text-slate-500 font-latin">
                      {s.nameEn}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-slate-500 font-latin">
                    INN {s.inn} · CAS {s.cas}
                  </p>
                  <p className="mt-2 text-sm text-slate-600 line-clamp-2">{s.summaryZh}</p>
                </Link>
              </li>
            ))}
          </ul>
          <div className="rounded-xl bg-teal-900 text-teal-50 p-5">
            <p className="font-semibold">产品定位</p>
            <p className="mt-2 text-sm text-teal-100/95 leading-relaxed">
              本站是药典 + 杂质发现层索引，而非全文盗版药典站点。版权标记区分「可用摘要 /
              需授权 / 仅深链」，全文请通过官方渠道获取。
            </p>
            <Link
              href="/about"
              className="mt-3 inline-block text-sm font-medium text-white underline"
            >
              了解法律模型与数据来源 →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
