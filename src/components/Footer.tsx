import Link from "next/link";
import { DISCLAIMER, OFFICIAL_LINKS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/90 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <p className="font-semibold text-teal-900 tracking-tight">药典对照层 · MVP</p>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              中文优先的药典索引与杂质发现层。不提供法定全文，不替代官方文本。
            </p>
            <p className="mt-3 text-xs text-amber-900/90 leading-relaxed rounded-lg bg-amber-50 border border-amber-100 px-2.5 py-2">
              {DISCLAIMER}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-2">站点</p>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li><Link href="/search" className="hover:text-teal-800 ph-focus-ring rounded">检索</Link></li>
              <li><Link href="/workbench" className="hover:text-teal-800 ph-focus-ring rounded">工作台</Link></li>
              <li><Link href="/compare" className="hover:text-teal-800 ph-focus-ring rounded">对比</Link></li>
              <li><Link href="/reference-standards" className="hover:text-teal-800 ph-focus-ring rounded">对照品目录</Link></li>
              <li><Link href="/alerts" className="hover:text-teal-800 ph-focus-ring rounded">修订提醒</Link></li>
              <li><Link href="/about" className="hover:text-teal-800 ph-focus-ring rounded">关于 / 数据来源</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-2">工具</p>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li><Link href="/tools/import" className="hover:text-teal-800">扩库导入</Link></li>
              <li><Link href="/tools/bookmarklet" className="hover:text-teal-800">书签工具</Link></li>
              <li><Link href="/structure" className="hover:text-teal-800">结构检索</Link></li>
              <li><Link href="/limits" className="hover:text-teal-800">ICH 限值</Link></li>
              <li><Link href="/ask" className="hover:text-teal-800">问答</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-2">官方入口</p>
            <ul className="space-y-1.5 text-sm text-slate-600">
              {Object.entries(OFFICIAL_LINKS).map(([code, link]) => (
                <li key={code}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-teal-800 font-latin"
                  >
                    {code} · {link.nameZh}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-5">
          <p className="text-xs text-slate-400 font-latin">
            Demo seed · Identity index only · Not for regulatory submission
          </p>
          <p className="text-xs text-slate-400">© MVP · 药典对照层</p>
        </div>
      </div>
    </footer>
  );
}
