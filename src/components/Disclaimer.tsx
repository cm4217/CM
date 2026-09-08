import { DISCLAIMER, DISCLAIMER_EN } from "@/lib/constants";

export function DisclaimerBanner({ compact = false }: { compact?: boolean }) {
  return (
    <aside
      className={`border-l-4 border-amber-500 bg-amber-50 text-amber-950 ${
        compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"
      }`}
      role="note"
    >
      <p className="font-medium leading-relaxed">{DISCLAIMER}</p>
      {!compact && (
        <p className="mt-1 text-xs text-amber-800/90 font-latin leading-relaxed">
          {DISCLAIMER_EN}
        </p>
      )}
    </aside>
  );
}

export function DisclaimerStrip() {
  return (
    <div className="bg-teal-950 text-teal-50 text-xs sm:text-sm px-4 py-2 text-center">
      <span className="opacity-95">{DISCLAIMER}</span>
    </div>
  );
}
