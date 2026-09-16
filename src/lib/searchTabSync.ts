/**
 * Keep search `type=` (server filter) and `tab=` (client intent) aligned.
 * type=drug|product → tab=drug; type=API|excipient → tab=substance; etc.
 * When both present and conflict, type wins for filtering; tab is rewritten.
 */

export type SearchTab = "all" | "substance" | "drug" | "impurity" | "rs" | "external";

const TYPE_TO_TAB: Record<string, SearchTab> = {
  drug: "drug",
  product: "drug",
  API: "substance",
  api: "substance",
  excipient: "substance",
  impurity: "impurity",
  rs: "rs",
};

const TAB_TO_TYPE: Record<string, string> = {
  drug: "drug",
  substance: "API",
  impurity: "impurity",
  rs: "rs",
};

/** Tab implied by a type= filter value, or null if type does not imply a tab. */
export function tabFromType(type: string | null | undefined): SearchTab | null {
  if (!type) return null;
  return TYPE_TO_TAB[type] || null;
}

/** type= value implied when user picks an intent tab (optional sync). */
export function typeFromTab(tab: string | null | undefined): string | null {
  if (!tab || tab === "all" || tab === "external") return null;
  return TAB_TO_TYPE[tab] || null;
}

/**
 * Effective intent tab for UI: if type implies a tab and conflicts with tab=,
 * prefer type-derived tab.
 */
export function effectiveSearchTab(
  type: string | null | undefined,
  tab: string | null | undefined
): SearchTab {
  const fromType = tabFromType(type);
  const t = (tab as SearchTab) || "all";
  if (fromType) {
    if (!tab || tab === "all" || tab === fromType) return fromType;
    // conflict: type wins
    return fromType;
  }
  if (t === "substance" || t === "drug" || t === "impurity" || t === "rs" || t === "external") {
    return t;
  }
  return "all";
}

/** Mutate URLSearchParams so type/tab stay consistent (type wins on conflict). */
export function syncTypeTabParams(params: URLSearchParams): void {
  const type = params.get("type");
  const implied = tabFromType(type);
  if (implied) {
    params.set("tab", implied);
    return;
  }
  // no type → leave tab as-is
}
