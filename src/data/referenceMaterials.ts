import type { ReferenceMaterial } from "@/lib/types";
import {
  generatedReferenceMaterials,
  REFERENCE_MATERIALS_LAST_SYNCED,
} from "./referenceMaterials.generated";

/** 对照品目录：优先使用 sync 脚本生成的扩展种子 */
export const referenceMaterials: ReferenceMaterial[] =
  generatedReferenceMaterials;

export { REFERENCE_MATERIALS_LAST_SYNCED };
