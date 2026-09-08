import { DEMO_BADGE } from "@/lib/constants";

export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md bg-teal-100 text-teal-900 px-2 py-0.5 text-xs font-semibold tracking-wide ${className}`}
    >
      {DEMO_BADGE}
    </span>
  );
}
