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
  brand: "商品名",
  inn: "INN",
  confidence: "置信",
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
      className={`mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-slate-600 ${className}`}
      aria-label="证据"
    >
      {evidence.map((e, i) => (
        <li key={`${e.reasonCode}-${e.field}-${i}`} className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-full border border-slate-200/80 bg-slate-50/80 px-2 py-0.5">
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-teal-800">
            {REASON_ZH[e.reasonCode] || e.reasonCode}
          </span>
          <span className="text-slate-400">·</span>
          <span className="font-latin text-slate-800 break-all">{e.value}</span>
        </li>
      ))}
    </ul>
  );
}
