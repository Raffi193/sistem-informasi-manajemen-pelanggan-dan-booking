"use client";

import { useActionState, useEffect, type ReactNode } from "react";
import {
  saveInstrukturAction,
  saveKendaraanAction,
  savePaketAction,
  saveSlotAction,
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
import { todayInJakarta } from "@/lib/date";
import {
  SLOT_SESI_OPTIONS,
  SLOT_STATUS_OPTIONS,
  TRANSMISI_OPTIONS,
  type InstrukturRow,
  type KendaraanRow,
  type PaketRow,
  type SlotRow,
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
          Kendaraan dapat dipasangkan ke slot jadwal kursus.
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
        description="Kendaraan nonaktif tidak disarankan dipakai untuk slot baru."
      />

      <FormActions
        pending={pending}
        submitLabel={isEdit ? "Simpan perubahan" : "Tambah kendaraan"}
      />
    </form>
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

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <DialogHeader>
        <DialogTitle>
          {isEdit ? "Edit instruktur" : "Tambah instruktur"}
        </DialogTitle>
        <DialogDescription>
          Instruktur dapat dipasangkan ke slot jadwal kursus.
        </DialogDescription>
      </DialogHeader>

      {state.status === "error" && state.message && (
        <FormError message={state.message} />
      )}

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

      <ActiveCheckbox
        defaultChecked={instruktur?.status_aktif ?? true}
        description="Instruktur nonaktif tidak disarankan dipakai untuk slot baru."
      />

      <FormActions
        pending={pending}
        submitLabel={isEdit ? "Simpan perubahan" : "Tambah instruktur"}
      />
    </form>
  );
}

export function SlotForm({
  slot,
  kendaraan,
  instruktur,
  onSuccess,
}: {
  slot: SlotRow | null;
  kendaraan: KendaraanRow[];
  instruktur: InstrukturRow[];
  onSuccess: () => void;
}) {
  const { state, formAction, pending } = useMasterForm(
    saveSlotAction,
    onSuccess,
  );
  const errors = state.fieldErrors ?? {};
  const isEdit = Boolean(slot);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit slot jadwal" : "Tambah slot jadwal"}</DialogTitle>
        <DialogDescription>
          Slot berstatus tersedia akan muncul di pilihan jadwal customer.
        </DialogDescription>
      </DialogHeader>

      {state.status === "error" && state.message && (
        <FormError message={state.message} />
      )}

      {slot && <input type="hidden" name="id" value={slot.id} />}

      <Field label="Tanggal" htmlFor="slot-tanggal" error={errors.tanggal}>
        <input
          id="slot-tanggal"
          name="tanggal"
          type="date"
          required
          defaultValue={slot?.tanggal ?? todayInJakarta()}
          aria-invalid={errors.tanggal ? true : undefined}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Jam mulai" htmlFor="slot-jam-mulai" error={errors.jam_mulai}>
          <input
            id="slot-jam-mulai"
            name="jam_mulai"
            type="time"
            required
            defaultValue={slot?.jam_mulai.slice(0, 5) ?? "08:00"}
            aria-invalid={errors.jam_mulai ? true : undefined}
            className={inputClass}
          />
        </Field>

        <Field
          label="Jam selesai"
          htmlFor="slot-jam-selesai"
          error={errors.jam_selesai}
        >
          <input
            id="slot-jam-selesai"
            name="jam_selesai"
            type="time"
            required
            defaultValue={slot?.jam_selesai.slice(0, 5) ?? "09:00"}
            aria-invalid={errors.jam_selesai ? true : undefined}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Sesi" htmlFor="slot-sesi" error={errors.sesi}>
          <select
            id="slot-sesi"
            name="sesi"
            required
            defaultValue={slot?.sesi ?? "reguler"}
            aria-invalid={errors.sesi ? true : undefined}
            className={inputClass}
          >
            {SLOT_SESI_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status" htmlFor="slot-status" error={errors.status}>
          <select
            id="slot-status"
            name="status"
            required
            defaultValue={slot?.status ?? "tersedia"}
            aria-invalid={errors.status ? true : undefined}
            className={inputClass}
          >
            {SLOT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Kendaraan (opsional)"
          htmlFor="slot-kendaraan"
          error={errors.kendaraan_id}
        >
          <select
            id="slot-kendaraan"
            name="kendaraan_id"
            defaultValue={slot?.kendaraan_id ?? ""}
            aria-invalid={errors.kendaraan_id ? true : undefined}
            className={inputClass}
          >
            <option value="">Tanpa kendaraan</option>
            {kendaraan.map((item) => (
              <option
                key={item.id}
                value={item.id}
                disabled={!item.status_aktif && item.id !== slot?.kendaraan_id}
              >
                {item.nama}
                {item.plat ? ` — ${item.plat}` : ""}
                {item.status_aktif ? "" : " (nonaktif)"}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Instruktur (opsional)"
          htmlFor="slot-instruktur"
          error={errors.instruktur_id}
        >
          <select
            id="slot-instruktur"
            name="instruktur_id"
            defaultValue={slot?.instruktur_id ?? ""}
            aria-invalid={errors.instruktur_id ? true : undefined}
            className={inputClass}
          >
            <option value="">Tanpa instruktur</option>
            {instruktur.map((item) => (
              <option
                key={item.id}
                value={item.id}
                disabled={!item.status_aktif && item.id !== slot?.instruktur_id}
              >
                {item.nama}
                {item.status_aktif ? "" : " (nonaktif)"}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <p className="rounded-xl bg-secondary/60 px-3.5 py-3 text-xs leading-relaxed text-muted-foreground">
        Slot yang sudah memiliki booking tidak dapat dibuka kembali menjadi
        tersedia. Gunakan status penuh atau ditutup untuk menjaga jadwal.
      </p>

      <FormActions
        pending={pending}
        submitLabel={isEdit ? "Simpan perubahan" : "Tambah slot"}
      />
    </form>
  );
}
