"use client";

import { useCallback, useMemo, useState } from "react";
import {
  buildOfficialQueryLinks,
  chinesePaste,
  englishPaste,
  PORTAL_OPEN_URLS,
  type OfficialQueryInput,
  type OfficialQueryLink,
} from "@/lib/officialQueryLinks";

type Props = OfficialQueryInput & {
  /** Section heading; default 「官网查询」 */
  title?: string;
  /** Compact chip row for search cards */
  compact?: boolean;
  className?: string;
};

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function Chip({
  link,
  onPortalClick,
}: {
  link: OfficialQueryLink;
  onPortalClick?: (link: OfficialQueryLink) => void;
}) {
  const isPortal = link.group === "portal" && !!link.copyText;

  if (isPortal && onPortalClick) {
    return (
      <button
        type="button"
        title={link.note || link.labelZh}
        onClick={(e) => {
          e.stopPropagation();
          onPortalClick(link);
        }}
        className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs text-amber-950 transition hover:border-amber-400 hover:bg-amber-100"
      >
        <span>{link.labelZh}</span>
        <span className="opacity-60" aria-hidden>
          ↗
        </span>
      </button>
    );
  }

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      title={link.note || link.labelZh}
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs no-underline transition ${
        link.thirdParty
          ? "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
          : link.carriesQuery
            ? "border-teal-200 bg-teal-50 text-teal-900 hover:border-teal-400 hover:bg-teal-100"
            : "border-amber-200 bg-amber-50 text-amber-950 hover:border-amber-400 hover:bg-amber-100"
      }`}
    >
      <span className={link.thirdParty ? "" : "font-medium"}>{link.labelZh}</span>
      <span className="opacity-60" aria-hidden>
        ↗
      </span>
    </a>
  );
}

/**
 * Compact external chips linking to official pharmacopoeia / open DBs.
 * Primary: copy name / copy+open portals. Chips: with-query vs portal groups.
 * Does not imply we host full text. stopPropagation so cards stay clickable.
 */
export function OfficialQueryLinks({
  nameZh,
  nameEn,
  inn,
  cas,
  unii,
  title = "官网查询",
  compact = false,
  className = "",
}: Props) {
  const input = useMemo(
    () => ({ nameZh, nameEn, inn, cas, unii }),
    [nameZh, nameEn, inn, cas, unii]
  );
  const links = useMemo(() => buildOfficialQueryLinks(input), [input]);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const doCopy = useCallback(
    async (text: string, label?: string) => {
      if (!text) return;
      const ok = await copyToClipboard(text);
      showToast(ok ? `已复制：${label || text}` : "复制失败，请手动选择");
    },
    [showToast]
  );

  const copyAndOpen = useCallback(
    async (text: string, url: string, portalLabel: string) => {
      if (!text) return;
      const ok = await copyToClipboard(text);
      window.open(url, "_blank", "noopener,noreferrer");
      showToast(
        ok
          ? `已复制：${text}，请在${portalLabel}搜索框粘贴 Ctrl+V`
          : `已打开${portalLabel}；复制失败，请手动输入`
      );
    },
    [showToast]
  );

  const onPortalChip = useCallback(
    async (link: OfficialQueryLink) => {
      const text = link.copyText || "";
      if (text) {
        const ok = await copyToClipboard(text);
        window.open(link.url, "_blank", "noopener,noreferrer");
        showToast(
          ok
            ? `已复制：${text}，请在官网搜索框粘贴 Ctrl+V`
            : "已打开官网；复制失败，请手动输入"
        );
      } else {
        window.open(link.url, "_blank", "noopener,noreferrer");
      }
    },
    [showToast]
  );

  if (links.length === 0) return null;

  const withQuery = links.filter((l) => l.group === "withQuery");
  const portals = links.filter((l) => l.group === "portal");

  const zh = chinesePaste(input);
  const en = englishPaste(input);
  const casVal = cas?.trim() || "";
  const enLabel = inn?.trim() || nameEn?.trim() || en;

  return (
    <div
      className={`space-y-2 ${className}`}
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

      {/* Primary copy / copy+open actions */}
      <div className="flex flex-wrap gap-1.5">
        {zh ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void doCopy(zh);
            }}
            className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 hover:border-teal-300 hover:bg-teal-50"
          >
            复制中文名
          </button>
        ) : null}
        {enLabel ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void doCopy(enLabel, enLabel);
            }}
            className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 hover:border-teal-300 hover:bg-teal-50"
          >
            复制英文名/INN
          </button>
        ) : null}
        {casVal ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void doCopy(casVal);
            }}
            className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 hover:border-teal-300 hover:bg-teal-50 font-latin"
          >
            复制 CAS
          </button>
        ) : null}
        {zh ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void copyAndOpen(zh, PORTAL_OPEN_URLS.ChP, "中国药典");
            }}
            className="inline-flex items-center rounded-md border border-teal-300 bg-teal-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-teal-700"
          >
            复制并打开中国药典
          </button>
        ) : null}
        {en ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void copyAndOpen(en, PORTAL_OPEN_URLS.USP, "USP–NF");
            }}
            className="inline-flex items-center rounded-md border border-teal-300 bg-teal-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-teal-700"
          >
            复制并打开 USP
          </button>
        ) : null}
        {en ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void copyAndOpen(en, PORTAL_OPEN_URLS.EP, "Ph. Eur.");
            }}
            className="inline-flex items-center rounded-md border border-teal-300 bg-teal-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-teal-700"
          >
            复制并打开 EP
          </button>
        ) : null}
      </div>

      {toast ? (
        <p
          role="status"
          className="rounded-md bg-slate-800 px-2.5 py-1 text-[11px] text-white shadow-sm"
        >
          {toast}
        </p>
      ) : null}

      {withQuery.length > 0 ? (
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-teal-800">
            已带关键词（免再输入）
            <span className="ml-1 font-normal text-slate-400">
              一键带词检索 / 公开库
            </span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {withQuery.map((link) => (
              <Chip key={link.code} link={link} />
            ))}
          </div>
        </div>
      ) : null}

      {portals.length > 0 ? (
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-amber-900">
            官网入口（登录后粘贴）
            <span className="ml-1 font-normal text-slate-400">
              点击先复制再打开
            </span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {portals.map((link) => (
              <Chip key={link.code} link={link} onPortalClick={onPortalChip} />
            ))}
          </div>
        </div>
      ) : null}

      {!compact && (
        <p className="text-[11px] leading-relaxed text-slate-400">
          多数药典站点需订阅/登录后站内检索；「一键·」「Duck·」「Google·」为带关键词的站外检索助手（非官方）。官网入口点击会先复制药名再打开，便于 Ctrl+V
          粘贴。
        </p>
      )}
    </div>
  );
}
