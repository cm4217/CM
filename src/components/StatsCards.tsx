import { getStats } from "@/data";

export function StatsCards() {
  const stats = getStats();
  const items = [
    { label: "物质", value: stats.substances, en: "Substances" },
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
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
        >
          <p className="text-2xl font-bold text-teal-800 tabular-nums">{item.value}</p>
          <p className="text-sm text-slate-700">{item.label}</p>
          <p className="text-xs text-slate-400 font-latin">{item.en}</p>
        </div>
      ))}
    </div>
  );
}
