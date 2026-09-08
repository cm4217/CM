"use client";

import Link from "next/link";
import { DemoBadge } from "@/components/DemoBadge";
import { DisclaimerBanner } from "@/components/Disclaimer";

function makeBookmarklet(kind: "chp" | "usp" | "ep" | "fill"): string {
  const scripts: Record<string, string> = {
    chp: `javascript:(function(){var t=window.getSelection&&String(window.getSelection());if(!t)t=prompt('药名/关键词（将复制并打开中国药典查询）','');if(!t)return;try{navigator.clipboard.writeText(t);}catch(e){}alert('已尝试复制：「'+t+'」\\n请在打开的中国药典页面粘贴检索。\\n本站不提供专论全文。');window.open('https://ydz.chp.org.cn/#/database?bookId=2','_blank');})();`,
    usp: `javascript:(function(){var t=window.getSelection&&String(window.getSelection());if(!t)t=prompt('Drug name for USP–NF search','');if(!t)return;try{navigator.clipboard.writeText(t);}catch(e){}alert('Copied (best-effort): '+t+'\\nPaste into USP–NF after login/subscribe.');window.open('https://www.uspnf.com/','_blank');})();`,
    ep: `javascript:(function(){var t=window.getSelection&&String(window.getSelection());if(!t)t=prompt('Name for Ph. Eur. / EDQM','');if(!t)return;try{navigator.clipboard.writeText(t);}catch(e){}alert('Copied (best-effort): '+t+'\\nPaste into Ph. Eur. Online (subscription).');window.open('https://pheur-online.edqm.eu/','_blank');})();`,
    fill: `javascript:(function(){var t=window.getSelection&&String(window.getSelection());if(!t)t=prompt('填入当前焦点输入框的药名','');if(!t)return;var el=document.activeElement;if(el&&(el.tagName==='INPUT'||el.tagName==='TEXTAREA')&&!el.disabled&&!el.readOnly){el.value=t;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));alert('已尝试填入焦点输入框');}else{try{navigator.clipboard.writeText(t);}catch(e){}alert('无焦点输入框，已复制到剪贴板：'+t);}})();`,
  };
  return scripts[kind];
}

const items: { kind: "chp" | "usp" | "ep" | "fill"; title: string; desc: string }[] = [
  {
    kind: "chp",
    title: "打开中国药典并粘贴检索",
    desc: "复制选区/提示输入药名 → 打开 ydz.chp.org.cn #/database?bookId=2 → 提示粘贴",
  },
  {
    kind: "usp",
    title: "打开 USP–NF",
    desc: "复制药名后打开 uspnf.com（需订阅/登录）",
  },
  {
    kind: "ep",
    title: "打开 Ph. Eur. Online",
    desc: "复制药名后打开 pheur-online.edqm.eu（需订阅）",
  },
  {
    kind: "fill",
    title: "填入当前输入框",
    desc: "尽力将药名写入页面焦点 input/textarea；否则复制到剪贴板",
  },
];

export default function BookmarkletPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">书签小工具</h1>
          <p className="mt-1 text-sm text-slate-500 font-latin">Bookmarklets · official portals</p>
        </div>
        <DemoBadge />
      </div>
      <DisclaimerBanner compact />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold">安装说明（中文）</h2>
        <ol className="list-decimal pl-5 text-sm text-slate-700 space-y-1">
          <li>显示浏览器书签栏（Chrome：Ctrl+Shift+B / Mac：⌘⇧B）。</li>
          <li>将下方蓝色链接<strong>拖到书签栏</strong>。</li>
          <li>在任意网页选中药名，或点击书签后按提示输入，再按说明粘贴到官网。</li>
          <li>本工具仅打开官方门户并复制关键词，<strong>不抓取、不缓存专论全文</strong>。</li>
        </ol>
        <p className="text-xs text-slate-500">
          若拖拽无效：右键书签栏 → 添加书签 → 将链接地址粘贴到 URL（以 javascript: 开头）。
        </p>
      </section>

      <ul className="space-y-3">
        {items.map((it) => (
          <li key={it.kind} className="rounded-xl border border-teal-200 bg-teal-50/40 p-4">
            <a
              href={makeBookmarklet(it.kind)}
              onClick={(e) => {
                e.preventDefault();
                alert("请把此链接拖到书签栏，而不是在本页点击。");
              }}
              className="inline-flex items-center rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 cursor-grab"
              title="拖到书签栏"
            >
              ★ {it.title}
            </a>
            <p className="mt-2 text-xs text-slate-600">{it.desc}</p>
          </li>
        ))}
      </ul>

      <p className="text-sm text-slate-600">
        相关：{" "}
        <Link href="/tools/sheets" className="text-teal-700 hover:underline">
          Excel / 表格集成
        </Link>{" "}
        ·{" "}
        <Link href="/about" className="text-teal-700 hover:underline">
          关于 / 版权
        </Link>
      </p>
    </div>
  );
}
