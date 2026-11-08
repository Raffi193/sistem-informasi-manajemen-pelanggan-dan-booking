import { FileBadge, FileText } from "lucide-react";
import type { InstrukturPublik } from "@/lib/data/instruktur";
import { isImageUrl } from "@/lib/media";

function initials(nama: string) {
  return nama
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function InstructorCard({
  instruktur,
}: {
  instruktur: InstrukturPublik;
}) {
  const certificateIsImage = isImageUrl(instruktur.sertifikat_url);

  return (
    <article className="card-lift flex h-full flex-col overflow-hidden rounded-xl border border-border bg-white">
      <div className="relative h-[270px] shrink-0 bg-gradient-to-br from-primary/15 to-primary/5">
        {instruktur.foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={instruktur.foto_url}
            alt={`Foto ${instruktur.nama}`}
            loading="lazy"
            decoding="async"
            className="block h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-display text-4xl font-bold text-primary/50">
              {initials(instruktur.nama)}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
          Instruktur
        </p>
        <h3 className="mt-1 font-display text-base font-bold text-foreground">
          {instruktur.nama}
        </h3>

        {instruktur.sertifikat_url && (
          <div className="mt-3 rounded-xl border border-border bg-secondary/40 p-2">
            {certificateIsImage && (
              <a
                href={instruktur.sertifikat_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-lg border border-border bg-white"
                aria-label={`Lihat sertifikat ${instruktur.nama}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={instruktur.sertifikat_url}
                  alt={`Sertifikat ${instruktur.nama}`}
                  loading="lazy"
                  decoding="async"
                  className="h-20 w-full object-contain"
                />
              </a>
            )}
            <a
              href={instruktur.sertifikat_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              {certificateIsImage ? (
                <FileBadge className="size-3.5" aria-hidden="true" />
              ) : (
                <FileText className="size-3.5" aria-hidden="true" />
              )}
              Lihat sertifikat
            </a>
          </div>
        )}
      </div>
    </article>
  );
}
