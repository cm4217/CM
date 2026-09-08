"use client";

import { useEffect, useState } from "react";
import { LS_SEARCH_DENSITY } from "@/lib/storageKeys";

export type Density = "compact" | "default" | "comfortable";

const OPTIONS: { id: Density; label: string }[] = [
  { id: "compact", label: "紧凑" },
  { id: "default", label: "默认" },
  { id: "comfortable", label: "宽松" },
];

export function SearchDensityControl() {
  const [density, setDensity] = useState<Density>("default");

  useEffect(() => {
    try {
      const v = localStorage.getItem(LS_SEARCH_DENSITY) as Density | null;
      if (v === "compact" || v === "default" || v === "comfortable") {
        setDensity(v);
        document.documentElement.setAttribute("data-density", v);
      } else {
        document.documentElement.setAttribute("data-density", "default");
      }
    } catch {
      document.documentElement.setAttribute("data-density", "default");
    }
  }, []);

  const apply = (d: Density) => {
    setDensity(d);
    document.documentElement.setAttribute("data-density", d);
    try {
      localStorage.setItem(LS_SEARCH_DENSITY, d);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5 text-xs print:hidden"
      role="group"
      aria-label="结果密度"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          className={
            density === o.id
              ? "rounded-md bg-teal-600 px-2 py-1 font-medium text-white"
              : "rounded-md px-2 py-1 text-slate-600 hover:bg-slate-50"
          }
          aria-pressed={density === o.id}
          onClick={() => apply(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
