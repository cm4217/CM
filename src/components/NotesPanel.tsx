"use client";

import { useEffect, useState } from "react";
import {
  deleteNote,
  getNote,
  upsertNote,
  type NoteEntry,
} from "@/lib/notesStorage";

type Props = {
  kind: "substance" | "impurity";
  targetId: string;
  titleZh: string;
};

export function NotesPanel({ kind, targetId, titleZh }: Props) {
  const [methodCode, setMethodCode] = useState("");
  const [body, setBody] = useState("");
  const [saved, setSaved] = useState<NoteEntry | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const n = getNote(kind, targetId);
    if (n) {
      setMethodCode(n.methodCode || "");
      setBody(n.body || "");
      setSaved(n);
    } else {
      setMethodCode("");
      setBody("");
      setSaved(null);
    }
  }, [kind, targetId]);

  function onSave() {
    const entry = upsertNote(kind, targetId, { methodCode, body });
    setSaved(entry);
    setMsg("已保存到本机 localStorage");
    setTimeout(() => setMsg(null), 2000);
  }

  function onClear() {
    deleteNote(kind, targetId);
    setMethodCode("");
    setBody("");
    setSaved(null);
    setMsg("已清除");
    setTimeout(() => setMsg(null), 2000);
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">备注面板</h2>
        <span className="text-xs text-slate-400">仅本机 · {titleZh}</span>
      </div>
      <p className="text-xs text-slate-500">
        可记录内部方法编号、实验备注等。数据存浏览器 localStorage，不会上传。团队同步需后续账号体系（见 /notes）。
      </p>
      <label className="block text-sm">
        <span className="text-slate-600">内部方法编号</span>
        <input
          value={methodCode}
          onChange={(e) => setMethodCode(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-latin"
          placeholder="如 QC-HPLC-ASP-01"
        />
      </label>
      <label className="block text-sm">
        <span className="text-slate-600">备注</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="内部备注…"
        />
      </label>
      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          onClick={onSave}
          className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm text-white hover:bg-teal-800"
        >
          保存
        </button>
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          清除
        </button>
        {saved?.updatedAt && (
          <span className="text-xs text-slate-400 font-latin">
            更新于 {new Date(saved.updatedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })} UTC+8
          </span>
        )}
        {msg && <span className="text-xs text-teal-700">{msg}</span>}
      </div>
    </section>
  );
}
