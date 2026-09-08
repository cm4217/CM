"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { RelaxationChip } from "@/lib/search";

/**
 * 零/少结果放宽芯片：可移除（从 URL relax= 中去掉对应步骤）。
 */
export function SearchRelaxChips({
  applied,
}: {
  applied: RelaxationChip[];
}) {
  const router = useRouter();
  const sp = useSearchParams();

  if (!applied.length) return null;

  function removeChip(id: string) {
    const params = new URLSearchParams(sp.toString());
    const current = (params.get("relax") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    // 若当前无 relax（自动放宽），则把「其余仍应用的」写入，并排除本芯片
    const base =
      current.length > 0
        ? current
        : applied.map((c) => c.id);
    const next = base.filter((x) => x !== id);
    if (next.length) params.set("relax", next.join(","));
    else {
      params.delete("relax");
      params.set("strict", "1");
    }
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2.5 text-sm">
      <span className="text-amber-950 font-medium">已放宽检索</span>
      {applied.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => removeChip(chip.id)}
          className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-white px-2.5 py-0.5 text-xs text-amber-950 hover:bg-amber-100"
          title="点击移除此放宽条件"
        >
          {chip.label}
          {chip.detail ? (
            <span className="text-amber-700/80">「{chip.detail}」</span>
          ) : null}
          <span aria-hidden className="ml-0.5 text-amber-600">
            ×
          </span>
        </button>
      ))}
      <span className="text-[11px] text-amber-800/80">点击芯片可撤销</span>
    </div>
  );
}
