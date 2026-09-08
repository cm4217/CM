# Open identity / UNII

See package scripts seed:open and import:open.
Place bulk files under data/incoming/open/. Env vars in .env.example.
Large files stream by default (OPEN_IMPORT_STREAM=1).
Generated: src/data/openSubstances.generated.ts
UI: /tools/index /tools/import
Full notes: raise OPEN_IMPORT_LIMIT locally; no monograph full text.

## Env
OPEN_IMPORT_LIMIT (800), OPEN_IMPORT_REQUIRE_CAS, OPEN_IMPORT_URL, OPEN_IMPORT_STREAM, OPEN_IMPORT_CHUNK.
Full UNII 100k-200k+ rows; raise LIMIT locally.

## Copyright
Public identity only; no statutory monograph text.
