"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Keluar dari sesi admin lalu kembali ke halaman login. */
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
