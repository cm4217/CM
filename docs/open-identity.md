# Open identity - API and finished drugs
Identity only. No monograph full text.
See package scripts import:open import:drugs expand:ndc-substances.
OPEN_IMPORT_LIMIT default 8000; OPEN_DRUG_IMPORT_LIMIT default 4000.
Output: openSubstances.generated.ts and openDrugProducts.generated.ts
Full: import:drugs then expand:ndc-substances then import:open
