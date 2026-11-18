import { Loader2 } from "lucide-react";

export function PageLoader({ label = "Memuat halaman..." }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative flex size-14 items-center justify-center">
          <span
            aria-hidden
            className="absolute inset-0 animate-ping rounded-full bg-primary/15"
          />
          <Loader2
            className="relative size-8 animate-spin text-primary"
            aria-hidden="true"
          />
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {label}
        </p>
      </div>
    </div>
  );
}