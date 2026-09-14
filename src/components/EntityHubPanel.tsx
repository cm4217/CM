import Link from "next/link";
import type { HubLink, RelatedDrugSummary } from "@/lib/entityAssociation";

const toneClass: Record<NonNullable<HubLink["tone"]>, string> = {
  teal: "border-teal-200 bg-teal-50 text-teal-900 hover:border-teal-400",
  sky: "border-sky-200 bg-sky-50 text-sky-900 hover:border-sky-400",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-900 hover:border-indigo-400",
  amber: "border-amber-200 bg-amber-50 text-amber-950 hover:border-amber-400",
  rose: "border-rose-200 bg-rose-50 text-rose-900 hover:border-rose-400",
  slate: "border-slate-200 bg-slate-50 text-slate-800 hover:border-teal-300",
  violet: "border-violet-200 bg-violet-50 text-violet-900 hover:border-violet-400",
};

function HubChip({ link }: { link: HubLink }) {
  const cls = toneClass[link.tone || "slate"];
  const external = link.href.startsWith("http");
  const inner = (
    <>
      <span className="font-medium">{link.label}</span>
      {link.note ? (
        <span className="text-[10px] opacity-70 font-latin">{link.note}</span>
      ) : null}
    </>
  );
  if (external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs no-underline transition ${cls}`}
      >
        {inner}
        <span className="text-[10px] opacity-60">↗</span>
      </a>
    );
  }
  return (
    <Link
      href={link.href}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs no-underline transition ${cls}`}
    >
      {inner}
    </Link>
  );
}

/**
 * Unified entity hub: module jumps + optional related finished-drug strip.
 */
export function EntityHubPanel({
  title = "关联模块 · 实体枢纽",
  subtitle = "对照 · 杂质 · 成药 · 预警 · 工作台（身份层跳转）",
  links,
  relatedDrugs,
  entityIds,
}: {
  title?: string;
  subtitle?: string;
  links: HubLink[];
  relatedDrugs?: RelatedDrugSummary[];
  /** CAS / UNII / INN chips for copy-friendly identity */
  entityIds?: { cas?: string; unii?: string; inn?: string };
}) {
  return (
    <section
      id="entity-hub"
      aria-label={title}
      className="ph-card space-y-3 p-4 scroll-mt-24"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="ph-section-title text-base">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>
        {(entityIds?.cas || entityIds?.unii || entityIds?.inn) && (
          <div className="flex flex-wrap gap-1.5 font-latin text-[11px] text-slate-600">
            {entityIds.inn ? (
              <span className="ph-chip">INN {entityIds.inn}</span>
            ) : null}
            {entityIds.cas ? (
              <span className="ph-chip">CAS {entityIds.cas}</span>
            ) : null}
            {entityIds.unii ? (
              <span className="ph-chip">UNII {entityIds.unii}</span>
            ) : null}
          </div>
        )}
      </div>

      <ul className="flex flex-wrap gap-2">
        {links.map((l) => (
          <li key={l.key}>
            <HubChip link={l} />
          </li>
        ))}
      </ul>

      {relatedDrugs && relatedDrugs.length > 0 ? (
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <p className="text-xs font-medium text-slate-700">
            同 INN / UNII 成药
            <span className="ml-2 font-normal text-slate-400">
              身份索引 · 非说明书全文
            </span>
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {relatedDrugs.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/search?q=${encodeURIComponent(
                    d.inn || d.genericName || d.brandName
                  )}&type=drug`}
                  className="block rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 no-underline hover:border-indigo-300 hover:bg-indigo-50/40"
                >
                  <p className="text-sm font-medium text-slate-900">
                    {d.brandName}
                    {d.genericName && d.genericName !== d.brandName ? (
                      <span className="ml-1.5 text-xs font-normal text-slate-500 font-latin">
                        {d.genericName}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500 font-latin">
                    {[d.strength, d.dosageForm, d.regionTags.slice(0, 2).join("/")]
                      .filter(Boolean)
                      .join(" · ")}
                    <span className="ml-1.5 text-slate-400">via {d.joinVia}</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

/** Compact “另见” strip for SERP cards / knowledge panel. */
export function AlsoSeeStrip({ links }: { links: HubLink[] }) {
  if (!links.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="另见">
      <span className="text-[11px] text-slate-500">另见</span>
      {links.map((l) => (
        <HubChip key={l.key} link={l} />
      ))}
    </div>
  );
}
