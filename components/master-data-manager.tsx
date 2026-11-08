"use client";

import { useCallback, useState, type ReactNode } from "react";
import {
  CalendarDays,
  Car,
  GraduationCap,
  Package,
  Pencil,
  Plus,
} from "lucide-react";

import {
  deleteInstrukturAction,
  deleteKendaraanAction,
  deletePaketAction,
  deleteSlotTemplateAction,
} from "@/app/admin/master/actions";
import { DeleteMasterDataButton } from "@/components/delete-master-data";
import {
  InstrukturForm,
  KendaraanForm,
  PaketForm,
  SlotTemplateForm,
} from "@/components/master-data-forms";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatJam, formatRupiah } from "@/lib/format";
import {
  SLOT_CAPACITY_MAX,
  transmisiLabel,
  type InstrukturRow,
  type KendaraanRow,
  type MasterData,
  type PaketRow,
  type SlotTemplateRow,
} from "@/lib/master-data";
import { cn } from "@/lib/utils";

type DialogState =
  | { entity: "paket"; row: PaketRow | null }
  | { entity: "kendaraan"; row: KendaraanRow | null }
  | { entity: "instruktur"; row: InstrukturRow | null }
  | { entity: "slotTemplate"; row: SlotTemplateRow | null }
  | null;

const addButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

const editButtonClass =
  "inline-flex size-8 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

