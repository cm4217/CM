import type { ReactNode } from "react";

/** Collect unique highlight needles from query / core / tokens (longest first). */
export function buildHighlightTerms(opts: {
  q?: string;
  core?: string;
  tokens?: string[];
  cas?: string;
}): string[] {
  const raw: string[] = [];
  const push = (s?: string) => {
    const t = (s || "").trim();
    if (t && t.length >= 1) raw.push(t);
  };
  push(opts.q);
  push(opts.core);
  push(opts.cas);
  for (const t of opts.tokens || []) push(t);
  // Also split q on whitespace / punctuation for multi-token queries
  const q = (opts.q || "").trim();
  if (q) {
    for (const part of q.split(/[\s,，;；|/·.]+/)) {
      if (part.length >= 2) push(part);
    }
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of raw.sort((a, b) => b.length - a.length)) {
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Highlight query terms in plain text as safe React nodes (no HTML injection).
 * Matched spans use <mark>; unmatched text is plain string children.
 */
export function highlightText(
  text: string | undefined | null,
  terms: string[],
  markClassName = "rounded bg-amber-100 px-0.5 text-amber-950"
): ReactNode {
  if (!text) return null;
  if (!terms.length) return text;

  const usable = terms.filter((t) => t.length > 0);
  if (!usable.length) return text;

  const re = new RegExp(`(${usable.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(re);
  if (parts.length === 1) return text;

  const lowerTerms = usable.map((t) => t.toLowerCase());
  return parts.map((part, i) => {
    if (!part) return null;
    const isMatch = lowerTerms.some((t) => part.toLowerCase() === t);
    if (isMatch) {
      return (
        <mark key={i} className={markClassName}>
          {part}
        </mark>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
