import { Loader2 } from "lucide-react";

export function PageLoader({ label = "Memuat halaman..." }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/75 px-4 backdrop-blur-sm">
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
    </div>
  );
}