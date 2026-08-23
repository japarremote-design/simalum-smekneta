"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin, sesiSaya, catatLog } from "@/lib/supabase/server";

const DOMAIN = process.env.NEXT_PUBLIC_ALUMNI_EMAIL_DOMAIN || "alumni.smkn1tambelangan.sch.id";
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** Hanya peran 'admin' yang boleh mengelola pengguna. 'operator' boleh mengelola
 *  data alumni tapi tidak boleh membuat atau menurunkan akun orang lain. */
async function pastikanAdmin() {
  const sesi = await sesiSaya();
  if (!sesi || sesi.profil.peran !== "admin") return null;
  return sesi;
}

async function jumlahAdminAktif(kecuali?: string) {
  const admin = supabaseAdmin();
  let q = admin.from("profiles").select("id", { count: "exact", head: true }).eq("peran", "admin").is("deleted_at", null);
  if (kecuali) q = q.neq("id", kecuali);
  const { count } = await q;
  return count ?? 0;
}

export async function tambahPengurus(_prev: unknown, fd: FormData) {
  const sesi = await pastikanAdmin();
  if (!sesi) return { error: "Hanya admin yang boleh menambah pengurus." };

  const nama = s(fd, "nama");
  const email = s(fd, "email").toLowerCase();
  const password = s(fd, "password");
  const peran = s(fd, "peran") === "operator" ? "operator" : "admin";

  if (!nama || !email || !password) return { error: "Nama, email, dan password wajib diisi." };
  if (!email.includes("@")) return { error: "Format email tidak benar." };
  if (email.endsWith("@" + DOMAIN)) {
    return { error: `Jangan pakai domain ${DOMAIN} — itu khusus akun alumni. Pakai email asli pengurus.` };
  }
  if (password.length < 8) return { error: "Password minimal 8 karakter." };

  const admin = supabaseAdmin();
  const { data: baru, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nama, peran },
  });
  if (error) {
    const p = error.message.toLowerCase();
    if (p.includes("already") || p.includes("registered") || p.includes("exists")) {
      return { error: `Email ${email} sudah dipakai akun lain. Pakai email berbeda, atau ubah peran akun itu di daftar bawah.` };
    }
    return { error: "Gagal membuat akun: " + error.message };
  }

  const { error: eProfil } = await admin
    .from("profiles")
    .upsert({ id: baru.user.id, nama, peran, alumni_id: null }, { onConflict: "id" });
  if (eProfil) return { error: "Akun dibuat tapi peran gagal disetel: " + eProfil.message };

  await catatLog("tambah pengurus", "profiles", baru.user.id, `${nama} (${peran}) — ${email}`);
  revalidatePath("/pengguna");
  return { ok: `${nama} ditambahkan sebagai ${peran}. Beri tahu passwordnya lalu minta segera diganti.` };
}

export async function resetPassword(_prev: unknown, fd: FormData) {
  const sesi = await pastikanAdmin();
  if (!sesi) return { error: "Hanya admin yang boleh mereset password." };

  const id = s(fd, "id");
  const password = s(fd, "password");
  if (password.length < 8) return { error: "Password minimal 8 karakter." };

  const admin = supabaseAdmin();
  const { error } = await admin.auth.admin.updateUserById(id, { password });
  if (error) return { error: "Gagal reset password: " + error.message };

  await catatLog("reset password", "profiles", id, "oleh " + sesi.profil.nama);
  revalidatePath("/pengguna");
  return { ok: "Password berhasil diganti. Sampaikan ke yang bersangkutan lewat jalur pribadi." };
}

export async function ubahPeran(fd: FormData) {
  const sesi = await pastikanAdmin();
  if (!sesi) return;
  const id = s(fd, "id");
  const peran = s(fd, "peran");
  if (!["admin", "operator"].includes(peran)) return;

  if (id === sesi.user.id && peran !== "admin") {
    revalidatePath("/pengguna");
    return;
  }
  if (peran !== "admin" && (await jumlahAdminAktif(id)) === 0) {
    revalidatePath("/pengguna");
    return;
  }

  const admin = supabaseAdmin();
  await admin.from("profiles").update({ peran }).eq("id", id);
  await catatLog("ubah peran", "profiles", id, "jadi " + peran);
  revalidatePath("/pengguna");
}

export async function setAktif(fd: FormData) {
  const sesi = await pastikanAdmin();
  if (!sesi) return;
  const id = s(fd, "id");
  const aktifkan = s(fd, "aktifkan") === "1";

  // jangan sampai admin menonaktifkan dirinya sendiri atau admin terakhir
  if (!aktifkan && id === sesi.user.id) {
    revalidatePath("/pengguna");
    return;
  }
  if (!aktifkan && (await jumlahAdminAktif(id)) === 0) {
    revalidatePath("/pengguna");
    return;
  }

  const admin = supabaseAdmin();
  await admin.from("profiles").update({ deleted_at: aktifkan ? null : new Date().toISOString() }).eq("id", id);
  // banned = tidak bisa login sama sekali, bukan sekadar disembunyikan
  await admin.auth.admin.updateUserById(id, { ban_duration: aktifkan ? "none" : "876000h" });

  await catatLog(aktifkan ? "aktifkan pengurus" : "nonaktifkan pengurus", "profiles", id, "oleh " + sesi.profil.nama);
  revalidatePath("/pengguna");
}
