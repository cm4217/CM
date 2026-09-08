"use client";

import { useMemo } from "react";
import {
  buildOfficialQueryLinks,
  DOC_DEEP_LINK_DISCLAIMER,
  type OfficialQueryInput,
} from "@/lib/officialQueryLinks";

type Props = OfficialQueryInput & {
  compact?: boolean;
  className?: string;
};

/**
 * Document-ID deep links (Ph. Eur. / USP DOI / Inxight UNII / Ph.Int. path).
 * Only renders buttons when corresponding fields are present.
 */
export function DocDeepLinks({
  compact = false,
  className = "",
  ...input
}: Props) {
  const deep = useMemo(
    () => buildOfficialQueryLinks(input).filter((l) => l.group === "deep"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      input.nameZh,
      input.nameEn,
      input.inn,
      input.cas,
      input.unii,
      input.epTextNumber,
      input.uspDoi,
      input.phIntDocPath,
    ]
  );

  if (deep.length === 0) return null;

  return (
    <div
      className={`space-y-1.5 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <p
        className={`font-medium text-indigo-900 ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        文档直达
        <span className="ml-1.5 font-normal text-slate-400">
          ID / DOI / UNII
        </span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {deep.map((link) => (
          <a
            key={link.code}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            title={link.note || link.labelZh}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium no-underline transition ${
              link.demoId
                ? "border-amber-300 bg-amber-50 text-amber-950 hover:border-amber-400 hover:bg-amber-100"
                : "border-indigo-200 bg-indigo-50 text-indigo-950 hover:border-indigo-400 hover:bg-indigo-100"
            }`}
          >
            {link.labelZh}
            <span className="opacity-60" aria-hidden>
              ↗
            </span>
          </a>
        ))}
      </div>
      {!compact && (
        <p className="text-[11px] leading-relaxed text-slate-400">
          {DOC_DEEP_LINK_DISCLAIMER}
        </p>
      )}
    </div>
  );
}
