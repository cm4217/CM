export { substances } from "./substances";
export { impurities } from "./impurities";
export { referenceMaterials, REFERENCE_MATERIALS_LAST_SYNCED } from "./referenceMaterials";
export { changeEvents } from "./changeEvents";
export { ichLimits, getLimitsForImpurityType, getLimit } from "./ichLimits";
export { alertSources } from "./alertSources";

import { substances } from "./substances";
import { impurities } from "./impurities";
import { referenceMaterials } from "./referenceMaterials";
import { changeEvents } from "./changeEvents";
import { ichLimits } from "./ichLimits";

export function getSubstance(id: string) {
  return substances.find((s) => s.id === id);
}

export function getImpurity(id: string) {
  return impurities.find((i) => i.id === id);
}

export function getReferenceMaterial(id: string) {
  return referenceMaterials.find((r) => r.id === id);
}

export function getStats() {
  return {
    substances: substances.length,
    impurities: impurities.length,
    referenceMaterials: referenceMaterials.length,
    changeEvents: changeEvents.length,
    ichLimits: ichLimits.length,
    monographRefs: substances.reduce((n, s) => n + s.monographRefs.length, 0),
  };
}

export function recentAlerts(limit = 5) {
  return [...changeEvents]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}
