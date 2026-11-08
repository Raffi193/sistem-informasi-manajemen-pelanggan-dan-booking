"use client";

import { useRef, useState } from "react";
import {
  FOTO_TYPES,
  MAX_INSTRUKTUR_MEDIA_BYTES,
  SERTIFIKAT_TYPES,
  type InstructorMediaKind,
} from "@/lib/instructor-media";
import { isImageUrl } from "@/lib/media";

type UploadedMedia = {
  path: string;
  url: string;
};

const fileInputClass =
  "mt-2 block w-full cursor-pointer rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary hover:file:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60";

async function deleteUploadedMedia(path: string) {
  try {
    await fetch(
      `/api/admin/instruktur/upload?path=${encodeURIComponent(path)}`,
      { method: "DELETE" },
    );
  } catch {
    // File yatim tidak boleh menghalangi proses utama.
  }
}

export function InstructorMediaInput({
  id,
  kind,
  accept,
  error,
  onUploadingChange,
}: {
  id: string;
  kind: InstructorMediaKind;
  accept: string;
  error?: string;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploaded, setUploaded] = useState<UploadedMedia | null>(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function setUploadingState(value: boolean) {
    setUploading(value);
    onUploadingChange?.(value);
  }

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    setLocalError(null);

    if (!file) {
      if (uploaded) await deleteUploadedMedia(uploaded.path);
      setUploaded(null);
      setFileName(null);
      return;
    }

    if (file.size > MAX_INSTRUKTUR_MEDIA_BYTES) {
      setLocalError("Ukuran file maksimal 4 MB.");
      input.value = "";
      return;
    }

    const allowedTypes = kind === "foto" ? FOTO_TYPES : SERTIFIKAT_TYPES;
    if (!allowedTypes.has(file.type)) {
      setLocalError(
        kind === "foto"
          ? "Format foto harus JPG, PNG, atau WEBP."
          : "Format sertifikat harus JPG, PNG, WEBP, atau PDF.",
      );
      input.value = "";
      return;
    }

    if (uploaded) {
      await deleteUploadedMedia(uploaded.path);
      setUploaded(null);
    }

    setFileName(file.name);
    setUploadingState(true);

    try {
      const body = new FormData();
      body.append("kind", kind);
      body.append("file", file);

      const response = await fetch("/api/admin/instruktur/upload", {
        method: "POST",
        body,
      });
      const result = (await response.json().catch(() => ({}))) as {
        path?: string;
        url?: string;
        error?: string;
      };

      if (!response.ok || !result.path || !result.url) {
        throw new Error(result.error || "Gagal mengunggah media. Coba lagi.");
      }

      setUploaded({ path: result.path, url: result.url });
    } catch (uploadError) {
      setUploaded(null);
      setFileName(null);
      input.value = "";
      setLocalError(
        uploadError instanceof Error
          ? uploadError.message
          : "Gagal mengunggah media. Coba lagi.",
      );
    } finally {
      setUploadingState(false);
    }
  }

  async function cancelUpload() {
    if (uploaded) await deleteUploadedMedia(uploaded.path);
    setUploaded(null);
    setFileName(null);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const hasError = Boolean(localError || error);
  const describedBy = localError
    ? `${id}-local-error`
    : error
      ? `${id}-error`
      : undefined;
  const imagePreview = uploaded && isImageUrl(uploaded.url);

  return (
    <div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={handleChange}
        disabled={uploading}
        aria-invalid={hasError ? true : undefined}
        aria-describedby={describedBy}
        className={fileInputClass}
      />
      <input type="hidden" name={`${kind}_url`} value={uploaded?.url ?? ""} />
      <input type="hidden" name={`${kind}_path`} value={uploaded?.path ?? ""} />

      {uploading && (
        <p className="mt-2 text-xs text-muted-foreground">
          Mengunggah {fileName ?? "file"}…
        </p>
      )}

      {uploaded && !uploading && (
        <div className="mt-2 rounded-xl border border-border bg-secondary/30 p-2.5">
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={uploaded.url}
              alt="Pratinjau media baru"
              className="h-24 w-full rounded-lg border border-border bg-white object-contain"
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              File siap disimpan.
            </p>
          )}
          <div className="mt-2 flex items-center justify-between gap-3">
            <a
              href={uploaded.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-primary hover:underline"
            >
              Lihat file baru
            </a>
            <button
              type="button"
              onClick={cancelUpload}
              className="text-xs font-medium text-destructive hover:underline"
            >
              Batalkan upload
            </button>
          </div>
        </div>
      )}

      {localError && (
        <p id={`${id}-local-error`} className="mt-1.5 text-sm text-destructive">
          {localError}
        </p>
      )}
    </div>
  );
}
