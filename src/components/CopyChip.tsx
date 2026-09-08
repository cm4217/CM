"use client";

import { showToast } from "@/lib/toastBus";

type Props = {
  value: string;
  /** Button label, defaults to a short hint */
  label?: string;
  className?: string;
};

export function CopyChip({ value, label, className = "" }: Props) {
  if (!value) return null;
  const display = label || value;
  return (
    <button
      type="button"
      title={`复制 ${display}`}
      aria-label={`复制 ${display}`}
      className={
        "inline-flex items-center rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-600 " +
        "hover:border-teal-400 hover:bg-teal-50 hover:text-teal-900 " +
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 " +
        className
      }
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void (async () => {
          try {
            await navigator.clipboard.writeText(value);
            showToast(`已复制：${display}`, "ok");
          } catch {
            showToast("复制失败", "err");
          }
        })();
      }}
    >
      复制{label ? label : ""}
    </button>
  );
}
