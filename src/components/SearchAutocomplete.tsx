"use client";

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

export type SuggestItem = {
  source: "local" | "pubchem";
  kind?: "substance" | "impurity" | "synonym" | "cas" | "drug";
  id?: string;
  label: string;
  labelZh?: string;
  labelEn?: string;
  href?: string;
  cas?: string;
  unii?: string;
};

export type SuggestGroup = {
  type: string;
  items: SuggestItem[];
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (q: string) => void;
  /** Navigate to local href when picking a local hit */
  onPickHref?: (href: string) => void;
  placeholder?: string;
  inputId?: string;
  className?: string;
  inputClassName?: string;
  debounceMs?: number;
  /** Dark hero style */
  variant?: "hero" | "default";
  /** Hide the built-in submit button (e.g. when parent has 应用筛选) */
  hideSubmit?: boolean;
};

export function SearchAutocomplete({
  value,
  onChange,
  onSubmit,
  onPickHref,
  placeholder = "药名 / INN / CAS / 杂质名",
  inputId,
  className = "",
  inputClassName = "",
  debounceMs = 250,
  variant = "default",
  hideSubmit = false,
}: Props) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<SuggestGroup[]>([]);
  const [active, setActive] = useState(-1);
  const abortRef = useRef<AbortController | null>(null);

  const flatItems = useMemo(
    () => groups.flatMap((g) => g.items.map((item) => ({ group: g.type, item }))),
    [groups]
  );

  const fetchSuggest = useCallback(async (q: string) => {
    abortRef.current?.abort();
    const t = q.trim();
    if (t.length < 1) {
      setGroups([]);
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    try {
      const res = await fetch(`/api/suggest?q=${encodeURIComponent(t)}`, {
        signal: ac.signal,
      });
      if (!res.ok) throw new Error("suggest failed");
      const json = await res.json();
      if (Array.isArray(json.groups) && json.groups.length) {
        setGroups(json.groups as SuggestGroup[]);
      } else {
        const suggestions = (json.suggestions || []) as SuggestItem[];
        setGroups(suggestions.length ? [{ type: "建议", items: suggestions }] : []);
      }
      setActive(-1);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setGroups([]);
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => fetchSuggest(value), debounceMs);
    return () => window.clearTimeout(t);
  }, [value, debounceMs, fetchSuggest]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    function onClose() {
      setOpen(false);
    }
    window.addEventListener("pharm:close-autocomplete", onClose);
    return () => window.removeEventListener("pharm:close-autocomplete", onClose);
  }, []);

  function pick(item: SuggestItem) {
    const q = item.labelZh || item.labelEn || item.label;
    onChange(q);
    setOpen(false);
    if (item.href && onPickHref) {
      onPickHref(item.href);
      return;
    }
    onSubmit(q);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp") && flatItems.length) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (open && active >= 0 && flatItems[active]) {
        e.preventDefault();
        pick(flatItems[active].item);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setOpen(false);
    onSubmit(value);
  }

  const show = open && (flatItems.length > 0 || loading);

  let flatIdx = -1;

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <label className="sr-only" htmlFor={inputId}>
          检索
        </label>
        <input
          id={inputId}
          data-pharm-search
          role="combobox"
          aria-expanded={show}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            active >= 0 ? `${listId}-opt-${active}` : undefined
          }
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={
            inputClassName ||
            (variant === "hero"
              ? "flex-1 rounded-xl border-0 px-4 py-3 text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300"
              : "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500")
          }
        />
        {!hideSubmit ? (
          <button
            type="submit"
            className={
              variant === "hero"
                ? "rounded-xl bg-white px-6 py-3 text-sm font-semibold text-teal-900 shadow hover:bg-teal-50 transition"
                : "rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
            }
          >
            检索
          </button>
        ) : null}
      </form>

      {show ? (
        <div
          id={listId}
          role="listbox"
          className={`absolute z-30 mt-1 max-h-80 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg ${
            variant === "hero" ? "sm:max-w-xl" : ""
          }`}
        >
          {loading && flatItems.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400">加载建议…</div>
          ) : null}
          {groups.map((g) => (
            <div key={g.type} className="border-b border-slate-100 last:border-0">
              <div className="sticky top-0 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {g.type}
              </div>
              <ul>
                {g.items.map((item) => {
                  flatIdx += 1;
                  const idx = flatIdx;
                  return (
                    <li
                      key={`${g.type}-${item.source}-${item.id || item.label}-${idx}`}
                      id={`${listId}-opt-${idx}`}
                      role="option"
                      aria-selected={idx === active}
                      className={`cursor-pointer px-3 py-2 text-sm ${
                        idx === active ? "bg-teal-50 text-teal-950" : "text-slate-800"
                      }`}
                      onMouseEnter={() => setActive(idx)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pick(item);
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span>
                          {item.labelZh && item.labelEn ? (
                            <>
                              {item.labelZh}{" "}
                              <span className="text-slate-500 font-latin text-xs">
                                {item.labelEn}
                              </span>
                            </>
                          ) : (
                            <span className="font-latin">{item.label}</span>
                          )}
                          {item.cas ? (
                            <span className="ml-2 font-latin text-[10px] text-slate-400">
                              CAS {item.cas}
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
