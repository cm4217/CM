"use client";

import { useEffect } from "react";
import { showToast } from "@/lib/toastBus";

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return Boolean(el.closest("[contenteditable='true']"));
}

/**
 * Global hotkeys:
 * - `/` focus search input (data-pharm-search or #q / #search-q)
 * - `c` copy primary drug name on substance page ([data-pharm-primary-name])
 * - `Esc` close autocomplete (dispatch pharm:close-autocomplete)
 * Ignores when focus is in input/textarea.
 */
export function GlobalHotkeys() {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "Escape") {
        window.dispatchEvent(new CustomEvent("pharm:close-autocomplete"));
        return;
      }

      if (isTypingTarget(e.target)) return;

      if (e.key === "/") {
        e.preventDefault();
        const el =
          (document.querySelector("[data-pharm-search]") as HTMLInputElement | null) ||
          (document.getElementById("q") as HTMLInputElement | null) ||
          (document.getElementById("search-q") as HTMLInputElement | null) ||
          (document.querySelector('input[placeholder*="药名"]') as HTMLInputElement | null);
        if (el) {
          el.focus();
          el.select?.();
        } else {
          showToast("当前页无检索框", "warn");
        }
        return;
      }

      if (e.key === "c" || e.key === "C") {
        const node = document.querySelector("[data-pharm-primary-name]");
        const name = node?.getAttribute("data-pharm-primary-name") || node?.textContent?.trim();
        if (!name) return;
        e.preventDefault();
        navigator.clipboard
          ?.writeText(name)
          .then(() => showToast(`已复制：${name}`))
          .catch(() => showToast("复制失败", "err"));
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}
