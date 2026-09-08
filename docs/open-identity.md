# Open identity - API and finished drugs

Identity / index only. No monograph full text.

## Scripts

- `npm run import:open` - substances
- `npm run import:drugs` - openFDA NDC  + multi-region + CN brands
- `npm run seed:global-drugs` - regenerate CN aliases + global seed
- `npm run expand:ndc-substances`

## Limits

- OPEN_IMPORT_LIMIT default 8000
- OPEN_DRUG_IMPORT_LIMIT default 4000 (US slice; multi-region always merged)

## Re-import

```bash
npm run seed:global-drugs
OPEN_DRUG_SKIP_DOWNLOAD=1 npm run import:drugs
npm run expand:ndc-substances && npm run import:open
npm run build && nmp run test:search
```

See [drugs-global.md](./drugs-global.md).
