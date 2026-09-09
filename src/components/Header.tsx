"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const primary = [
  { href: "/", label: "首页" },
  { href: "/search", label: "检索" },
  { href: "/workbench", label: "工作台" },
  { href: "/compare", label: "对比" },
  { href: "/alerts", label: "修订提醒" },
];

const more = [
  { href: "/checklist", label: "核查清单" },
  { href: "/graph", label: "图谱" },
  { href: "/structure", label: "结构检索" },
  { href: "/reference-standards", label: "对照品" },
  { href: "/limits", label: "限值" },
  { href: "/watchlist", label: "关注" },
  { href: "/notes", label: "备注" },
  { href: "/ask", label: "问答" },
  { href: "/tools/import", label: "扩库" },
  { href: "/tools/bookmarklet", label: "工具" },
  { href: "/about", label: "关于 / 数据来源" },
];

const allNav = [...primary, ...more];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = more.some((item) => isActive(pathname, item.href));

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5">
        <Link href="/" className="group flex items-baseline gap-2 shrink-0 ph-focus-ring rounded-lg">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-teal-800 text-xs font-bold text-teal-50 shadow-sm">
            典
          </span>
          <span className="text-lg font-bold text-teal-900 tracking-tight">
            药典对照层
          </span>
          <span className="hidden xl:inline text-xs text-slate-500 font-latin group-hover:text-teal-700">
            Pharmacopoeia Index
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-0.5 flex-wrap justify-end" aria-label="主导航">
          {primary.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-2.5 py-1.5 text-sm transition ph-focus-ring ${
                  active
                    ? "bg-teal-50 text-teal-900 font-semibold shadow-sm ring-1 ring-teal-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="relative">
            <button
              type="button"
              className={`rounded-lg px-2.5 py-1.5 text-sm transition ph-focus-ring ${
                moreActive || moreOpen
                  ? "bg-teal-50 text-teal-900 font-semibold ring-1 ring-teal-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              onClick={() => setMoreOpen((v) => !v)}
            >
              更多
            </button>
            {moreOpen ? (
              <div
                role="menu"
                className="absolute right-0 mt-1.5 w-44 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg z-50"
              >
                {more.map((item) => (
                  <Link
                    key={item.href}
                    role="menuitem"
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`block px-3 py-2 text-sm ${
                      isActive(pathname, item.href)
                        ? "bg-teal-50 text-teal-900 font-medium"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </nav>

        <button
          type="button"
          className="md:hidden rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm ph-focus-ring"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="菜单"
        >
          菜单
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t border-slate-100 bg-white px-4 py-2 flex flex-col gap-0.5 max-h-[70vh] overflow-y-auto" aria-label="移动导航">
          {allNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`rounded-lg px-3 py-2.5 text-sm ${
                isActive(pathname, item.href)
                  ? "bg-teal-50 text-teal-900 font-medium"
                  : "text-slate-700 hover:bg-teal-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
