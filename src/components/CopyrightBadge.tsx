import { COPYRIGHT_LABELS } from "@/lib/constants";
import type { CopyrightStatus } from "@/lib/types";

const toneClass: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  amber: "bg-amber-50 text-amber-900 ring-amber-200",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function CopyrightBadge({ status }: { status: CopyrightStatus }) {
  const label = COPYRIGHT_LABELS[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${toneClass[label.tone]}`}
      title={label.en}
    >
      {label.zh}
      <span className="opacity-60 font-latin">· {label.en}</span>
    </span>
  );
}
