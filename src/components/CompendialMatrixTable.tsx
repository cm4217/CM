import type { MonographRef, PharmacopoeiaCode, Substance } from "@/lib/types";
import {
  COMPENDIAL_COLUMNS,
  accessLabel,
  defaultAccessForCode,
  type CompendialMatrix,
  type CompendialMatrixRow,
} from "@/data/compendialMatrices";
import { DemoBadge } from "./DemoBadge";

function refFor(
  refs: MonographRef[],
  code: PharmacopoeiaCode
): MonographRef | undefined {
  return refs.find((m) => m.pharmacopoeia === code);
}

function versionCell(s: Substance, code: PharmacopoeiaCode): string {
  const m = refFor(s.monographRefs, code);
  if (m?.version) return m.version;
  if (code === "Ph.Int." && s.phIntDocPath) return "Ph. Int. (demo)";
  return "—";
}

function titleCell(s: Substance, code: PharmacopoeiaCode): string {
  const m = refFor(s.monographRefs, code);
  if (m) return m.monographTitleZh || m.monographTitle;
  if (code === "Ph.Int." && s.phIntDocPath) return s.nameZh || s.nameEn;
  return "—";
}

function officialUrl(s: Substance, code: PharmacopoeiaCode): string | undefined {
  const m = refFor(s.monographRefs, code);
  if (m?.officialUrl) return m.officialUrl;
  if (code === "Ph.Int.") {
    if (s.phIntDocPath) {
      return `https://digicollections.net/phint/en/d/${encodeURIComponent(s.phIntDocPath)}/`;
    }
    return "https://digicollections.net/phint/";
  }
  return undefined;
}

function sectionTitle(section: CompendialMatrixRow["section"]): string | null {
  switch (section) {
    case "meta":
      return null;
    case "narrative":
      return "叙述项（示例）";
    case "counts":
      return "项目计数（示例）";
    case "checks":
      return "检查项（示例）";
    default:
      return null;
  }
}

