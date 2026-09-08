"use client";

import { NotesPanel } from "@/components/NotesPanel";
import { ImpurityGraph } from "@/components/ImpurityGraph";
import type { ImpurityNode, Substance } from "@/lib/types";

export function SubstanceExtras({
  substance,
  impurities,
}: {
  substance: Substance;
  impurities: ImpurityNode[];
}) {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">杂质关系（本物质）</h2>
        <ImpurityGraph
          substances={[substance]}
          impurities={impurities}
          focusSubstanceId={substance.id}
          height={360}
        />
      </section>
      <NotesPanel kind="substance" targetId={substance.id} titleZh={substance.nameZh} />
    </div>
  );
}

export function ImpurityNotes({
  impurityId,
  titleZh,
}: {
  impurityId: string;
  titleZh: string;
}) {
  return <NotesPanel kind="impurity" targetId={impurityId} titleZh={titleZh} />;
}
