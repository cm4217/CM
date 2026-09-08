import { changeEvents } from "@/data";
import { AlertCard } from "@/components/AlertCard";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { DemoBadge } from "@/components/DemoBadge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "修订提醒",
};

export default function AlertsPage() {
  const events = [...changeEvents].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">修订提醒时间线</h1>
          <p className="mt-1 text-sm text-slate-500 font-latin">
            Revision alerts · sample ChangeEvents
          </p>
        </div>
        <DemoBadge />
      </div>

      <DisclaimerBanner />

      <ol className="relative space-y-4 border-l-2 border-teal-200 ml-3 pl-6">
        {events.map((e) => (
          <li key={e.id} className="relative">
            <span className="absolute -left-[1.9rem] top-5 h-3 w-3 rounded-full bg-teal-600 ring-4 ring-teal-50" />
            <AlertCard event={e} />
          </li>
        ))}
      </ol>
    </div>
  );
}
