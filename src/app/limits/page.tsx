import { ichLimits } from "@/data";
import { LimitCards } from "@/components/LimitCards";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { DemoBadge } from "@/components/DemoBadge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ICH / 亚硝胺限值示例",
};

export default function LimitsPage() {
  const groups = [
    { key: "Q3C", title: "ICH Q3C 残留溶剂（示例）" },
    { key: "Q3D", title: "ICH Q3D 元素杂质（示例）" },
    { key: "nitrosamine", title: "亚硝胺 AI（示例）" },
    { key: "M7", title: "ICH M7 框架（示例）" },
  ] as const;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">限值示例</h1>
          <p className="mt-1 text-sm text-slate-500 font-latin">
            ICH Q3C / Q3D / M7 · nitrosamine AI samples
          </p>
        </div>
        <DemoBadge />
      </div>

      <DisclaimerBanner />

      <aside className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <p className="font-medium">示例/请核官方最新版</p>
        <p className="mt-1 text-xs leading-relaxed">
          本页数值均为演示用结构化示例，不构成法定限度。请以{" "}
          <a
            href="https://database.ich.org/"
            className="text-teal-800 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            ICH 数据库
          </a>
          、FDA、EMA 现行指导原则为准。
        </p>
      </aside>

      {groups.map((g) => {
        const rows = ichLimits.filter((r) => r.category === g.key);
        if (!rows.length) return null;
        return (
          <div key={g.key} className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">{g.title}</h2>
            <LimitCards rows={rows} showHeader={false} />
          </div>
        );
      })}
    </div>
  );
}
