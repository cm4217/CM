/**
 * Build structured evidence rows from owned metadata only.
 * Never include pharmacopoeia body / monograph verbatim text.
 */

import type { PharmacopoeiaCode, SearchHit } from "@/lib/types";
import type { MatchTier } from "./rank";
import { MATCH_REASON_ZH } from "./rank";

export type EvidenceReasonCode =
  | "match_field"
  | "cas"
  | "coverage"
  | "version"
  | "ich_tag"
  | "unii"
  | "has_rs"
  | "deep_link"
  | "formula"
  | "brand"
  | "inn"
  | "confidence";

export type EvidenceItem = {
  field: string;
  value: string;
  reasonCode: EvidenceReasonCode;
};

export type EvidenceSource = {
  kind: SearchHit["kind"];
  matchTier?: MatchTier;
  matchReason?: string;
  cas?: string;
  unii?: string;
  pharmacopoeias?: PharmacopoeiaCode[] | string[];
  pharmaVersions?: string[];
  ichTags?: string[];
  hasRS?: boolean;
  hasDeepLink?: boolean;
  epTextNumber?: string;
  uspDoi?: string;
  molecularFormula?: string;
  impurityType?: string;
};

const MATCH_FIELD_LABEL: Record<MatchTier, string> = {
  cas: "CAS",
  exact: "名称",
  synonym: "同义词",
  pinyin: "拼音",
  fuzzy: "模糊",
  relaxed: "放宽",
};

export function buildEvidence(src: EvidenceSource): EvidenceItem[] {
  const out: EvidenceItem[] = [];

  if (src.matchTier) {
    out.push({
      field: "命中字段",
      value: `${MATCH_FIELD_LABEL[src.matchTier] || src.matchTier} · ${
        src.matchReason || MATCH_REASON_ZH[src.matchTier]
      }`,
      reasonCode: "match_field",
    });
  }

  const mr = src.matchReason || "";
  if (mr.includes("商品名")) {
    out.push({ field: "商品名", value: mr, reasonCode: "brand" });
  } else if (mr.includes("INN") || mr.includes("通用名")) {
    out.push({ field: "INN", value: mr, reasonCode: "inn" });
  }

  if (src.cas) {
    out.push({ field: "CAS", value: src.cas, reasonCode: "cas" });
  }

  if (src.unii) {
    out.push({ field: "UNII", value: src.unii, reasonCode: "unii" });
  }

  if (src.pharmacopoeias && src.pharmacopoeias.length > 0) {
    out.push({
      field: "药典覆盖",
      value: src.pharmacopoeias.join(" · "),
      reasonCode: "coverage",
    });
  }

  if (src.pharmaVersions && src.pharmaVersions.length > 0) {
    out.push({
      field: "版本",
      value: src.pharmaVersions.slice(0, 4).join(" · "),
      reasonCode: "version",
    });
  }

  if (src.ichTags && src.ichTags.length > 0) {
    out.push({
      field: "ICH",
      value: src.ichTags.slice(0, 4).join(" · "),
      reasonCode: "ich_tag",
    });
  }

  if (src.molecularFormula) {
    out.push({
      field: "分子式",
      value: src.molecularFormula,
      reasonCode: "formula",
    });
  }

  if (src.hasRS) {
    out.push({ field: "对照品", value: "有关联", reasonCode: "has_rs" });
  }

  if (src.hasDeepLink || src.epTextNumber || src.uspDoi) {
    const bits = [
      src.epTextNumber ? `EP ${src.epTextNumber}` : null,
      src.uspDoi ? "USP DOI" : null,
      src.hasDeepLink && !src.epTextNumber && !src.uspDoi ? "有直达" : null,
    ].filter(Boolean);
    if (bits.length) {
      out.push({
        field: "文档直达",
        value: bits.join(" · "),
        reasonCode: "deep_link",
      });
    }
  }

  return out;
}
