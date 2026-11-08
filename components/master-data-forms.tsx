"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import {
  saveInstrukturAction,
  saveKendaraanAction,
  savePaketAction,
  saveSlotTemplateAction,
} from "@/app/admin/master/actions";
import { Spinner } from "@/components/spinner";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { initialActionState, type ActionState } from "@/lib/action-state";
import { isImageUrl } from "@/lib/media";
import {
  SLOT_CAPACITY_MAX,
  TRANSMISI_OPTIONS,
  type InstrukturRow,
  type KendaraanRow,
  type PaketRow,
  type SlotTemplateRow,
} from "@/lib/master-data";

type MasterAction = (
  state: ActionState,
  formData: FormData,
) => Promise<ActionState>;

const inputClass =
  "w-full rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30 aria-[invalid=true]:border-destructive";

const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60";

function useMasterForm(action: MasterAction, onSuccess: () => void) {
  const [state, formAction, pending] = useActionState(
    action,
    initialActionState,
  );

  useEffect(() => {
    if (state.status === "success") onSuccess();
  }, [onSuccess, state.status]);

  return { state, formAction, pending };
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function FormError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      {message}
    </p>
  );
}

function ActiveCheckbox({
  defaultChecked,
  description,
}: {
  defaultChecked: boolean;
  description: string;
}) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-border bg-secondary/30 px-3.5 py-3">
      <input
        type="checkbox"
        name="status_aktif"
        value="on"
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 accent-primary"
      />
      <span>
        <span className="block text-sm font-medium text-foreground">Aktif</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}

function FormActions({
  pending,
  submitLabel,
}: {
  pending: boolean;
  submitLabel: string;
}) {
  return (
    <DialogFooter className="mx-0 mb-0 mt-4 rounded-none border-t bg-transparent p-0 pt-4">
      <DialogClose
        type="button"
        disabled={pending}
        className={secondaryButtonClass}
      >
        Batal
      </DialogClose>
      <button
        type="submit"
        disabled={pending}
        className={primaryButtonClass}
        aria-busy={pending}
      >
        {pending && <Spinner className="size-4" />}
        {pending ? "Menyimpan…" : submitLabel}
      </button>
    </DialogFooter>
  );
}

export function PaketForm({
  paket,
  onSuccess,
}: {
  paket: PaketRow | null;
  onSuccess: () => void;
}) {
  const { state, formAction, pending } = useMasterForm(
    savePaketAction,
    onSuccess,
  );
  const errors = state.fieldErrors ?? {};
  const isEdit = Boolean(paket);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit paket" : "Tambah paket"}</DialogTitle>
        <DialogDescription>
          Paket aktif akan muncul di landing page dan pilihan booking.
        </DialogDescription>
      </DialogHeader>

      {state.status === "error" && state.message && (
        <FormError message={state.message} />
      )}

      {paket && <input type="hidden" name="id" value={paket.id} />}

      <Field label="Nama paket" htmlFor="paket-nama" error={errors.nama}>
        <input
          id="paket-nama"
          name="nama"
          type="text"
          required
          defaultValue={paket?.nama ?? ""}
          aria-invalid={errors.nama ? true : undefined}
          aria-describedby={errors.nama ? "paket-nama-error" : undefined}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Transmisi"
          htmlFor="paket-transmisi"
          error={errors.transmisi}
        >
          <select
            id="paket-transmisi"
            name="transmisi"
            required
            defaultValue={paket?.transmisi ?? "manual"}
            aria-invalid={errors.transmisi ? true : undefined}
            className={inputClass}
          >
            {TRANSMISI_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Jumlah pertemuan"
          htmlFor="paket-jumlah"
          error={errors.jumlah_pertemuan}
        >
          <input
            id="paket-jumlah"
            name="jumlah_pertemuan"
            type="number"
            min={1}
            max={100}
            required
            defaultValue={paket?.jumlah_pertemuan ?? 4}
            aria-invalid={errors.jumlah_pertemuan ? true : undefined}
            className={inputClass}
          />
        </Field>
      </div>

      <Field
        label="Harga paket"
        htmlFor="paket-harga"
        error={errors.harga}
        hint="Masukkan nominal dalam rupiah, tanpa titik atau koma."
      >
        <input
          id="paket-harga"
          name="harga"
          type="number"
          min={10000}
          max={100000000}
          step={1000}
          required
          defaultValue={paket?.harga ?? 500000}
          aria-invalid={errors.harga ? true : undefined}
          aria-describedby={errors.harga ? "paket-harga-error" : undefined}
          className={inputClass}
        />
      </Field>

      <Field
        label="Keterangan (opsional)"
        htmlFor="paket-keterangan"
        error={errors.keterangan}
      >
        <textarea
          id="paket-keterangan"
          name="keterangan"
          rows={3}
          defaultValue={paket?.keterangan ?? ""}
          aria-invalid={errors.keterangan ? true : undefined}
          className={inputClass}
        />
      </Field>

      <ActiveCheckbox
        defaultChecked={paket?.status_aktif ?? true}
        description="Paket nonaktif tetap tersimpan, tetapi tidak bisa dipilih customer."
      />

      <FormActions
        pending={pending}
        submitLabel={isEdit ? "Simpan perubahan" : "Tambah paket"}
      />
    </form>
  );
}

