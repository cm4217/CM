/** AUTO-GENERATED — finished-drug identity layer only. Do not edit. */
import data from "./openDrugProducts.generated.json";

export type OpenDrugProductRecord = {
  id: string;
  brandName: string;
  genericName: string;
  inn?: string;
  strength?: string;
  dosageForm?: string;
  route?: string;
  productNdc?: string;
  countryTags: string[];
  regionTags: string[];
  unii?: string;
  parentUnii?: string;
  parentSubstanceId?: string;
  labelerName?: string;
  productType?: string;
  marketingCategory?: string;
  synonyms: string[];
  provenance: "openfda-ndc" | "seed";
  source: "openfda" | "open";
};

export const OPEN_DRUG_PRODUCTS_META = {
  "generatedAt": "2026-09-08T09:05:17.086Z",
  "count": 4000,
  "provenance": "openfda-ndc",
  "limit": 4000,
  "files": [
    "drug-ndc-0001-of-0001.json"
  ],
  "expectedFullScale": "100k+ openFDA NDC finished products before LIMIT; git keeps high-value seed"
} as const;

export const openDrugProducts = data as OpenDrugProductRecord[];