function SectionCard({
  title,
  description,
  icon,
  action,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  action: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
            {icon}
          </span>
          <div className="min-w-0">
            <h2 className="font-display font-bold">{title}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function RowActions({
  editLabel,
  onEdit,
  children,
}: {
  editLabel: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        onClick={onEdit}
        aria-label={editLabel}
        title={editLabel}
        className={editButtonClass}
      >
        <Pencil className="size-4" aria-hidden="true" />
      </button>
      {children}
    </div>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        active
          ? "bg-green-100 text-green-700 ring-green-600/20"
          : "bg-slate-100 text-slate-500 ring-slate-500/20",
      )}
    >
      {active ? "Aktif" : "Nonaktif"}
    </span>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="px-5 py-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function MasterDataManager({ data }: { data: MasterData }) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const closeDialog = useCallback(() => setDialog(null), []);

  const dialogKey = dialog
    ? `${dialog.entity}-${dialog.row?.id ?? "baru"}`
    : "closed";

  return (
    <>
      <div className="space-y-6">
        <SectionCard
          title="Paket kursus"
          description={`${data.paket.length} paket terdaftar`}
          icon={<Package className="size-4" aria-hidden="true" />}
          action={
            <button
              type="button"
              onClick={() => setDialog({ entity: "paket", row: null })}
              className={addButtonClass}
            >
              <Plus className="size-4" aria-hidden="true" />
              Tambah paket
            </button>
          }
        >
          <div className="divide-y divide-border xl:hidden">
            {data.paket.length === 0 ? (
              <EmptyState>Belum ada paket. Tambahkan paket pertama.</EmptyState>
            ) : (
              data.paket.map((row) => (
                <div key={row.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{row.nama}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {transmisiLabel(row.transmisi)} · {row.jumlah_pertemuan}×
                        pertemuan
                      </p>
                    </div>
                    <RowActions
                      editLabel={`Edit paket ${row.nama}`}
                      onEdit={() => setDialog({ entity: "paket", row })}
                    >
                      <DeleteMasterDataButton
                        id={row.id}
                        entityLabel={`paket ${row.nama}`}
                        description={`Paket ${row.nama} akan dihapus permanen. Paket yang sudah dipakai booking tidak dapat dihapus.`}
                        action={deletePaketAction}
                      />
                    </RowActions>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      {formatRupiah(row.harga)}
                    </p>
                    <ActiveBadge active={row.status_aktif} />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Nama</th>
                  <th className="px-5 py-3 font-medium">Transmisi</th>
                  <th className="px-5 py-3 font-medium">Pertemuan</th>
                  <th className="px-5 py-3 font-medium">Harga</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.paket.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState>
                        Belum ada paket. Tambahkan paket pertama.
                      </EmptyState>
                    </td>
                  </tr>
                ) : (
                  data.paket.map((row) => (
                    <tr key={row.id}>
                      <td className="px-5 py-3 font-medium">{row.nama}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {transmisiLabel(row.transmisi)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {row.jumlah_pertemuan}×
                      </td>
                      <td className="px-5 py-3">{formatRupiah(row.harga)}</td>
                      <td className="px-5 py-3">
                        <ActiveBadge active={row.status_aktif} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end">
                          <RowActions
                            editLabel={`Edit paket ${row.nama}`}
                            onEdit={() => setDialog({ entity: "paket", row })}
                          >
                            <DeleteMasterDataButton
                              id={row.id}
                              entityLabel={`paket ${row.nama}`}
                              description={`Paket ${row.nama} akan dihapus permanen. Paket yang sudah dipakai booking tidak dapat dihapus.`}
                              action={deletePaketAction}
                            />
                          </RowActions>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title="Kendaraan"
          description={`${data.kendaraan.length} kendaraan terdaftar`}
          icon={<Car className="size-4" aria-hidden="true" />}
          action={
            <button
              type="button"
              onClick={() => setDialog({ entity: "kendaraan", row: null })}
              className={addButtonClass}
            >
              <Plus className="size-4" aria-hidden="true" />
              Tambah kendaraan
            </button>
          }
        >
          <div className="divide-y divide-border xl:hidden">
            {data.kendaraan.length === 0 ? (
              <EmptyState>
                Belum ada kendaraan. Tambahkan kendaraan pertama.
              </EmptyState>
            ) : (
              data.kendaraan.map((row) => (
                <div key={row.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{row.nama}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {row.plat ?? "Tanpa plat"} ·{" "}
                        {transmisiLabel(row.transmisi)}
                      </p>
                    </div>
                    <RowActions
                      editLabel={`Edit kendaraan ${row.nama}`}
                      onEdit={() => setDialog({ entity: "kendaraan", row })}
                    >
                      <DeleteMasterDataButton
                        id={row.id}
                        entityLabel={`kendaraan ${row.nama}`}
                        description={`Kendaraan ${row.nama} akan dihapus permanen.`}
                        action={deleteKendaraanAction}
                      />
                    </RowActions>
                  </div>
                  <div className="mt-3">
                    <ActiveBadge active={row.status_aktif} />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Nama</th>
                  <th className="px-5 py-3 font-medium">Plat</th>
                  <th className="px-5 py-3 font-medium">Transmisi</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.kendaraan.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState>
                        Belum ada kendaraan. Tambahkan kendaraan pertama.
                      </EmptyState>
                    </td>
                  </tr>
                ) : (
                  data.kendaraan.map((row) => (
                    <tr key={row.id}>
                      <td className="px-5 py-3 font-medium">{row.nama}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {row.plat ?? "-"}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {transmisiLabel(row.transmisi)}
                      </td>
                      <td className="px-5 py-3">
                        <ActiveBadge active={row.status_aktif} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end">
                          <RowActions
                            editLabel={`Edit kendaraan ${row.nama}`}
                            onEdit={() =>
                              setDialog({ entity: "kendaraan", row })
                            }
                          >
                            <DeleteMasterDataButton
                              id={row.id}
                              entityLabel={`kendaraan ${row.nama}`}
                              description={`Kendaraan ${row.nama} akan dihapus permanen.`}
                              action={deleteKendaraanAction}
                            />
                          </RowActions>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title="Instruktur"
          description={`${data.instruktur.length} instruktur terdaftar`}
          icon={<GraduationCap className="size-4" aria-hidden="true" />}
          action={
            <button
              type="button"
              onClick={() => setDialog({ entity: "instruktur", row: null })}
              className={addButtonClass}
            >
              <Plus className="size-4" aria-hidden="true" />
              Tambah instruktur
            </button>
          }
        >
          <div className="divide-y divide-border xl:hidden">
            {data.instruktur.length === 0 ? (
              <EmptyState>
                Belum ada instruktur. Tambahkan instruktur pertama.
              </EmptyState>
            ) : (
              data.instruktur.map((row) => (
                <div key={row.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{row.nama}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {row.no_wa ?? "Tanpa nomor WhatsApp"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Foto: {row.foto_url ? "ada" : "belum"} · Sertifikat:{" "}
                        {row.sertifikat_url ? "ada" : "belum"}
                      </p>
                    </div>
                    <RowActions
                      editLabel={`Edit instruktur ${row.nama}`}
                      onEdit={() => setDialog({ entity: "instruktur", row })}
                    >
                      <DeleteMasterDataButton
                        id={row.id}
                        entityLabel={`instruktur ${row.nama}`}
                        description={`Instruktur ${row.nama} akan dihapus permanen.`}
                        action={deleteInstrukturAction}
                      />
                    </RowActions>
                  </div>
                  <div className="mt-3">
                    <ActiveBadge active={row.status_aktif} />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Nama</th>
                  <th className="px-5 py-3 font-medium">WhatsApp</th>
                  <th className="px-5 py-3 font-medium">Media</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.instruktur.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState>
                        Belum ada instruktur. Tambahkan instruktur pertama.
                      </EmptyState>
                    </td>
                  </tr>
                ) : (
                  data.instruktur.map((row) => (
                    <tr key={row.id}>
                      <td className="px-5 py-3 font-medium">{row.nama}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {row.no_wa ?? "-"}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        Foto: {row.foto_url ? "ada" : "belum"}
                        <br />
                        Sertifikat: {row.sertifikat_url ? "ada" : "belum"}
                      </td>
                      <td className="px-5 py-3">
                        <ActiveBadge active={row.status_aktif} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end">
                          <RowActions
                            editLabel={`Edit instruktur ${row.nama}`}
                            onEdit={() =>
                              setDialog({ entity: "instruktur", row })
                            }
                          >
                            <DeleteMasterDataButton
                              id={row.id}
                              entityLabel={`instruktur ${row.nama}`}
                              description={`Instruktur ${row.nama} akan dihapus permanen.`}
                              action={deleteInstrukturAction}
                            />
                          </RowActions>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title="Jadwal kursus"
          description={`${data.slotTemplate.length} jam per hari · kapasitas maksimal ${SLOT_CAPACITY_MAX} per tanggal`}
          icon={<CalendarDays className="size-4" aria-hidden="true" />}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                Senin–Minggu
              </span>
              <button
                type="button"
                onClick={() => setDialog({ entity: "slotTemplate", row: null })}
                className={addButtonClass}
              >
                <Plus className="size-4" aria-hidden="true" />
                Tambah jam
              </button>
            </div>
          }
        >
          <div className="divide-y divide-border xl:hidden">
            {data.slotTemplate.length === 0 ? (
              <EmptyState>Belum ada template jam latihan.</EmptyState>
            ) : (
              data.slotTemplate.map((row) => (
                <div key={row.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-base font-bold">
                        {formatJam(row.jam_mulai)}–{formatJam(row.jam_selesai)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Kapasitas {row.kapasitas} booking per tanggal
                      </p>
                    </div>
                    <RowActions
                      editLabel={`Edit jam ${formatJam(row.jam_mulai)}`}
                      onEdit={() =>
                        setDialog({ entity: "slotTemplate", row })
                      }
                    >
                      <DeleteMasterDataButton
                        id={row.id}
                        entityLabel={`jam ${formatJam(row.jam_mulai)}–${formatJam(row.jam_selesai)}`}
                        description={`Jam ${formatJam(row.jam_mulai)}–${formatJam(row.jam_selesai)} akan dihapus permanen. Jam yang sudah dipakai booking tidak dapat dihapus.`}
                        action={deleteSlotTemplateAction}
                      />
                    </RowActions>
                  </div>
                  <div className="mt-3">
                    <ActiveBadge active={row.status_aktif} />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Jam</th>
                  <th className="px-5 py-3 font-medium">Kapasitas</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.slotTemplate.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState>Belum ada template jam latihan.</EmptyState>
                    </td>
                  </tr>
                ) : (
                  data.slotTemplate.map((row) => (
                    <tr key={row.id}>
                      <td className="px-5 py-3 font-medium">
                        {formatJam(row.jam_mulai)}–{formatJam(row.jam_selesai)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {row.kapasitas} booking / tanggal
                      </td>
                      <td className="px-5 py-3">
                        <ActiveBadge active={row.status_aktif} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end">
                          <RowActions
                            editLabel={`Edit jam ${formatJam(row.jam_mulai)}`}
                            onEdit={() =>
                              setDialog({ entity: "slotTemplate", row })
                            }
                          >
                            <DeleteMasterDataButton
                              id={row.id}
                              entityLabel={`jam ${formatJam(row.jam_mulai)}–${formatJam(row.jam_selesai)}`}
                              description={`Jam ${formatJam(row.jam_mulai)}–${formatJam(row.jam_selesai)} akan dihapus permanen. Jam yang sudah dipakai booking tidak dapat dihapus.`}
                              action={deleteSlotTemplateAction}
                            />
                          </RowActions>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        {dialog && (
          <DialogContent
            showCloseButton={false}
            className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
          >
            {dialog.entity === "paket" && (
              <PaketForm
                key={dialogKey}
                paket={dialog.row}
                onSuccess={closeDialog}
              />
            )}
            {dialog.entity === "kendaraan" && (
              <KendaraanForm
                key={dialogKey}
                kendaraan={dialog.row}
                onSuccess={closeDialog}
              />
            )}
            {dialog.entity === "instruktur" && (
              <InstrukturForm
                key={dialogKey}
                instruktur={dialog.row}
                onSuccess={closeDialog}
              />
            )}
            {dialog.entity === "slotTemplate" && (
              <SlotTemplateForm
                key={dialogKey}
                template={dialog.row}
                onSuccess={closeDialog}
              />
            )}
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
