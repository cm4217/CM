import Link from "next/link";
import { DISCLAIMER, OFFICIAL_LINKS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="font-semibold text-teal-900">药典对照层 · MVP</p>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              中文优先的药典索引与杂质发现层。不提供法定全文，不替代官方文本。
            </p>
            <p className="mt-3 text-xs text-amber-800 leading-relaxed">{DISCLAIMER}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-2">站点</p>
            <ul className="space-y-1 text-sm text-slate-600">
              <li>
                <Link href="/search" className="hover:text-teal-800">
                  检索
                </Link>
              </li>
              <li>
                <Link href="/reference-standards" className="hover:text-teal-800">
                  对照品目录
                </Link>
              </li>
              <li>
                <Link href="/alerts" className="hover:text-teal-800">
                  修订提醒
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-teal-800">
                  关于 / 数据来源
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-2">官方入口</p>
            <ul className="space-y-1 text-sm text-slate-600">
              {Object.entries(OFFICIAL_LINKS).map(([code, link]) => (
                <li key={code}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-teal-800"
                  >
                    {code} · {link.nameZh}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-8 text-xs text-slate-400 font-latin">
          Demo seed data · Not for regulatory submission · © MVP
        </p>
      </div>
    </footer>
  );
}
