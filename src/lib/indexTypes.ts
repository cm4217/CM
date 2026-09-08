export type IndexLayer = "curated" | "user" | "draft" | "open";

export type DraftSubstance = {
  id: string;
  name: string;
  nameEn?: string;
  nameZh?: string;
  cas?: string;
  unii?: string;
  cid?: string | number;
  smiles?: string;
  source: string;
  createdAt: string;
  status: "draft";
};

export type UserImportRecord = {
  id: string;
  nameZh?: string;
  nameEn?: string;
  cas?: string;
  unii?: string;
  synonyms: string[];
  importedAt: string;
};
