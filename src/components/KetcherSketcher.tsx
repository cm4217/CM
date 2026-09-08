"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentType,
} from "react";
import type { Ketcher } from "ketcher-core";

export type KetcherHandle = {
  getSmiles: () => Promise<string>;
  getMolfile: () => Promise<string>;
  clear: () => Promise<void>;
  ready: boolean;
};

type EditorComponentProps = {
  staticResourcesUrl: string;
  structServiceProvider: object;
  errorHandler: (message: string) => void;
  onInit?: (ketcher: Ketcher) => void;
  disableMacromoleculesEditor?: boolean;
};

/**
 * Client-only Ketcher embed. Packages are imported inside useEffect so
 * Next.js App Router / SSR never evaluates Worker / window code.
 */
export const KetcherSketcher = forwardRef<
  KetcherHandle,
  { className?: string }
>(function KetcherSketcher({ className }, ref) {
  const ketcherRef = useRef<Ketcher | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [Editor, setEditor] = useState<ComponentType<EditorComponentProps> | null>(
    null
  );
  const [provider, setProvider] = useState<object | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // CSS must load with the editor; dynamic import keeps it off the SSR path.
        await import("ketcher-react/dist/index.css");
        const [reactMod, standaloneMod] = await Promise.all([
          import("ketcher-react"),
          // binaryWasm avoids recursive StandaloneStructServiceProvider init
          // (see epam/ketcher#7387).
          import("ketcher-standalone/dist/binaryWasm"),
        ]);
        if (cancelled) return;

        const ProviderCtor = standaloneMod.StandaloneStructServiceProvider as new () => object;
        setProvider(new ProviderCtor());
        setEditor(() => reactMod.Editor as ComponentType<EditorComponentProps>);
      } catch (e) {
        if (!cancelled) {
          setLoadError(String((e as Error).message || e));
        }
      }
    })();

    return () => {
      cancelled = true;
      ketcherRef.current = null;
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      ready,
      getSmiles: async () => {
        if (!ketcherRef.current) throw new Error("画板未就绪");
        const smiles = await ketcherRef.current.getSmiles();
        return (smiles || "").trim();
      },
      getMolfile: async () => {
        if (!ketcherRef.current) throw new Error("画板未就绪");
        return ketcherRef.current.getMolfile();
      },
      clear: async () => {
        if (!ketcherRef.current) throw new Error("画板未就绪");
        await ketcherRef.current.setMolecule("");
      },
    }),
    [ready]
  );

  const onInit = useCallback((ketcher: Ketcher) => {
    ketcherRef.current = ketcher;
    setReady(true);
  }, []);

  if (loadError) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        Ketcher 加载失败：{loadError}。请刷新页面，或改用下方 SMILES
        文本输入。
      </div>
    );
  }

  if (!Editor || !provider) {
    return (
      <div className="flex h-[520px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
        正在加载结构画板（Ketcher，体积较大，首次可能较慢）…
      </div>
    );
  }

  return (
    <div
      className={`ketcher-host relative h-[520px] w-full overflow-hidden rounded-lg border border-slate-200 bg-white ${className || ""}`}
    >
      <Editor
        staticResourcesUrl=""
        structServiceProvider={provider}
        errorHandler={(msg) => {
          console.error("[Ketcher]", msg);
        }}
        onInit={onInit}
        disableMacromoleculesEditor
      />
      {!ready && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-slate-500">
          画板初始化中…
        </div>
      )}
    </div>
  );
});
