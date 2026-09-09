# Open identity — API and finished drugs

Identity / index only. No monograph full text.

## Scripts

- `npm run import:open` — substances (UNII / NDC-derived)
- `npm run import:drugs` — openFDA NDC + multi-region + CN brands
- `npm run seed:global-drugs` — refresh CN aliases + global seed metadata
- `npm run expand:ndc-substances` — expand API rows from NDC dump

## Limits

- `OPEN_IMPORT_LIMIT` default **12000** (was 8000)
- `OPEN_DRUG_IMPORT_LIMIT` default **6000** US slice; multi-region always merged
- `OPEN_NDC_SUBSTANCE_LIMIT` default **12000**

## Re-import

```bash
npm run seed:global-drugs
OPEN_DRUG_SKIP_DOWNLOAD=1 OPEN_DRUG_IMPORT_LIMIT=6000 npm run import:drugs
OPEN_NDC_SUBSTANCE_LIMIT=12000 npm run expand:ndc-substances
OPEN_IMPORT_LIMIT=12000 npm run import:open
npm run build && npm run test:search
```

See [drugs-global.md](./drugs-global.md).