export function CompendialMatrixTable({
  substance,
  matrix,
}: {
  substance: Substance;
  matrix: CompendialMatrix;
}) {
  const columns = COMPENDIAL_COLUMNS.filter((c) => {
    // Show column if substance has ref, phInt path, or any matrix value for it
    if (refFor(substance.monographRefs, c)) return true;
    if (c === "Ph.Int." && substance.phIntDocPath) return true;
    return matrix.rows.some((r) => r.values[c] != null && r.values[c] !== "");
  });
  // Always keep a stable set for rich matrices so UI matches screenshots
  const cols =
    matrix.rich || columns.length === 0 ? COMPENDIAL_COLUMNS : columns;

  let lastSection: CompendialMatrixRow["section"] | null = null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <DemoBadge />
        {matrix.rich ? (
          <span className="text-xs rounded-md bg-sky-50 text-sky-900 px-2 py-0.5 ring-1 ring-sky-200">
            精选 DEMO 矩阵
          </span>
        ) : (
          <span className="text-xs rounded-md bg-slate-100 text-slate-600 px-2 py-0.5">
            元数据对照 · 叙述见官方
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm print:shadow-none print:border-slate-400">
        <table className="compendial-matrix min-w-[860px] w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-sky-700 text-white text-left font-semibold px-3 py-2.5 border-b border-sky-800 min-w-[140px]">
                对照项
              </th>
              {cols.map((c) => (
                <th
                  key={c}
                  className="bg-sky-700 text-white text-left font-semibold px-3 py-2.5 border-b border-sky-800 font-latin min-w-[120px]"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Header block derived from monographRefs */}
            <tr className="compendial-row">
              <td className="sticky left-0 z-[1] bg-slate-50 font-medium text-slate-800 px-3 py-2 border-b border-slate-100">
                药典版本
              </td>
              {cols.map((c) => (
                <td
                  key={c}
                  className="px-3 py-2 border-b border-slate-100 font-latin text-xs text-slate-700"
                >
                  {versionCell(substance, c)}
                </td>
              ))}
            </tr>
            <tr className="compendial-row">
              <td className="sticky left-0 z-[1] bg-slate-50 font-medium text-slate-800 px-3 py-2 border-b border-slate-100">
                专论标题
              </td>
              {cols.map((c) => (
                <td
                  key={c}
                  className="px-3 py-2 border-b border-slate-100 text-slate-700"
                >
                  {titleCell(substance, c)}
                </td>
              ))}
            </tr>

            {matrix.rows.map((r) => {
              const showSection =
                r.section !== "meta" && r.section !== lastSection;
              lastSection = r.section;
              return (
                <MatrixBodyRows
                  key={r.key}
                  row={r}
                  cols={cols}
                  showSection={showSection}
                  sectionLabel={showSection ? sectionTitle(r.section) : null}
                />
              );
            })}

            {/* Footer: 查看原文 */}
            <tr className="compendial-row">
              <td className="sticky left-0 z-[1] bg-slate-50 font-medium text-slate-800 px-3 py-2.5 border-t border-slate-200">
                查看原文
              </td>
              {cols.map((c) => {
                const m = refFor(substance.monographRefs, c);
                const url = officialUrl(substance, c);
                const access = m
                  ? accessLabel(m.copyrightStatus)
                  : defaultAccessForCode(c);
                const hasEntry =
                  Boolean(m) || (c === "Ph.Int." && Boolean(substance.phIntDocPath));
                return (
                  <td
                    key={c}
                    className="px-3 py-2.5 border-t border-slate-200 align-top"
                  >
                    {url && (hasEntry || matrix.rich) ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-col gap-1 no-underline group"
                      >
                        <span className="text-teal-800 group-hover:underline text-xs font-medium">
                          查看原文 →
                        </span>
                        <span
                          className={
                            access.tone === "green"
                              ? "inline-flex items-center gap-1 text-[11px] text-emerald-800"
                              : "inline-flex items-center gap-1 text-[11px] text-amber-800"
                          }
                        >
                          <span
                            className={
                              access.tone === "green"
                                ? "h-1.5 w-1.5 rounded-full bg-emerald-500"
                                : "h-1.5 w-1.5 rounded-full bg-amber-500"
                            }
                            aria-hidden
                          />
                          {access.zh}
                        </span>
                      </a>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        单元格为示例或元数据标记（「有此项」/「—」），
        <strong className="font-medium">不含</strong>
        法定接受标准数值或药典原文。绿色「免费」表示常见公开入口；琥珀色「订阅」表示需授权平台。
      </p>
    </div>
  );
}

function MatrixBodyRows({
  row,
  cols,
  showSection,
  sectionLabel,
}: {
  row: CompendialMatrixRow;
  cols: PharmacopoeiaCode[];
  showSection: boolean;
  sectionLabel: string | null;
}) {
  return (
    <>
      {showSection && sectionLabel ? (
        <tr className="print:table-row">
          <td
            colSpan={cols.length + 1}
            className="bg-sky-50 text-sky-950 text-xs font-semibold tracking-wide px-3 py-1.5 border-y border-sky-100"
          >
            {sectionLabel}
            <span className="ml-2 font-normal text-sky-700/80">示例数据</span>
          </td>
        </tr>
      ) : null}
      <tr className="compendial-row">
        <td className="sticky left-0 z-[1] bg-white font-medium text-slate-800 px-3 py-2 border-b border-slate-100">
          <span>{row.labelZh}</span>
          {row.demo ? (
            <span className="ml-1.5 text-[10px] font-normal text-teal-700">
              DEMO
            </span>
          ) : null}
          {row.labelEn ? (
            <div className="text-[10px] font-normal text-slate-400 font-latin">
              {row.labelEn}
            </div>
          ) : null}
        </td>
        {cols.map((c) => {
          const v = row.values[c];
          const empty = v == null || v === "" || v === "—";
          return (
            <td
              key={c}
              className={
                empty
                  ? "px-3 py-2 border-b border-slate-100 text-slate-400"
                  : "px-3 py-2 border-b border-slate-100 text-slate-800"
              }
            >
              {v ?? "—"}
            </td>
          );
        })}
      </tr>
    </>
  );
}
