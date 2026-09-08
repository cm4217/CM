import type { IdVerificationStatus, ProvenanceSource } from "@/lib/types";
import { ID_STATUS_LABEL, PROVENANCE_LABEL } from "@/lib/provenance";

const idTone: Record<IdVerificationStatus, string> = {
  verified: "border-emerald-300 bg-emerald-50 text-emerald-900",
  demo: "border-amber-300 bg-amber-50 text-amber-900",
  unverified: "border-slate-300 bg-slate-50 text-slate-600",
};

const provTone: Record<ProvenanceSource, string> = {
  seed: "border-slate-200 bg-slate-50 text-slate-600",
  pubchem: "border-sky-300 bg-sky-50 text-sky-900",
  gsrs: "border-indigo-300 bg-indigo-50 text-indigo-900",
  user: "border-violet-300 bg-violet-50 text-violet-900",
};

export function IdStatusBadge({
  status,
  label,
}: {
  status?: IdVerificationStatus;
  label?: string;
}) {
  if (!status) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${idTone[status]}`}
      title={`文档编号状态：${ID_STATUS_LABEL[status]}`}
    >
      {label ? `${label}·` : ""}
      {ID_STATUS_LABEL[status]}
    </span>
  );
}

export function ProvenanceBadge({
  source,
  label,
}: {
  source?: ProvenanceSource;
  label?: string;
}) {
  if (!source) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${provTone[source]}`}
      title={`来源：${PROVENANCE_LABEL[source]}`}
    >
      {label ? `${label}·` : ""}
      {PROVENANCE_LABEL[source]}
    </span>
  );
}
