// Utilitas: membuat akun admin baru.
// Pemakaian: node scripts/create-admin.mjs <email> <password>
//
// Catatan: pada desain MVP, SETIAP user Supabase Auth dianggap admin.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Pemakaian: node scripts/create-admin.mjs <email> <password>");
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.trim().startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const admin = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (error) {
  console.error("Gagal membuat admin:", error.message);
  process.exit(1);
}

console.log("Admin berhasil dibuat:", data.user.email);
