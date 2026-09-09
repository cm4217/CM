import { getStats } from "@/data";

export function StatsCards() {
  const stats = getStats();
  const items = [
    { label: "精选物质", value: stats.substances, en: "Curated" },
    { label: "杂质节点", value: stats.impurities, en: "Impurities" },
    { label: "对照品", value: stats.referenceMaterials, en: "RS catalog" },
    { label: "原料药库", value: stats.openSubstances, en: "Open APIs" },
    { label: "成药库", value: stats.openDrugProducts, en: "Finished drugs" },
    { label: "修订事件", value: stats.changeEvents, en: "Change events" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="group rounded-xl border border-slate-200/90 bg-white px-4 py-3.5 shadow-sm transition hover:border-teal-300 hover:shadow-md"
        >
          <p className="text-2xl font-bold text-teal-800 tabular-nums tracking-tight group-hover:text-teal-900">
            {item.value.toLocaleString("zh-CN")}
          </p>
          <p className="mt-0.5 text-sm text-slate-700">{item.label}</p>
          <p className="text-[11px] text-slate-400 font-latin">{item.en}</p>
        </div>
      ))}
    </div>
  );
}
