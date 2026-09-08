"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ImpurityNode, Substance } from "@/lib/types";

type Props = {
  substances: Substance[];
  impurities: ImpurityNode[];
  focusSubstanceId?: string;
  height?: number;
};

type Node = {
  id: string;
  kind: "substance" | "impurity";
  label: string;
  sublabel: string;
  x: number;
  y: number;
  href: string;
};

type Edge = { from: string; to: string };

export function ImpurityGraph({
  substances,
  impurities,
  focusSubstanceId,
  height = 420,
}: Props) {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);

  const { nodes, edges, width } = useMemo(() => {
    const subs = focusSubstanceId
      ? substances.filter((s) => s.id === focusSubstanceId)
      : substances;
    const width = Math.max(640, subs.length * 280);
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const impById = new Map(impurities.map((i) => [i.id, i]));

    subs.forEach((s, si) => {
      const sx = 120 + si * 280;
      const sy = 70;
      nodes.push({
        id: s.id,
        kind: "substance",
        label: s.nameZh,
        sublabel: s.nameEn,
        x: sx,
        y: sy,
        href: `/substances/${s.id}`,
      });
      const related = s.relatedImpurityIds
        .map((id) => impById.get(id))
        .filter(Boolean) as ImpurityNode[];
      related.forEach((imp, ii) => {
        const ix = sx - 80 + (ii % 3) * 90;
        const iy = 220 + Math.floor(ii / 3) * 90;
        if (!nodes.find((n) => n.id === imp.id)) {
          nodes.push({
            id: imp.id,
            kind: "impurity",
            label: imp.nameZh,
            sublabel: imp.type,
            x: ix,
            y: iy,
            href: `/impurities/${imp.id}`,
          });
        }
        edges.push({ from: s.id, to: imp.id });
      });
    });

    return { nodes, edges, width };
  }, [substances, impurities, focusSubstanceId]);

  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="min-w-full"
        role="img"
        aria-label="杂质关系图谱"
      >
        {edges.map((e, i) => {
          const a = nodeMap.get(e.from);
          const b = nodeMap.get(e.to);
          if (!a || !b) return null;
          const active = hover === e.from || hover === e.to;
          return (
            <line
              key={`${e.from}-${e.to}-${i}`}
              x1={a.x}
              y1={a.y + 18}
              x2={b.x}
              y2={b.y - 18}
              stroke={active ? "#0f766e" : "#94a3b8"}
              strokeWidth={active ? 2.5 : 1.5}
            />
          );
        })}
        {nodes.map((n) => {
          const isSub = n.kind === "substance";
          const active = hover === n.id;
          return (
            <g
              key={n.id}
              transform={`translate(${n.x}, ${n.y})`}
              onMouseEnter={() => setHover(n.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => router.push(n.href)}
              style={{ cursor: "pointer" }}
              role="link"
              tabIndex={0}
              onKeyDown={(ev) => {
                if (ev.key === "Enter") router.push(n.href);
              }}
            >
              <title>{`${n.label} / ${n.sublabel}`}</title>
              <rect
                x={-70}
                y={-28}
                width={140}
                height={56}
                rx={12}
                fill={isSub ? (active ? "#0f766e" : "#134e4a") : active ? "#e11d48" : "#fff"}
                stroke={isSub ? "#5eead4" : "#fda4af"}
                strokeWidth={1.5}
              />
              <text
                textAnchor="middle"
                y={-4}
                fill={isSub ? "#ecfdf5" : "#0f172a"}
                fontSize={12}
                fontWeight={600}
              >
                {n.label.length > 10 ? n.label.slice(0, 10) + "…" : n.label}
              </text>
              <text
                textAnchor="middle"
                y={14}
                fill={isSub ? "#99f6e4" : "#64748b"}
                fontSize={10}
              >
                {n.sublabel.length > 16 ? n.sublabel.slice(0, 16) + "…" : n.sublabel}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="px-3 py-2 text-xs text-slate-500 border-t border-slate-200 bg-white">
        父物质（青绿）→ 杂质（白/玫红）。点击节点进入详情。基于种子 relatedImpurityIds。
      </p>
    </div>
  );
}
