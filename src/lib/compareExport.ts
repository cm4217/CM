import type { PharmacopoeiaCode, Substance } from "./types";

const ALL_CODES: PharmacopoeiaCode[] = [
  "ChP",
  "USP",
  "EP",
  "JP",
  "BP",
  "IP",
  "Ph.Int.",
];

export function pharmacopoeiaSet(s: Substance): Set<PharmacopoeiaCode> {
  return new Set(s.monographRefs.map((m) => m.pharmacopoeia));
}

/** Codes present in at least one but not all selected substances (差集高亮候选). */
export function diffPharmacopoeias(selected: Substance[]): {
  code: PharmacopoeiaCode;
  present: string[];
  absent: string[];
}[] {
  if (selected.length < 2) return [];
  const rows: {
    code: PharmacopoeiaCode;
    present: string[];
    absent: string[];
  }[] = [];
  for (const code of ALL_CODES) {
    const present: string[] = [];
    const absent: string[] = [];
    for (const s of selected) {
      const has = s.monographRefs.some((m) => m.pharmacopoeia === code);
      if (has) present.push(s.nameZh);
      else absent.push(s.nameZh);
    }
    if (present.length > 0 && absent.length > 0) {
      rows.push({ code, present, absent });
    }
  }
  return rows;
}

export function exportCompareCsv(selected: Substance[]): string {
  const header = [
    "substance_id",
    "nameZh",
    "nameEn",
    "cas",
    "unii",
    "pharmacopoeias",
    "impurity_count",
    "rs_count",
    "epTextNumber",
    "uspDoi",
  ];
  const rows = selected.map((s) => {
    const ph = Array.from(pharmacopoeiaSet(s)).join("|");
    return [
      s.id,
      s.nameZh,
      s.nameEn,
      s.cas || "",
      s.unii || "",
      ph,
      String(s.relatedImpurityIds.length),
      String(s.relatedRSIds.length),
      s.epTextNumber || "",
      s.uspDoi || "",
    ];
  });

  // coverage matrix
  const matrixHeader = ["pharmacopoeia", ...selected.map((s) => s.nameZh)];
  const matrixRows = ALL_CODES.map((code) => [
    code,
    ...selected.map((s) =>
      s.monographRefs.some((m) => m.pharmacopoeia === code) ? "Y" : "N"
    ),
  ]);

  const block1 = [header, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const block2 = [matrixHeader, ...matrixRows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return "\ufeff" + block1 + "\n\n" + block2 + "\n";
}

export function exportCompareMarkdown(selected: Substance[]): string {
  const lines: string[] = [
    "# 跨药典对比导出",
    "",
    `生成时间：${new Date().toISOString()}`,
    "",
    "> 仅公开元数据索引，不含接受标准数值或专论全文。",
    "",
    "## 物质摘要",
    "",
  ];
  for (const s of selected) {
    const ph = Array.from(pharmacopoeiaSet(s)).join(" / ");
    lines.push(
      `### ${s.nameZh} (${s.nameEn})`,
      "",
      `- ID: \`${s.id}\``,
      `- CAS: ${s.cas || "—"} · UNII: ${s.unii || "—"}`,
      `- 药典覆盖: ${ph || "—"}`,
      `- 杂质数: ${s.relatedImpurityIds.length} · 对照品: ${s.relatedRSIds.length}`,
      s.epTextNumber ? `- Ph. Eur. text: ${s.epTextNumber}` : "",
      s.uspDoi ? `- USP DOI: ${s.uspDoi}` : "",
      ""
    );
  }

  lines.push("## 药典覆盖矩阵", "", `| 药典 | ${selected.map((s) => s.nameZh).join(" | ")} |`, `| --- | ${selected.map(() => "---").join(" | ")} |`);
  for (const code of ALL_CODES) {
    const cells = selected.map((s) =>
      s.monographRefs.some((m) => m.pharmacopoeia === code) ? "✓" : "—"
    );
    lines.push(`| ${code} | ${cells.join(" | ")} |`);
  }

  const diffs = diffPharmacopoeias(selected);
  if (diffs.length) {
    lines.push("", "## 差集（部分有 / 部分无）", "");
    for (const d of diffs) {
      lines.push(
        `- **${d.code}**：有 ${d.present.join("、")}；无 ${d.absent.join("、")}`
      );
    }
  }

  lines.push("");
  return lines.filter((l) => l !== undefined).join("\n");
}

export function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
