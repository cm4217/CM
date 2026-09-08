"use client";

export function RsImportNote({ syncedLocal }: { syncedLocal: string }) {
  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm text-slate-700 space-y-2">
      <h2 className="font-semibold text-amber-950">导入对照品文件</h2>
      <ol className="list-decimal pl-5 space-y-1 text-xs">
        <li>将 CSV/TSV/XML 放到 data/incoming/（示例 example-rs.csv）。</li>
        <li>本地运行 package.json 中的 sync:rs 脚本以合并生成数据。</li>
        <li>表头可映射 issuer、catalogNo、nameEn、nameZh、cas、relatedSubstanceId；XML 尽力解析，复杂请用 CSV。</li>
      </ol>
      <p className="text-xs text-slate-500">上次同步：{syncedLocal} · 仅元数据，无专论全文</p>
    </section>
  );
}
