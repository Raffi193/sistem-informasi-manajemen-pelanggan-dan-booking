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
  deleteSlotAction,
} from "@/app/admin/master/actions";
import { DeleteMasterDataButton } from "@/components/delete-master-data";
import {
  InstrukturForm,
  KendaraanForm,
  PaketForm,
  SlotForm,
} from "@/components/master-data-forms";
import { StatusBadge } from "@/components/status-badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatTanggal } from "@/lib/date";
import { formatJam, formatRupiah } from "@/lib/format";
import {
  transmisiLabel,
  type InstrukturRow,
  type KendaraanRow,
  type MasterData,
  type PaketRow,
  type SlotRow,
} from "@/lib/master-data";
import { cn } from "@/lib/utils";

type DialogState =
  | { entity: "paket"; row: PaketRow | null }
  | { entity: "kendaraan"; row: KendaraanRow | null }
  | { entity: "instruktur"; row: InstrukturRow | null }
  | { entity: "slot"; row: SlotRow | null }
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
                        description={`Kendaraan ${row.nama} akan dihapus permanen. Kendaraan yang masih dipakai slot tidak dapat dihapus.`}
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
                              description={`Kendaraan ${row.nama} akan dihapus permanen. Kendaraan yang masih dipakai slot tidak dapat dihapus.`}
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
                    </div>
                    <RowActions
                      editLabel={`Edit instruktur ${row.nama}`}
                      onEdit={() => setDialog({ entity: "instruktur", row })}
                    >
                      <DeleteMasterDataButton
                        id={row.id}
                        entityLabel={`instruktur ${row.nama}`}
                        description={`Instruktur ${row.nama} akan dihapus permanen. Instruktur yang masih dipakai slot tidak dapat dihapus.`}
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
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.instruktur.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
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
                              description={`Instruktur ${row.nama} akan dihapus permanen. Instruktur yang masih dipakai slot tidak dapat dihapus.`}
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
          title="Slot jadwal"
          description={`${data.slot.length} slot ditampilkan`}
          icon={<CalendarDays className="size-4" aria-hidden="true" />}
          action={
            <button
              type="button"
              onClick={() => setDialog({ entity: "slot", row: null })}
              className={addButtonClass}
            >
              <Plus className="size-4" aria-hidden="true" />
              Tambah slot
            </button>
          }
        >
          <div className="divide-y divide-border xl:hidden">
            {data.slot.length === 0 ? (
              <EmptyState>Belum ada slot. Tambahkan slot pertama.</EmptyState>
            ) : (
              data.slot.map((row) => (
                <div key={row.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {formatTanggal(row.tanggal)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatJam(row.jam_mulai)}–{formatJam(row.jam_selesai)} ·{" "}
                        <span className="capitalize">{row.sesi}</span>
                      </p>
                    </div>
                    <RowActions
                      editLabel={`Edit slot ${row.tanggal} ${formatJam(row.jam_mulai)}`}
                      onEdit={() => setDialog({ entity: "slot", row })}
                    >
                      <DeleteMasterDataButton
                        id={row.id}
                        entityLabel={`slot ${row.tanggal} ${formatJam(row.jam_mulai)}`}
                        description={`Slot ${formatTanggal(row.tanggal)} pukul ${formatJam(row.jam_mulai)} akan dihapus permanen. Slot yang sudah memiliki booking tidak dapat dihapus.`}
                        action={deleteSlotAction}
                      />
                    </RowActions>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {row.kendaraan_nama ?? "Tanpa kendaraan"} ·{" "}
                    {row.instruktur_nama ?? "Tanpa instruktur"}
                  </p>
                  <div className="mt-3">
                    <StatusBadge status={row.status} />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Tanggal</th>
                  <th className="px-5 py-3 font-medium">Jam</th>
                  <th className="px-5 py-3 font-medium">Sesi</th>
                  <th className="px-5 py-3 font-medium">Kendaraan</th>
                  <th className="px-5 py-3 font-medium">Instruktur</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.slot.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState>
                        Belum ada slot. Tambahkan slot pertama.
                      </EmptyState>
                    </td>
                  </tr>
                ) : (
                  data.slot.map((row) => (
                    <tr key={row.id}>
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatTanggal(row.tanggal)}
                      </td>
                      <td className="px-5 py-3 font-medium">
                        {formatJam(row.jam_mulai)}–{formatJam(row.jam_selesai)}
                      </td>
                      <td className="px-5 py-3 capitalize text-muted-foreground">
                        {row.sesi}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {row.kendaraan_nama ?? "-"}
                        {row.kendaraan_plat ? ` (${row.kendaraan_plat})` : ""}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {row.instruktur_nama ?? "-"}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end">
                          <RowActions
                            editLabel={`Edit slot ${row.tanggal} ${formatJam(row.jam_mulai)}`}
                            onEdit={() => setDialog({ entity: "slot", row })}
                          >
                            <DeleteMasterDataButton
                              id={row.id}
                              entityLabel={`slot ${row.tanggal} ${formatJam(row.jam_mulai)}`}
                              description={`Slot ${formatTanggal(row.tanggal)} pukul ${formatJam(row.jam_mulai)} akan dihapus permanen. Slot yang sudah memiliki booking tidak dapat dihapus.`}
                              action={deleteSlotAction}
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
            {dialog.entity === "slot" && (
              <SlotForm
                key={dialogKey}
                slot={dialog.row}
                kendaraan={data.kendaraan}
                instruktur={data.instruktur}
                onSuccess={closeDialog}
              />
            )}
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
