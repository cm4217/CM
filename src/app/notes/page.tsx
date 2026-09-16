"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  exportNotesJson,
  importNotesJson,
  loadNotes,
  type NotesStore,
} from "@/lib/notesStorage";
import { DemoBadge } from "@/components/DemoBadge";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { NotesPanel } from "@/components/NotesPanel";
import { substances, impurities } from "@/data";

function NotesInner() {
  const sp = useSearchParams();
  const [store, setStore] = useState<NotesStore>({});
  const [importText, setImportText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const focus = useMemo(() => {
    const sid = sp.get("substance");
    const iid = sp.get("impurity");
    if (sid) {
      const s = substances.find((x) => x.id === sid);
      return {
        kind: "substance" as const,
        id: sid,
        titleZh: s?.nameZh || sid,
      };
    }
    if (iid) {
      const i = impurities.find((x) => x.id === iid);
      return {
        kind: "impurity" as const,
        id: iid,
        titleZh: i?.nameZh || iid,
      };
    }
    return null;
  }, [sp]);

  function refresh() {
    setStore(loadNotes());
  }

  useEffect(() => {
    refresh();
  }, []);

  const entries = Object.values(store).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );

  function onExport() {
    const blob = new Blob([exportNotesJson()], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pharmacopoeia-notes-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onImport() {
    try {
      importNotesJson(importText);
      refresh();
      setMsg("导入成功");
      setImportText("");
    } catch (e) {
      setMsg(String((e as Error).message || e));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">个人备注</h1>
          <p className="mt-1 text-sm text-slate-500 font-latin">
            Collaboration lite · localStorage only
          </p>
        </div>
        <DemoBadge />
      </div>

      <DisclaimerBanner compact />

      <aside className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        备注仅存于本机浏览器。团队同步、权限与审计需要后续账号体系，本 MVP 不做服务端鉴权。
      </aside>

      {focus ? (
        <div className="space-y-2">
          <p className="text-sm text-teal-900">
            已从链接定位到{" "}
            <span className="font-medium">{focus.titleZh}</span>
            <span className="ml-2 font-latin text-xs text-slate-500">
              {focus.kind}:{focus.id}
            </span>
          </p>
          <NotesPanel kind={focus.kind} targetId={focus.id} titleZh={focus.titleZh} />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onExport}
          className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm text-white hover:bg-teal-800"
        >
          导出 JSON
        </button>
        <button
          type="button"
          onClick={refresh}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
        >
          刷新
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
        <h2 className="text-sm font-semibold">导入 JSON</h2>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-latin"
          placeholder="粘贴导出的 JSON…"
        />
        <button
          type="button"
          onClick={onImport}
          className="rounded-lg border border-teal-600 px-3 py-1.5 text-sm text-teal-800"
        >
          导入（覆盖）
        </button>
        {msg && <p className="text-xs text-slate-600">{msg}</p>}
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-slate-500">
          暂无备注。请到物质/杂质详情页的「备注面板」添加，或使用{" "}
          <code className="font-latin text-xs">/notes?substance=sub-aspirin</code>。
        </p>
      ) : (
        <ul className="space-y-3">
          {entries.map((e) => (
            <li
              key={`${e.targetKind}:${e.targetId}`}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="rounded bg-slate-100 px-2 py-0.5">{e.targetKind}</span>
                <span className="font-latin">{e.targetId}</span>
                {e.methodCode && (
                  <span className="font-latin text-teal-800">#{e.methodCode}</span>
                )}
              </div>
              <p className="mt-2 text-sm whitespace-pre-wrap">{e.body || "（空）"}</p>
              <Link
                href={
                  e.targetKind === "substance"
                    ? `/substances/${e.targetId}`
                    : `/impurities/${e.targetId}`
                }
                className="mt-2 inline-block text-sm text-teal-700 hover:underline"
              >
                打开详情 →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">加载备注…</p>}>
      <NotesInner />
    </Suspense>
  );
}