export function KendaraanForm({
  kendaraan,
  onSuccess,
}: {
  kendaraan: KendaraanRow | null;
  onSuccess: () => void;
}) {
  const { state, formAction, pending } = useMasterForm(
    saveKendaraanAction,
    onSuccess,
  );
  const errors = state.fieldErrors ?? {};
  const isEdit = Boolean(kendaraan);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <DialogHeader>
        <DialogTitle>
          {isEdit ? "Edit kendaraan" : "Tambah kendaraan"}
        </DialogTitle>
        <DialogDescription>
          Data kendaraan operasional LPK CV. Fathan.
        </DialogDescription>
      </DialogHeader>

      {state.status === "error" && state.message && (
        <FormError message={state.message} />
      )}

      {kendaraan && <input type="hidden" name="id" value={kendaraan.id} />}

      <Field label="Nama kendaraan" htmlFor="kendaraan-nama" error={errors.nama}>
        <input
          id="kendaraan-nama"
          name="nama"
          type="text"
          required
          defaultValue={kendaraan?.nama ?? ""}
          aria-invalid={errors.nama ? true : undefined}
          aria-describedby={errors.nama ? "kendaraan-nama-error" : undefined}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nomor plat (opsional)"
          htmlFor="kendaraan-plat"
          error={errors.plat}
        >
          <input
            id="kendaraan-plat"
            name="plat"
            type="text"
            defaultValue={kendaraan?.plat ?? ""}
            aria-invalid={errors.plat ? true : undefined}
            className={`${inputClass} uppercase`}
          />
        </Field>

        <Field
          label="Transmisi"
          htmlFor="kendaraan-transmisi"
          error={errors.transmisi}
        >
          <select
            id="kendaraan-transmisi"
            name="transmisi"
            required
            defaultValue={kendaraan?.transmisi ?? "manual"}
            aria-invalid={errors.transmisi ? true : undefined}
            className={inputClass}
          >
            {TRANSMISI_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <ActiveCheckbox
        defaultChecked={kendaraan?.status_aktif ?? true}
        description="Kendaraan nonaktif tidak ditampilkan sebagai pilihan operasional."
      />

      <FormActions
        pending={pending}
        submitLabel={isEdit ? "Simpan perubahan" : "Tambah kendaraan"}
      />
    </form>
  );
}

