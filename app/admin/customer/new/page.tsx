import Link from "next/link";
import { connection } from "next/server";
import { AdminPageHeader } from "@/components/admin-page-header";
import { CustomerForm } from "@/components/customer-form";
import { createCustomerAction } from "@/app/admin/customer/actions";

export const instant = false;

export default async function NewCustomerPage() {
  await connection();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/customer"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Kembali ke daftar customer
        </Link>
      </div>

      <AdminPageHeader
        title="Tambah customer"
        description="Buat data customer baru secara manual. Data booking tetap dibuat dari halaman booking."
      />

      <section className="rounded-2xl border border-border bg-white p-5">
        <CustomerForm
          mode="create"
          action={createCustomerAction}
          cancelHref="/admin/customer"
        />
      </section>
    </div>
  );
}