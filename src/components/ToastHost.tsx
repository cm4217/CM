"use client";

import { useEffect, useState } from "react";
import { subscribeToast, type ToastPayload } from "@/lib/toastBus";

export function ToastHost() {
  const [toast, setToast] = useState<ToastPayload | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    const unsub = subscribeToast((t) => {
      setToast(t);
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => setToast(null), t.ms ?? 2200);
    });
    return () => {
      unsub();
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  if (!toast) return null;

  const tone =
    toast.kind === "err"
      ? "bg-rose-800 text-white"
      : toast.kind === "warn"
        ? "bg-amber-800 text-white"
        : "bg-teal-800 text-white";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm shadow-lg ${tone}`}
    >
      {toast.message}
    </div>
  );
}
