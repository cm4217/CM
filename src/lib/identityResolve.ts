/**
 * Resolve light identity records (open / draft / user) for detail pages.
 * Identity layer only — not pharmacopoeia monograph text.
 */
import { openSubstances } from "@/data/openSubstances.generated";
import { loadDrafts, loadUserImports, type IndexLayer } from "./runtimeIndex";

export type LightIdentity = {
  id: string;
  nameZh: string;
  nameEn: string;
  cas?: string;
  unii?: string;
  synonyms: string[];
  indexLayer: IndexLayer;
  sourceNote: string;
  cid?: string | number;
  smiles?: string;
};

export function resolveLightIdentity(id: string): LightIdentity | null {
  const open = openSubstances.find((o) => o.id === id);
  if (open) {
    return {
      id: open.id,
      nameZh: open.nameZh || open.nameEn,
      nameEn: open.nameEn,
      cas: open.cas,
      unii: open.unii,
      synonyms: open.synonyms || [],
      indexLayer: "open",
      sourceNote: "开放索引 · UNII/seed 身份层",
    };
  }
  try {
    const draft = loadDrafts().find((d) => d.id === id);
    if (draft) {
      return {
        id: draft.id,
        nameZh: draft.nameZh || draft.name,
        nameEn: draft.nameEn || draft.name,
        cas: draft.cas,
        unii: draft.unii,
        synonyms: [draft.name].filter(Boolean),
        indexLayer: "draft",
        sourceNote: "缓存草稿 · " + (draft.source || "external"),
        cid: draft.cid,
        smiles: draft.smiles,
      };
    }
  } catch { /* ignore */ }
  try {
    const user = loadUserImports().find((u) => u.id === id);
    if (user) {
      return {
        id: user.id,
        nameZh: user.nameZh || user.nameEn || user.id,
        nameEn: user.nameEn || user.nameZh || user.id,
        cas: user.cas,
        unii: user.unii,
        synonyms: user.synonyms || [],
        indexLayer: "user",
        sourceNote: "用户 CSV 导入 · 身份层",
      };
    }
  } catch { /* ignore */ }
  return null;
}
