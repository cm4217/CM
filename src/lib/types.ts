export type PharmacopoeiaCode =
  | "ChP"
  | "USP"
  | "EP"
  | "JP"
  | "BP"
  | "IP"
  | "Ph.Int.";

export type CopyrightStatus = "usable" | "needs_license" | "link_only";

export type ProvenanceSource = "seed" | "pubchem" | "gsrs" | "user";

export type IdVerificationStatus = "verified" | "demo" | "unverified";


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
  /** Ph. Eur. text/monograph number for deep link (示例编号可能 404) */
  epTextNumber?: string;
  /** USP–NF DOI, e.g. 10.31003/USPNF_M… (示例需核对) */
  uspDoi?: string;
  /** Ph.Int. digicollections document path, e.g. Jb.6.1.5 */
  phIntDocPath?: string;
  /** Document ID verification: verified | demo | unverified */
  idStatus?: IdVerificationStatus;
  notes?: string;
}

export interface Substance {
  id: string;
  nameZh: string;
  nameEn: string;
  inn?: string;
  cas?: string;
  unii?: string;
  /** Ph. Eur. content id 示例 — 直达 pheur-online；需订阅，可能 404 */
  epTextNumber?: string;
  /** USP–NF DOI 示例 — 经 doi.org；需核对/订阅 */
  uspDoi?: string;
  /** Ph.Int. digicollections monograph path (e.g. Jb.6.1.5) */
  phIntDocPath?: string;
  aliases: string[];
  type: SubstanceType;
  summaryZh: string;
  summaryEn: string;
  monographRefs: MonographRef[];
  relatedImpurityIds: string[];
  relatedRSIds: string[];
  /** Optional SMILES for local structure search (demo) */
  smiles?: string;
  inchiKey?: string;
  /** Optional molecular formula (demo) */
  molecularFormula?: string;
  /** Optional per-field provenance (CAS/UNII/EP/USP ids …) */
  fieldProvenance?: Partial<
    Record<
      "cas" | "unii" | "epTextNumber" | "uspDoi" | "phIntDocPath" | "nameEn" | "nameZh",
      ProvenanceSource
    >
  >;
  /** Optional doc id verification for substance-level deep-link fields */
  epIdStatus?: IdVerificationStatus;
  uspDoiStatus?: IdVerificationStatus;
  phIntIdStatus?: IdVerificationStatus;
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
  unii?: string;
  type: ImpurityType;
  parentSubstanceIds: string[];
  namingCrosswalk: NamingCrosswalk[];
  relatedRSIds: string[];
  ichTags: string[];
  summaryZh: string;
  summaryEn: string;
  smiles?: string;
  inchiKey?: string;
  /** Optional molecular formula (demo) */
  molecularFormula?: string;
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
  pharmacopoeia: PharmacopoeiaCode | "ICH" | "FDA" | "EMA" | "multi";
  titleZh: string;
  titleEn: string;
  summaryZh: string;
  summaryEn: string;
  relatedSubstanceIds?: string[];
  relatedImpurityIds?: string[];
  severity: "info" | "watch" | "critical";
  officialUrl?: string;
  sourceKey?: string;
  demoLabel: true;
}

export interface SearchHit {
  kind: "substance" | "impurity" | "rs" | "drug";
  id: string;
  titleZh: string;
  titleEn: string;
  subtitle?: string;
  badges: string[];
  /** 药典覆盖芯片（物质） */
  pharmacopoeias?: PharmacopoeiaCode[];
  /** 关联杂质数（物质） */
  impurityCount?: number;
  /** 是否有对照品关联 */
  hasRS?: boolean;
  cas?: string;
  unii?: string;
  epTextNumber?: string;
  uspDoi?: string;
  phIntDocPath?: string;
  /** 短摘要（物质/杂质） */
  summary?: string;
  /** 杂质类型 */
  impurityType?: ImpurityType;
  /** 杂质父物质 id */
  parentIds?: string[];
  /** 杂质父物质中文名 */
  parentNames?: string[];
  /** 分子式 */
  molecularFormula?: string;
  /** 药典版本串（物质专论） */
  pharmaVersions?: string[];
  /** 效力/官方状态（物质专论） */
  efficacyStatuses?: string[];
  /** ICH 标签 */
  ichTags?: string[];
  /** 物质类型 API/excipient… */
  substanceType?: SubstanceType;
  inn?: string;
  /** 匹配层级：exact / cas / synonym / pinyin / fuzzy / relaxed */
  matchTier?: "exact" | "cas" | "synonym" | "pinyin" | "fuzzy" | "relaxed";
  /** 中文匹配原因，如「精确名称」 */
  matchReason?: string;
  /** 物质卡片：关联杂质名预览（最多 3） */
  impurityPreview?: string[];
  /** 是否有文档直达字段 */
  hasDeepLink?: boolean;
  /** InChIKey（种子元数据，非药典正文） */
  inchiKey?: string;
  /** 排序分（rankDocs）；用于 Hero 置信门控 / mini-compare */
  rankScore?: number;
  /** 结构化证据行（仅自有元数据，无专论正文） */
  evidence?: { field: string; value: string; reasonCode: string }[];
  /** 成药：商品名 */
  brandName?: string;
  /** 成药：通用名 */
  genericName?: string;
  /** 成药：规格 */
  strength?: string;
  /** 成药：剂型 */
  dosageForm?: string;
  /** 成药：国家/地区标签 */
  countryTags?: string[];
  /** 成药关联原料药（开放索引 id） */
  parentSubstanceId?: string;
  /** 索引层：精选 / 用户导入 / 草稿 / 开放 */
  indexLayer?: "curated" | "user" | "draft" | "open";
}

/** ICH / 监管限值示例行（非法定正文） */
export type IchLimitCategory =
  | "Q3C"
  | "Q3D"
  | "M7"
  | "nitrosamine"
  | "other";

export interface IchLimitRow {
  id: string;
  category: IchLimitCategory;
  nameZh: string;
  nameEn: string;
  cas?: string;
  /** 示例数值，务必核官方最新版 */
  exampleValue: string;
  unit?: string;
  classOrNote?: string;
  impurityTypes?: ImpurityType[];
  officialUrls: { label: string; url: string }[];
  disclaimerZh: string;
  demoLabel: true;
}

export interface AlertSourceMeta {
  key: string;
  nameZh: string;
  nameEn: string;
  url: string;
  notesZh: string;
}
