export type PharmacopoeiaCode =
  | "ChP"
  | "USP"
  | "EP"
  | "JP"
  | "BP"
  | "IP"
  | "Ph.Int.";

export type CopyrightStatus = "usable" | "needs_license" | "link_only";

export type SubstanceType =
  | "API"
  | "excipient"
  | "biological"
  | "herb"
  | "other";

export type ImpurityType =
  | "process"
  | "degradation"
  | "nitrosamine"
  | "residual_solvent"
  | "elemental"
  | "other";

export interface MonographRef {
  id: string;
  pharmacopoeia: PharmacopoeiaCode;
  monographTitle: string;
  monographTitleZh?: string;
  version: string;
  /** 效力 / official status note */
  efficacy: string;
  officialUrl: string;
  copyrightStatus: CopyrightStatus;
  hasRS?: boolean;
  notes?: string;
}

export interface Substance {
  id: string;
  nameZh: string;
  nameEn: string;
  inn?: string;
  cas?: string;
  unii?: string;
  aliases: string[];
  type: SubstanceType;
  summaryZh: string;
  summaryEn: string;
  monographRefs: MonographRef[];
  relatedImpurityIds: string[];
  relatedRSIds: string[];
  demoLabel: true;
}

export interface NamingCrosswalk {
  system: string;
  name: string;
  notes?: string;
}

export interface ImpurityNode {
  id: string;
  nameZh: string;
  nameEn: string;
  chemicalName?: string;
  cas?: string;
  type: ImpurityType;
  parentSubstanceIds: string[];
  namingCrosswalk: NamingCrosswalk[];
  relatedRSIds: string[];
  ichTags: string[];
  summaryZh: string;
  summaryEn: string;
  demoLabel: true;
}

export interface ReferenceMaterial {
  id: string;
  catalogCode: string;
  nameZh: string;
  nameEn: string;
  issuer: "USP" | "EDQM" | "BPCRS" | "NIFDC" | "other";
  linkedSubstanceId?: string;
  linkedImpurityId?: string;
  cas?: string;
  status: "current" | "superseded" | "discontinued";
  copyrightStatus: CopyrightStatus;
  officialUrl?: string;
  notes?: string;
  demoLabel: true;
}

export interface ChangeEvent {
  id: string;
  date: string;
  pharmacopoeia: PharmacopoeiaCode | "ICH" | "multi";
  titleZh: string;
  titleEn: string;
  summaryZh: string;
  summaryEn: string;
  relatedSubstanceIds?: string[];
  relatedImpurityIds?: string[];
  severity: "info" | "watch" | "critical";
  officialUrl?: string;
  demoLabel: true;
}

export interface SearchHit {
  kind: "substance" | "impurity" | "rs";
  id: string;
  titleZh: string;
  titleEn: string;
  subtitle?: string;
  badges: string[];
}
