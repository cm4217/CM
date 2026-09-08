export { openSubstances, OPEN_SUBSTANCES_META } from "./openSubstances.generated";
export { substances } from "./substances";
export { impurities } from "./impurities";
export { referenceMaterials, REFERENCE_MATERIALS_LAST_SYNCED } from "./referenceMaterials";
export { changeEvents } from "./changeEvents";
export {
  generatedChangeEvents,
  CHANGE_EVENTS_LAST_CHECKED,
} from "./changeEvents.generated";
export { ichLimits, getLimitsForImpurityType, getLimit } from "./ichLimits";
export { alertSources } from "./alertSources";
export { knowledgeSnippets } from "./knowledgeSnippets";
export {
  getCompendialMatrix,
  hasRichCompendialMatrix,
  RICH_COMPENDIAL_IDS,
  COMPENDIAL_COLUMNS,
} from "./compendialMatrices";

import { substances } from "./substances";
import { impurities } from "./impurities";
import { referenceMaterials } from "./referenceMaterials";
import { changeEvents } from "./changeEvents";
import { generatedChangeEvents } from "./changeEvents.generated";
import { ichLimits } from "./ichLimits";
import { openSubstances } from "./openSubstances.generated";

export function getSubstance(id: string) {
  return substances.find((s) => s.id === id);
}

export function getImpurity(id: string) {
  return impurities.find((i) => i.id === id);
}

export function getReferenceMaterial(id: string) {
  return referenceMaterials.find((r) => r.id === id);
}

export function mergedChangeEvents() {
  const map = new Map<string, (typeof changeEvents)[number]>();
  for (const e of [...changeEvents, ...generatedChangeEvents]) {
    map.set(e.id, e);
  }
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
}

export function getStats() {
  return {
    substances: substances.length,
    impurities: impurities.length,
    referenceMaterials: referenceMaterials.length,
    changeEvents: mergedChangeEvents().length,
    ichLimits: ichLimits.length,
    monographRefs: substances.reduce((n, s) => n + s.monographRefs.length, 0),
    openSubstances: openSubstances.length,
  };
}

export function recentAlerts(limit = 5) {
  return mergedChangeEvents().slice(0, limit);
}
