import type { SearchHit } from "@/lib/types";

const REASON_ZH: Record<string, string> = {
  match_field: "命中",
  cas: "CAS",
  coverage: "覆盖",
  version: "版本",
  ich_tag: "ICH",
  unii: "UNII",
  has_rs: "RS",
  deep_link: "直达",
  formula: "分子式",
};

/** Unified small evidence rows under match reason — owned metadata only. */
export function EvidenceRow({
  evidence,
  className = "",
}: {
  evidence?: SearchHit["evidence"];
  className?: string;
}) {
  if (!evidence || evidence.length === 0) return null;
  return (
    <ul
      className={`mt-1.5 space-y-0.5 text-[11px] text-slate-600 ${className}`}
      aria-label="证据"
    >
      {evidence.map((e, i) => (
        <li key={`${e.reasonCode}-${e.field}-${i}`} className="flex flex-wrap gap-x-2 gap-y-0.5">
          <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0 text-[10px] font-medium text-slate-500">
            {REASON_ZH[e.reasonCode] || e.reasonCode}
          </span>
          <span className="text-slate-500">{e.field}</span>
          <span className="font-latin text-slate-800 break-all">{e.value}</span>
        </li>
      ))}
    </ul>
  );
}