function CurrentMedia({
  url,
  label,
  removeName,
}: {
  url: string;
  label: string;
  removeName: "hapus_foto" | "hapus_sertifikat";
}) {
  const image = isImageUrl(url);

  return (
    <div className="mt-2 rounded-xl border border-border bg-secondary/30 p-2.5">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={label}
          className="h-24 w-full rounded-lg border border-border bg-white object-contain"
        />
      ) : (
        <p className="text-xs text-muted-foreground">
          File saat ini tersimpan.
        </p>
      )}
      <div className="mt-2 flex items-center justify-between gap-3">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-primary hover:underline"
        >
          Lihat {label.toLowerCase()}
        </a>
        <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            name={removeName}
            className="size-3.5 accent-primary"
          />
          Hapus
        </label>
      </div>
    </div>
  );
}

export function InstrukturForm({
  instruktur,
  onSuccess,
}: {
  instruktur: InstrukturRow | null;
  onSuccess: () => void;
}) {
  const { state, formAction, pending } = useMasterForm(
    saveInstrukturAction,
    onSuccess,
  );
  const errors = state.fieldErrors ?? {};
  const isEdit = Boolean(instruktur);
  const [fileError, setFileError] = useState<string | null>(null);

  function validateTotalFileSize(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const fotoInput = form.elements.namedItem("foto") as HTMLInputElement | null;
    const sertifikatInput = form.elements.namedItem(
      "sertifikat",
    ) as HTMLInputElement | null;
    const total =
      (fotoInput?.files?.[0]?.size ?? 0) +
      (sertifikatInput?.files?.[0]?.size ?? 0);

    if (total > 4 * 1024 * 1024) {
      event.preventDefault();
      setFileError(
        "Total ukuran foto dan sertifikat maksimal 4 MB. Unggah satu file terlebih dahulu, lalu edit lagi untuk file kedua.",
      );
      return;
    }

    setFileError(null);
  }

  return (
    <form
      action={formAction}
      onSubmit={validateTotalFileSize}
      className="space-y-4"
      noValidate
    >
      <DialogHeader>
        <DialogTitle>
          {isEdit ? "Edit instruktur" : "Tambah instruktur"}
        </DialogTitle>
        <DialogDescription>
          Data instruktur yang mengajar di LPK CV. Fathan.
        </DialogDescription>
      </DialogHeader>

      {state.status === "error" && state.message && (
        <FormError message={state.message} />
      )}
      {fileError && <FormError message={fileError} />}

      {instruktur && <input type="hidden" name="id" value={instruktur.id} />}

      <Field label="Nama instruktur" htmlFor="instruktur-nama" error={errors.nama}>
        <input
          id="instruktur-nama"
          name="nama"
          type="text"
          required
          defaultValue={instruktur?.nama ?? ""}
          aria-invalid={errors.nama ? true : undefined}
          aria-describedby={errors.nama ? "instruktur-nama-error" : undefined}
          className={inputClass}
        />
      </Field>

      <Field
        label="Nomor WhatsApp (opsional)"
        htmlFor="instruktur-no-wa"
        error={errors.no_wa}
        hint="Format 08… atau +62… diterima."
      >
        <input
          id="instruktur-no-wa"
          name="no_wa"
          type="tel"
          inputMode="tel"
          defaultValue={instruktur?.no_wa ?? ""}
          aria-invalid={errors.no_wa ? true : undefined}
          aria-describedby={
            errors.no_wa ? "instruktur-no-wa-error" : undefined
          }
          className={inputClass}
        />
      </Field>

      <Field
        label="Foto instruktur (opsional)"
        htmlFor="instruktur-foto"
        error={errors.foto}
        hint="JPG, PNG, atau WEBP. Total foto + sertifikat maksimal 4 MB. Kosongkan jika tidak mengganti."
      >
        {instruktur?.foto_url && (
          <CurrentMedia
            url={instruktur.foto_url}
            label="Foto"
            removeName="hapus_foto"
          />
        )}
        <input
          id="instruktur-foto"
          name="foto"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-invalid={errors.foto ? true : undefined}
          aria-describedby={
            errors.foto ? "instruktur-foto-error" : undefined
          }
          className="mt-2 block w-full cursor-pointer rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary hover:file:bg-primary/15"
        />
      </Field>

      <Field
        label="Sertifikat (opsional)"
        htmlFor="instruktur-sertifikat"
        error={errors.sertifikat}
        hint="JPG, PNG, WEBP, atau PDF. Total foto + sertifikat maksimal 4 MB. Kosongkan jika tidak mengganti."
      >
        {instruktur?.sertifikat_url && (
          <CurrentMedia
            url={instruktur.sertifikat_url}
            label="Sertifikat"
            removeName="hapus_sertifikat"
          />
        )}
        <input
          id="instruktur-sertifikat"
          name="sertifikat"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          aria-invalid={errors.sertifikat ? true : undefined}
          aria-describedby={
            errors.sertifikat ? "instruktur-sertifikat-error" : undefined
          }
          className="mt-2 block w-full cursor-pointer rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary hover:file:bg-primary/15"
        />
      </Field>

      <ActiveCheckbox
        defaultChecked={instruktur?.status_aktif ?? true}
        description="Instruktur nonaktif tidak ditampilkan sebagai pilihan operasional."
      />

      <FormActions
        pending={pending}
        submitLabel={isEdit ? "Simpan perubahan" : "Tambah instruktur"}
      />
    </form>
  );
}

