#!/usr/bin/env python3
"""Regenerate / validate multi-region finished-drug seed + CN brand aliases.
Identity layer only — no monograph text. Prefer extending JSON in-place;
this script reports counts and ensures wrapper metadata is consistent.
"""
from __future__ import annotations
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CN = ROOT / "data/incoming/open/cn-brand-aliases.json"
GLOB = ROOT / "data/incoming/ndc/global-products-seed.json"

def load(path: Path):
    data = json.loads(path.read_text(encoding="utf-8"))
    return data

def main():
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    cn = load(CN)
    aliases = cn.get("aliases") if isinstance(cn, dict) else cn
    g = load(GLOB)
    products = g.get("products") if isinstance(g, dict) else g
    by = {}
    for p in products:
        for t in p.get("countryTags") or []:
            by[t] = by.get(t, 0) + 1
    cn_out = {
        "generatedAt": now,
        "count": len(aliases),
        "note": "Curated open Chinese brand/trade ↔ INN/UNII synonym map (identity only)",
        "aliases": aliases,
    }
    g_out = {
        "generatedAt": now,
        "count": len(products),
        "note": "Multi-region finished-drug identity seed (WHO/EMA/MHRA/PMDA/CN curated). No monograph text.",
        "products": products,
    }
    CN.write_text(json.dumps(cn_out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    GLOB.write_text(json.dumps(g_out, ensure_ascii=False) + "\n", encoding="utf-8")
    print("CN brand aliases:", len(aliases))
    print("Global products:", len(products), by)
    print("Wrote", CN, "and", GLOB)

if __name__ == "__main__":
    main()
