import { OFFICIAL_LINKS, DISCLAIMER, COPYRIGHT_LABELS } from "@/lib/constants";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { CopyrightBadge } from "@/components/CopyrightBadge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于 / 数据来源",
};

export default function AboutPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">关于 / 数据来源</h1>
        <p className="mt-1 text-sm text-slate-500 font-latin">
          Legal model · official links · copyright posture
        </p>
      </div>

      <DisclaimerBanner />

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">产品是什么</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          「药典对照层」是中文优先的 <strong>药典索引 + 杂质发现层</strong>
          ，帮助用户在多药典（ChP / USP / EP / JP / BP / IP / Ph.Int.）之间查找物质、专论引用、杂质命名交叉与对照品目录关系。
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          本站<strong>不是</strong>全文药典站点，不提供、不缓存、不重构法定专论全文。演示数据均标注「示例数据」。
        </p>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">法律与版权模型</h2>
        <p className="text-sm text-slate-600 leading-relaxed">{DISCLAIMER}</p>
        <ul className="space-y-3 text-sm text-slate-600">
          <li className="flex flex-wrap items-center gap-2">
            <CopyrightBadge status="usable" />
            <span>{COPYRIGHT_LABELS.usable.zh}：可公开摘要/元数据级索引。</span>
          </li>
          <li className="flex flex-wrap items-center gap-2">
            <CopyrightBadge status="needs_license" />
            <span>{COPYRIGHT_LABELS.needs_license.zh}：完整内容需官方许可或订阅。</span>
          </li>
          <li className="flex flex-wrap items-center gap-2">
            <CopyrightBadge status="link_only" />
            <span>{COPYRIGHT_LABELS.link_only.zh}：仅提供官方深链，不转载正文。</span>
          </li>
        </ul>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">官方链接</h2>
        <ul className="divide-y divide-slate-100">
          {Object.entries(OFFICIAL_LINKS).map(([code, link]) => (
            <li key={code} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <div>
                <p className="font-medium text-slate-900">
                  {code} · {link.nameZh}
                </p>
                <p className="text-xs text-slate-400 font-latin">{link.nameEn}</p>
              </div>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-teal-700 hover:underline break-all font-latin"
              >
                {link.url}
              </a>
            </li>
          ))}
        </ul>
      </section>


      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">工具</h2>
        <ul className="text-sm text-slate-600 space-y-2">
          <li>
            <a href="/tools/bookmarklet" className="text-teal-700 hover:underline">书签小工具</a>
            — 复制药名并打开 ChP / USP / EP
          </li>
          <li>
            <a href="/tools/sheets" className="text-teal-700 hover:underline">Excel / 表格集成</a>
            — lookup API 与从 Web 取数
          </li>
        </ul>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">演示数据说明</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          当前 MVP 使用本地 TypeScript 模块种子数据（阿司匹林、布洛芬及若干杂质，含亚硝胺风格示例 NDMA）。对照品目录号为虚构示例，不可用于订购或申报。
        </p>
      </section>
    </div>
  );
}
