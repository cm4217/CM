"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { SearchHit } from "@/lib/types";
import { relatedByCooccur, recordCooccur } from "@/lib/sessionCooccur";
import { logSearchClick } from "@/components/SearchLogBeacon";

type Props = {
  focus: SearchHit | null;
  hits: SearchHit[];
  query?: string;
};

type Item = { label: string; href: string; note: string };

/**
 * Related-results strip: server co-click / co-occur + session fallback + impurity parents.
 */
export function SearchRelatedStrip({ focus, hits, query }: Props) {
  const [serverItems, setServerItems] = useState<Item[]>([]);
  const [coIds, setCoIds] = useState<string[]>([]);

  useEffect(() => {
    if (!focus) {
      setCoIds([]);
      setServerItems([]);
      return;
    }
    recordCooccur(
      focus.id,
      hits.slice(0, 5).map((h) => h.id)
    );
    setCoIds(relatedByCooccur(focus.id, 8));
    logSearchClick({
      entityId: focus.id,
      kind: focus.kind,
      q: query,
    });

    const params = new URLSearchParams({
      id: focus.id,
      kind: focus.kind,
      limit: "8",
    });
    if (query) params.set("q", query);
    let cancelled = false;
    fetch("/api/related?" + params.toString(), { credentials: "same-origin" })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const items = Array.isArray(json?.items) ? json.items : [];
        setServerItems(
          items.map(
            (it: {
              labelZh?: string;
              href?: string;
              note?: string;
            }) => ({
              label: String(it.labelZh || ""),
              href: String(it.href || "#"),
              note: String(it.note || "服务端相关"),
            })
          )
        );
      })
      .catch(() => {
        if (!cancelled) setServerItems([]);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by focus id
  }, [focus?.id, focus?.kind, query]);

  const items = useMemo(() => {
    if (!focus) return [] as Item[];
    const out: Item[] = [];
    const seen = new Set<string>([`${focus.kind}:${focus.id}`]);

    for (const it of serverItems) {
      if (out.length >= 8) break;
      const k = it.href;
      if (seen.has(k) || !it.label) continue;
      seen.add(k);
      out.push(it);
    }

    if (focus.kind === "substance" && focus.impurityPreview?.length) {
      for (const name of focus.impurityPreview.slice(0, 4)) {
        if (out.length >= 8) break;
        const imp = hits.find(
          (h) => h.kind === "impurity" && (h.titleZh === name || h.titleEn === name)
        );
        if (imp) {
          const k = `impurity:${imp.id}`;
          if (seen.has(k)) continue;
          seen.add(k);
          out.push({
            label: imp.titleZh,
            href: `/impurities/${imp.id}`,
            note: "关联杂质",
          });
        } else {
          const href = `/search?q=${encodeURIComponent(name)}&tab=impurity`;
          if (seen.has(href)) continue;
          seen.add(href);
          out.push({ label: name, href, note: "杂质预览" });
        }
      }
    }
    if (focus.kind === "impurity" && focus.parentNames?.length) {
      for (let i = 0; i < focus.parentNames.length; i++) {
        if (out.length >= 8) break;
        const name = focus.parentNames[i];
        const pid = focus.parentIds?.[i];
        const k = pid ? `substance:${pid}` : `name:${name}`;
        if (seen.has(k)) continue;
        seen.add(k);
        out.push({
          label: name,
          href: pid
            ? `/substances/${pid}`
            : `/search?q=${encodeURIComponent(name)}&tab=substance`,
          note: "父物质",
        });
      }
    }

    for (const id of coIds) {
      if (out.length >= 8) break;
      const hit = hits.find((h) => h.id === id);
      if (hit) {
        const k = `${hit.kind}:${hit.id}`;
        if (seen.has(k)) continue;
        seen.add(k);
        out.push({
          label: hit.titleZh,
          href:
            hit.kind === "substance"
              ? `/substances/${hit.id}`
              : hit.kind === "impurity"
                ? `/impurities/${hit.id}`
                : `/reference-standards#${hit.id}`,
          note: "同会话相关",
        });
      }
    }

    for (const h of hits) {
      if (out.length >= 8) break;
      if (h.id === focus.id && h.kind === focus.kind) continue;
      if (h.kind === focus.kind) continue;
      const k = `${h.kind}:${h.id}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({
        label: h.titleZh,
        href:
          h.kind === "substance"
            ? `/substances/${h.id}`
            : h.kind === "impurity"
              ? `/impurities/${h.id}`
              : `/reference-standards#${h.id}`,
        note:
          h.kind === "substance"
            ? "同页物质"
            : h.kind === "impurity"
              ? "同页杂质"
              : "同页对照品",
      });
    }

    return out.slice(0, 8);
  }, [focus, hits, coIds, serverItems]);

  if (!focus || items.length === 0) return null;

  return (
    <section
      aria-label="相关结果"
      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm"
    >
      <h2 className="text-xs font-semibold text-slate-700">
        相关结果
        <span className="ml-2 font-normal text-slate-400">
          服务端共现 / 关联杂质 / 同会话（冷启动回退）
        </span>
      </h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {items.map((it) => (
          <li key={`${it.href}-${it.label}`}>
            <Link
              href={it.href}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-800 no-underline hover:border-teal-400 hover:bg-teal-50"
            >
              <span>{it.label}</span>
              <span className="text-[10px] text-slate-400">{it.note}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
