"use server";

import { supabaseAdmin, supabaseServer, supabaseSiap } from "@/lib/supabase/server";

/** Menghitung admin yang sudah ada. Dipakai untuk mengunci halaman /setup
 *  begitu admin pertama terbentuk. */
export async function jumlahAdmin(): Promise<{ jumlah: number; error?: string }> {
  if (!supabaseSiap) return { jumlah: -1, error: "Aplikasi belum tersambung ke database." };
  try {
    const admin = supabaseAdmin();
    const { count, error } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .in("peran", ["admin", "operator"])
      .is("deleted_at", null);
    if (error) {
      if (error.message.includes("does not exist") || error.code === "42P01") {
        return { jumlah: -1, error: "Tabel belum ada — jalankan supabase/schema.sql di SQL Editor dulu." };
      }
      return { jumlah: -1, error: error.message };
    }
    return { jumlah: count ?? 0 };
  } catch (e) {
    return { jumlah: -1, error: e instanceof Error ? e.message : "SUPABASE_SERVICE_ROLE_KEY belum diisi." };
  }
}

export async function buatAdminPertama(_prev: unknown, fd: FormData) {
  const nama = String(fd.get("nama") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const ulangi = String(fd.get("ulangi") ?? "");

  if (!nama || !email || !password) return { error: "Nama, email, dan password wajib diisi." };
  if (!email.includes("@")) return { error: "Format email tidak benar." };
  if (password.length < 8) return { error: "Password minimal 8 karakter." };
  if (password !== ulangi) return { error: "Ulangi password tidak sama." };

  // Kunci: hanya boleh dipakai selama BELUM ada admin sama sekali.
  const cek = await jumlahAdmin();
  if (cek.error) return { error: cek.error };
  if (cek.jumlah > 0) {
    return { error: "Admin sudah ada. Halaman ini otomatis nonaktif — silakan login seperti biasa." };
  }

  let admin;
  try {
    admin = supabaseAdmin();
  } catch {
    return {
      error:
        "SUPABASE_SERVICE_ROLE_KEY belum diisi di Environment Variables. Ambil dari Supabase → " +
        "Project Settings → API → service_role, lalu deploy ulang.",
    };
  }

  // Kalau email sudah terdaftar (mis. terlanjur dibuat manual), pakai akun itu saja.
  let userId: string | null = null;
  const { data: baru, error: eBuat } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nama, peran: "admin" },
  });

  if (eBuat) {
    const pesan = eBuat.message.toLowerCase();
    if (pesan.includes("already") || pesan.includes("registered") || pesan.includes("exists")) {
      const { data: daftar } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const ada = daftar?.users.find((u) => (u.email ?? "").toLowerCase() === email);
      if (!ada) return { error: "Email sudah terdaftar tapi akunnya tidak ditemukan. Cek di Authentication → Users." };
      userId = ada.id;
      // setel ulang passwordnya supaya cocok dengan yang baru diisi
      await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
    } else {
      return { error: "Gagal membuat akun: " + eBuat.message };
    }
  } else {
    userId = baru.user.id;
  }

  const { error: eProfil } = await admin
    .from("profiles")
    .upsert({ id: userId!, nama, peran: "admin", alumni_id: null }, { onConflict: "id" });
  if (eProfil) return { error: "Akun dibuat, tapi gagal menyetel peran admin: " + eProfil.message };

  try {
    const sb = await supabaseServer();
    await sb.from("activity_log").insert({
      aktor: nama,
      aksi: "buat admin pertama",
      tabel: "profiles",
      ref_id: userId,
      keterangan: email,
    });
  } catch {
    /* log tidak wajib */
  }

  return { ok: `Admin “${nama}” berhasil dibuat. Silakan login dengan ${email}.` };
}
