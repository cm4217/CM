"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const nav = [
  { href: "/", label: "首页" },
  { href: "/workbench", label: "工作台" },
  { href: "/search", label: "检索" },
  { href: "/compare", label: "对比" },
  { href: "/checklist", label: "核查清单" },
  { href: "/graph", label: "图谱" },
  { href: "/structure", label: "结构检索" },
  { href: "/reference-standards", label: "对照品" },
  { href: "/limits", label: "限值" },
  { href: "/alerts", label: "修订提醒" },
  { href: "/watchlist", label: "关注" },
  { href: "/notes", label: "备注" },
  { href: "/ask", label: "问答" },
  { href: "/tools/import", label: "扩库" },
  { href: "/tools/bookmarklet", label: "工具" },
  { href: "/about", label: "关于 / 数据来源" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="group flex items-baseline gap-2 shrink-0">
          <span className="text-lg font-bold text-teal-800 tracking-tight">
            药典对照层
          </span>
          <span className="hidden lg:inline text-xs text-slate-500 font-latin group-hover:text-teal-700">
            Pharmacopoeia Index
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-0.5 flex-wrap justify-end">
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-2.5 py-1.5 text-sm transition ${
                  active
                    ? "bg-teal-50 text-teal-900 font-medium"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="md:hidden rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="菜单"
        >
          菜单
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t border-slate-100 bg-white px-4 py-2 flex flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-teal-50"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