export function SlotTemplateForm({
  template,
  onSuccess,
}: {
  template: SlotTemplateRow | null;
  onSuccess: () => void;
}) {
  const { state, formAction, pending } = useMasterForm(
    saveSlotTemplateAction,
    onSuccess,
  );
  const errors = state.fieldErrors ?? {};
  const isEdit = Boolean(template);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <DialogHeader>
        <DialogTitle>
          {isEdit ? "Edit jadwal latihan" : "Tambah jadwal latihan"}
        </DialogTitle>
        <DialogDescription>
          Jam ini berlaku otomatis untuk semua tanggal. Kapasitas dihitung per
          tanggal dan jam. Perubahan jam juga mengikuti booking yang memakai
          jadwal ini.
        </DialogDescription>
      </DialogHeader>

      {state.status === "error" && state.message && (
        <FormError message={state.message} />
      )}

      {template && <input type="hidden" name="id" value={template.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Jam mulai"
          htmlFor="slot-template-mulai"
          error={errors.jam_mulai}
        >
          <input
            id="slot-template-mulai"
            name="jam_mulai"
            type="time"
            required
            step={60}
            defaultValue={template ? template.jam_mulai.slice(0, 5) : "08:00"}
            aria-invalid={errors.jam_mulai ? true : undefined}
            className={inputClass}
          />
        </Field>

        <Field
          label="Jam selesai"
          htmlFor="slot-template-selesai"
          error={errors.jam_selesai}
        >
          <input
            id="slot-template-selesai"
            name="jam_selesai"
            type="time"
            required
            step={60}
            defaultValue={template ? template.jam_selesai.slice(0, 5) : "10:00"}
            aria-invalid={errors.jam_selesai ? true : undefined}
            className={inputClass}
          />
        </Field>
      </div>

      <Field
        label="Kapasitas per tanggal"
        htmlFor="slot-template-kapasitas"
        error={errors.kapasitas}
        hint={`Maksimal ${SLOT_CAPACITY_MAX} booking pada tanggal dan jam yang sama.`}
      >
        <input
          id="slot-template-kapasitas"
          name="kapasitas"
          type="number"
          required
          min={1}
          max={SLOT_CAPACITY_MAX}
          defaultValue={template?.kapasitas ?? SLOT_CAPACITY_MAX}
          aria-invalid={errors.kapasitas ? true : undefined}
          className={inputClass}
        />
      </Field>

      <ActiveCheckbox
        defaultChecked={template?.status_aktif ?? true}
        description="Jika nonaktif, jam ini tidak muncul di halaman booking."
      />

      <FormActions
        pending={pending}
        submitLabel={isEdit ? "Simpan perubahan" : "Tambah jadwal"}
      />
    </form>
  );
}
