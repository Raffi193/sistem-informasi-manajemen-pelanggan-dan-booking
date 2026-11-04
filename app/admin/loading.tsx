import { Spinner } from "@/components/spinner";

export default function AdminLoading() {
  return (
    <div className="animate-fade-in space-y-6" aria-busy="true">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <div className="h-8 w-44 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
          <div className="h-4 w-64 max-w-full animate-pulse rounded bg-muted motion-reduce:animate-none" />
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm text-muted-foreground">
          <Spinner className="size-4 text-primary" label="Memuat halaman admin" />
          <span>Memuat…</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-border bg-white p-4 sm:p-5"
          >
            <div className="h-4 w-24 animate-pulse rounded bg-muted motion-reduce:animate-none" />
            <div className="mt-3 h-8 w-14 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="border-b border-border px-5 py-4">
          <div className="h-5 w-36 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex items-center gap-4 px-5 py-4">
              <div className="h-4 w-24 animate-pulse rounded bg-muted motion-reduce:animate-none" />
              <div className="h-4 flex-1 animate-pulse rounded bg-muted motion-reduce:animate-none" />
              <div className="h-5 w-24 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
