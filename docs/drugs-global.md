# Global finished drugs and CN brand names

Identity index only. No pharmacopoeia full text.

## Regions

| Code | Source |
|------|--------|
| US | openFDA NDC |
| EU | EMA curated brands |
| UK | MHRA curated brands |
| JP | PMDA curated |
| WHO | WHO EML-style INN |
| CN | curated CN brand → INN/UNII map |

Facet: `region=CN` (also US/EU/UK/JP/WHO).

## CN aliases

File: `data/incoming/open/cn-brand-aliases.json`

Hundreds of Chinese trade names (达菲 / 立普妥 / 格华止 / …) mapped to INN/UNII.

Merged into product and substance synonyms; also `src/lib/synonyms.ts`.

## Regen

```bash
npm run seed:global-drugs
OPEN_DRUG_SKIP_DOWNLOAD=1 OPEN_DRUG_IMPORT_LIMIT=6000 npm run import:drugs
```
