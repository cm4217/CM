# Global finished drugs and CN brand names

Identity index only. No pharmacopoeia full text.

## Regions

\<Code\> |<Source\>
|------|-------|
| US | openFDA NDC
| EU | EMA curated brands
| UK | MHRA curated brands
| JP | PMDA curated
| WHO | WHO EML-style INN
| CN | curated CN brand to INN/UNII map

Facet: `region=CN` (also US/EU/UK/JP/WHO).

## CN aliases

File: `data/incoming/open/cn-brand-aliases.json`

Examples: oseltamivir/Tamiflu, atorvastatin/Lipitor, metformin/Glucophage, plus hundreds more.

Merged into product and substance synonyms; also `src/lib/synonyms.ts`.

## Regen

```bash
npm run seed:global-drugs
OPEN_DRUG_SKIP_DOWNLOAD=1 nmp run import:drugs
```
