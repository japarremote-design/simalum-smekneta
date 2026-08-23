/**
 * Membuat akun ADMIN pertama.
 * Jalankan: node scripts/buat-admin.mjs admin@smkn1tambelangan.sch.id rahasia123 "Admin Sekolah"
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

try {
  readFileSync(".env.local", "utf8")
    .split("\n")
    .forEach((baris) => {
      const m = baris.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    });
} catch {
  /* abaikan */
}

const [email, password, ...namaArr] = process.argv.slice(2);
const nama = namaArr.join(" ") || "Admin Sekolah";
if (!email || !password) {
  console.error('Cara pakai: node scripts/buat-admin.mjs <email> <password> "Nama Admin"');
  process.exit(1);
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data, error } = await sb.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { nama, peran: "admin" },
});
if (error) {
  console.error("✗ Gagal:", error.message);
  process.exit(1);
}
await sb.from("profiles").upsert({ id: data.user.id, nama, peran: "admin", alumni_id: null });
console.log(`✓ Akun admin dibuat: ${email}`);
console.log("  Login lewat halaman /login pada tab “Login Admin”.");
