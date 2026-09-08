"use client";

import {
  buildOfficialQueryLinks,
  type OfficialQueryInput,
} from "@/lib/officialQueryLinks";

type Props = OfficialQueryInput & {
  /** Section heading; default 「官网查询」 */
  title?: string;
  /** Compact chip row for search cards */
  compact?: boolean;
  className?: string;
};

/**
 * Compact external chips linking to official pharmacopoeia / open DBs.
 * Does not imply we host full text. stopPropagation so cards stay clickable.
 */
export function OfficialQueryLinks({
  nameZh,
  nameEn,
  inn,
  cas,
  title = "官网查询",
  compact = false,
  className = "",
}: Props) {
  const links = buildOfficialQueryLinks({ nameZh, nameEn, inn, cas });
  if (links.length === 0) return null;

  return (
    <div
      className={`space-y-1.5 ${className}`}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <p
          className={`font-medium text-slate-700 ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {title}
          <span className="ml-1.5 font-normal text-slate-400">去官网查</span>
        </p>
        {!compact && (
          <p className="text-[11px] text-slate-400">
            外链至官方/公开库 · 本站不托管专论全文
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {links.map((link) => (
          <a
            key={link.code}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            title={link.note || link.labelZh}
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs no-underline transition ${
              link.thirdParty
                ? "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                : "border-teal-200 bg-teal-50 text-teal-900 hover:border-teal-400 hover:bg-teal-100"
            }`}
          >
            <span className={link.thirdParty ? "" : "font-medium"}>
              {link.labelZh}
            </span>
            <span className="opacity-60" aria-hidden>
              ↗
            </span>
          </a>
        ))}
      </div>
      {!compact && (
        <p className="text-[11px] leading-relaxed text-slate-400">
          多数药典站点需订阅/登录后站内检索；带「站外·」标记的为第三方搜索助手，非官方门户。
        </p>
      )}
    </div>
  );
}
