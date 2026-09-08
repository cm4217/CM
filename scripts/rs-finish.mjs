import { esc } from "./rs-import-lib.mjs";

function alreadyHas(text, catalogCode) {
  const needle = String(catalogCode).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("catalogCode:\\s*\"" + needle).test(text);
}

function formatOne(r) {
  const q = (s) => "\"" + esc(s) + "\"";
  const lines = ["  {"];
  lines.push("    id: " + q(r.id) + ",");
  lines.push("    catalogCode: " + q(r.catalogCode) + ",");
  lines.push("    nameZh: " + q(r.nameZh) + ",");
  lines.push("    nameEn: " + q(r.nameEn) + ",");
  lines.push("    issuer: " + q(r.issuer) + ",");
  if (r.linkedSubstanceId) lines.push("    linkedSubstanceId: " + q(r.linkedSubstanceId) + ",");
  if (r.linkedImpurityId) lines.push("    linkedImpurityId: " + q(r.linkedImpurityId) + ",");
  if (r.cas) lines.push("    cas: " + q(r.cas) + ",");
  lines.push("    status: " + q(r.status || "current") + ",");
  lines.push("    copyrightStatus: \"link_only\",");
  if (r.officialUrl) lines.push("    officialUrl: " + q(r.officialUrl) + ",");
  if (r.notes) lines.push("    notes: " + q(r.notes) + ",");
  lines.push("    demoLabel: true,");
  lines.push("  },");
  return lines.join("\n");
}

export function finishSync(ctx) {
  let text = ctx.existingText || "";
  const now = ctx.now;
  text = text.replace(/REFERENCE_MATERIALS_LAST_SYNCED = "[^"]*"/, "REFERENCE_MATERIALS_LAST_SYNCED = \"" + now + "\"");
  // only touch the comment lastSynced line inside block comment
  text = text.replace(/(\* lastSynced: ).*/, "$1" + now + " (merged data/incoming)");
  let added = 0;
  const blocks = [];
  for (const r of ctx.imported) {
    if (alreadyHas(text, r.catalogCode)) continue;
    blocks.push(formatOne(r));
    added++;
  }
  if (blocks.length) {
    const idx = text.lastIndexOf("];");
    if (idx >= 0) text = text.slice(0, idx) + blocks.join("\n") + "\n" + text.slice(idx);
  }
  ctx.wf(ctx.srcPath, text);
  console.log("imported", ctx.importLog);
  console.log("appended", added, "synced", now);
}
