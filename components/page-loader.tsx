"use client";

import { Loader2 } from "lucide-react";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const emptySubscribe = () => () => {};

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function PageLoader({ label = "Memuat halaman..." }: { label?: string }) {
  const mounted = useMounted();

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/75 px-4 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative flex size-16 items-center justify-center">
          <span
            aria-hidden
            className="absolute inset-0 animate-ping rounded-full bg-primary/20"
          />
          <Loader2
            className="relative size-9 animate-spin text-primary"
            aria-hidden="true"
          />
        </div>
        <p className="text-sm font-semibold text-foreground animate-pulse">
          {label}
        </p>
      </div>
    </div>,
    document.body,
  );
}