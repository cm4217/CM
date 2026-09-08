import type { IdVerificationStatus, ProvenanceSource, Substance } from "./types";

function looksLikeDemoId(id?: string): boolean {
  if (!id) return false;
  const t = id.trim().toLowerCase();
  return t.startsWith("demo") || t.includes("mdemo") || t.includes("/demo");
}

/** Resolve EP text id status (Aspirin 0309 = verified). */
export function resolveEpIdStatus(s: Substance): IdVerificationStatus | undefined {
  if (!s.epTextNumber) return undefined;
  if (s.epIdStatus) return s.epIdStatus;
  const epRef = s.monographRefs.find((m) => m.pharmacopoeia === "EP" && m.idStatus);
  if (epRef?.idStatus) return epRef.idStatus;
  if (s.id === "sub-aspirin" && s.epTextNumber === "0309") return "verified";
  if (looksLikeDemoId(s.epTextNumber)) return "demo";
  return "unverified";
}

export function resolveUspDoiStatus(s: Substance): IdVerificationStatus | undefined {
  if (!s.uspDoi) return undefined;
  if (s.uspDoiStatus) return s.uspDoiStatus;
  const uspRef = s.monographRefs.find((m) => m.pharmacopoeia === "USP" && m.idStatus);
  if (uspRef?.idStatus) return uspRef.idStatus;
  if (looksLikeDemoId(s.uspDoi)) return "demo";
  return "unverified";
}

export function resolvePhIntIdStatus(s: Substance): IdVerificationStatus | undefined {
  if (!s.phIntDocPath) return undefined;
  if (s.phIntIdStatus) return s.phIntIdStatus;
  if (looksLikeDemoId(s.phIntDocPath)) return "demo";
  return "unverified";
}

export function fieldProvenanceOf(
  s: Substance,
  field: keyof NonNullable<Substance["fieldProvenance"]>
): ProvenanceSource {
  return s.fieldProvenance?.[field] ?? "seed";
}

export const ID_STATUS_LABEL: Record<IdVerificationStatus, string> = {
  verified: "已核验",
  demo: "示例",
  unverified: "未核验",
};

export const PROVENANCE_LABEL: Record<ProvenanceSource, string> = {
  seed: "种子",
  pubchem: "PubChem",
  gsrs: "GSRS",
  user: "用户",
};
