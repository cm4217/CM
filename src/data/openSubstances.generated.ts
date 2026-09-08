/** AUTO-GENERATED — identity layer only. Do not edit. */
import data from "./openSubstances.generated.json";

export type OpenSubstanceRecord = {
  id: string;
  nameEn: string;
  nameZh?: string;
  cas?: string;
  unii?: string;
  synonyms: string[];
  source: "unii" | "open" | "ndc";
  provenance: "gsrs" | "seed" | "ndc";
};

export const OPEN_SUBSTANCES_META = {
  "generatedAt": "2026-09-08T09:02:33.967Z",
  "count": 7244,
  "provenance": "ndc",
  "limit": 8000,
  "requireCas": false,
  "stream": true,
  "files": [
    "ndc-derived-substances.csv"
  ],
  "expectedFullScale": "100k-200k+ UNII / NDC-derived rows before LIMIT; default LIMIT 8000 for local; git keeps high-value seed"
} as const;

export const openSubstances = data as OpenSubstanceRecord[];
