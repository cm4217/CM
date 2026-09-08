/** Tiny client toast bus (no external dep). */

export type ToastPayload = {
  message: string;
  kind?: "ok" | "warn" | "err";
  ms?: number;
};

type Listener = (t: ToastPayload) => void;

const listeners = new Set<Listener>();

export function subscribeToast(fn: Listener) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function showToast(message: string, kind: ToastPayload["kind"] = "ok", ms = 2200) {
  const payload: ToastPayload = { message, kind, ms };
  listeners.forEach((fn) => fn(payload));
}
