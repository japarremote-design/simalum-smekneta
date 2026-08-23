"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer, supabaseAdmin, sesiSaya, catatLog } from "@/lib/supabase/server";

const DOMAIN = process.env.NEXT_PUBLIC_ALUMNI_EMAIL_DOMAIN || "alumni.smkn1tambelangan.sch.id";
export const emailAlumni = async (nisn: string) => `${nisn}@${DOMAIN}`;

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const n = (fd: FormData, k: string) => {
  const v = s(fd, k);
  return v === "" ? null : Number(v);
};
const nz = (fd: FormData, k: string) => {
  const v = s(fd, k);
  return v === "" ? null : v;
};

/* ===================== AUTH ===================== */
export async function masuk(_prev: unknown, fd: FormData) {
  const peran = s(fd, "peran");
  const idn = s(fd, "identitas");
  const password = s(fd, "password");
  if (!idn || !password) return { error: "Isi dulu username dan password." };

  const email = peran === "alumni" ? (idn.includes("@") ? idn : `${idn}@${DOMAIN}`) : idn;
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    // Pesan dibedakan supaya pengurus aplikasi tahu harus membetulkan apa.
    const pesan = (error?.message || "").toLowerCase();
    if (pesan.includes("not confirmed") || pesan.includes("email_not_confirmed")) {
      return {
        error:
          "Email akun ini belum dikonfirmasi. Di Supabase buka Authentication → Providers → Email, " +
          "matikan “Confirm email”, lalu konfirmasi user ini di menu Users.",
      };
    }
    if (pesan.includes("fetch") || pesan.includes("network") || pesan.includes("upstream")) {
      return { error: "Tidak bisa menghubungi database. Cek NEXT_PUBLIC_SUPABASE_URL dan koneksi internet." };
    }
    if (pesan.includes("rate") || pesan.includes("too many")) {
      return { error: "Terlalu banyak percobaan login. Tunggu sebentar lalu coba lagi." };
    }
    return {
      error: peran === "alumni" ? "NISN atau password salah." : "Email atau password salah.",
    };
  }

  const { data: profil, error: eProfil } = await sb
    .from("profiles")
    .select("peran, alumni_id")
    .eq("id", data.user.id)
    .maybeSingle();
  if (eProfil) {
    await sb.auth.signOut();
    return { error: "Gagal membaca profil akun: " + eProfil.message + " — pastikan supabase/schema.sql sudah dijalankan." };
  }
  if (!profil) {
    await sb.auth.signOut();
    return {
      error:
        "Akun ini belum punya baris di tabel profiles — biasanya karena user dibuat sebelum schema.sql dijalankan. " +
        "Jalankan di SQL Editor: insert into public.profiles (id, nama, peran) values ('" +
        data.user.id +
        "', 'Admin Sekolah', 'admin');",
    };
  }
  if (peran === "alumni" && profil.peran !== "alumni") {
    await sb.auth.signOut();
    return { error: "Akun ini adalah akun admin. Pakai tab Login Admin." };
  }
  if (peran === "admin" && profil.peran === "alumni") {
    await sb.auth.signOut();
    return {
      error:
        "Akun ini masih berperan “alumni”, jadi belum boleh masuk sebagai admin. " +
        "Kalau ini memang akun pengurus, jalankan di Supabase SQL Editor: " +
        `update public.profiles set peran = 'admin' where id = (select id from auth.users where email = '${email}');`,
    };
  }
  if (profil.peran === "alumni" && profil.alumni_id) {
    const { data: a } = await sb.from("alumni").select("deleted_at").eq("id", profil.alumni_id).maybeSingle();
    if (a?.deleted_at) {
      await sb.auth.signOut();
      return { error: "Data alumni Anda sedang dinonaktifkan. Hubungi admin sekolah." };
    }
  }
  await catatLog("login", "profiles", data.user.id, profil.peran);
  redirect(profil.peran === "alumni" ? "/profil" : "/dashboard");
}

export async function keluar() {
  const sb = await supabaseServer();
  await catatLog("logout", "profiles", null, "");
  await sb.auth.signOut();
  redirect("/login");
}

/* ===================== ALUMNI ===================== */
function dataAlumni(fd: FormData) {
  return {
    nisn: s(fd, "nisn"),
    nis: s(fd, "nis"),
    nama: s(fd, "nama"),
    jenis_kelamin: (s(fd, "jenis_kelamin") === "P" ? "P" : "L") as "L" | "P",
    tempat_lahir: nz(fd, "tempat_lahir"),
    tanggal_lahir: nz(fd, "tanggal_lahir"),
    jurusan_id: Number(s(fd, "jurusan_id")),
    rombel: nz(fd, "rombel"),
    tahun_masuk: n(fd, "tahun_masuk"),
    tahun_lulus: n(fd, "tahun_lulus"),
    no_hp: nz(fd, "no_hp"),
    email: nz(fd, "email"),
    alamat: nz(fd, "alamat"),
    desa: nz(fd, "desa"),
    kecamatan: nz(fd, "kecamatan"),
    kabupaten: nz(fd, "kabupaten"),
  };
}

export async function simpanAlumni(_prev: unknown, fd: FormData) {
  const sesi = await sesiSaya();
  if (!sesi) return { error: "Sesi habis, silakan login lagi." };
  const id = s(fd, "id");
  const milikSendiri = sesi.profil.peran === "alumni" && sesi.profil.alumni_id === id;
  if (sesi.profil.peran === "alumni" && !milikSendiri) return { error: "Tidak punya akses." };

  const d = dataAlumni(fd);
  if (!d.nisn || !d.nis || !d.nama) return { error: "NISN, NIS, dan nama wajib diisi." };
  if (!d.jurusan_id) return { error: "Jurusan wajib dipilih." };

  const sb = await supabaseServer();

  // cek NISN ganda di antara baris yang masih hidup
  const cek = await sb.from("alumni").select("id, deleted_at").eq("nisn", d.nisn).is("deleted_at", null).maybeSingle();
  if (cek.data && cek.data.id !== id) return { error: `NISN ${d.nisn} sudah dipakai alumni lain.` };

  if (id) {
    const { error } = await sb.from("alumni").update(d).eq("id", id);
    if (error) return { error: error.message };
    await simpanFoto(fd, id);
    await catatLog("update", "alumni", id, d.nama);
    revalidatePath("/alumni");
    revalidatePath(`/alumni/${id}`);
    revalidatePath("/profil");
    return { ok: `Data ${d.nama} berhasil diperbarui.` };
  }

  const { data: baru, error } = await sb.from("alumni").insert(d).select("id").single();
  if (error) return { error: error.message };
  await simpanFoto(fd, baru.id);

  // buat akun login alumni (username & password awal = NISN)
  let catatanAkun = "";
  try {
    const admin = supabaseAdmin();
    const { data: akun, error: eAkun } = await admin.auth.admin.createUser({
      email: await emailAlumni(d.nisn),
      password: d.nisn,
      email_confirm: true,
      user_metadata: { nama: d.nama, peran: "alumni", alumni_id: baru.id },
    });
    if (eAkun) throw eAkun;
    await admin.from("profiles").upsert({ id: akun.user.id, nama: d.nama, peran: "alumni", alumni_id: baru.id });
    await admin.from("alumni").update({ user_id: akun.user.id }).eq("id", baru.id);
    catatanAkun = ` Akun login: ${d.nisn} / ${d.nisn}`;
  } catch {
    catatanAkun = " (akun login belum dibuat — cek SUPABASE_SERVICE_ROLE_KEY)";
  }

  await catatLog("insert", "alumni", baru.id, d.nama);
  revalidatePath("/alumni");
  return { ok: `${d.nama} ditambahkan.${catatanAkun}` };
}

async function simpanFoto(fd: FormData, alumniId: string) {
  const file = fd.get("foto");
  if (!(file instanceof File) || file.size === 0) return;
  const sb = await supabaseServer();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `alumni/${alumniId}/foto-${Date.now()}.${ext}`;
  const { error } = await sb.storage.from("berkas").upload(path, file, { upsert: true });
  if (!error) await sb.from("alumni").update({ foto_path: path }).eq("id", alumniId);
}

export async function hapusAlumni(fd: FormData) {
  const sesi = await sesiSaya();
  if (!sesi || sesi.profil.peran === "alumni") return;
  const id = s(fd, "id");
  const alasan = s(fd, "alasan") || "-";
  const sb = await supabaseServer();
  const stempel = { deleted_at: new Date().toISOString(), deleted_by: sesi.user.id };

  await sb.from("alumni").update({ ...stempel, deleted_reason: alasan }).eq("id", id);
  await sb.from("riwayat").update(stempel).eq("alumni_id", id).is("deleted_at", null);
  await sb.from("profiles").update({ deleted_at: stempel.deleted_at }).eq("alumni_id", id);

  await catatLog("soft delete", "alumni", id, alasan);
  revalidatePath("/alumni");
  revalidatePath("/sampah");
  redirect("/alumni?pesan=" + encodeURIComponent("Data dipindahkan ke kotak sampah."));
}

export async function pulihkanAlumni(fd: FormData) {
  const sesi = await sesiSaya();
  if (!sesi || sesi.profil.peran === "alumni") return;
  const id = s(fd, "id");
  const sb = await supabaseServer();

  const { data: row } = await sb.from("alumni").select("nisn, nama").eq("id", id).single();
  if (row) {
    const { data: bentrok } = await sb.from("alumni").select("id").eq("nisn", row.nisn).is("deleted_at", null).maybeSingle();
    if (bentrok) {
      redirect("/sampah?pesan=" + encodeURIComponent(`Gagal: NISN ${row.nisn} sudah dipakai data aktif lain.`));
    }
  }
  await sb.from("alumni").update({ deleted_at: null, deleted_by: null, deleted_reason: null }).eq("id", id);
  await sb.from("profiles").update({ deleted_at: null }).eq("alumni_id", id);
  await catatLog("restore", "alumni", id, row?.nama ?? "");
  revalidatePath("/sampah");
  revalidatePath("/alumni");
  redirect("/sampah?pesan=" + encodeURIComponent("Data alumni berhasil dipulihkan."));
}

/* ===================== RIWAYAT ===================== */
export async function simpanRiwayat(_prev: unknown, fd: FormData) {
  const sesi = await sesiSaya();
  if (!sesi) return { error: "Sesi habis." };
  const id = s(fd, "id");
  const alumni_id = s(fd, "alumni_id");
  if (sesi.profil.peran === "alumni" && sesi.profil.alumni_id !== alumni_id) return { error: "Tidak punya akses." };
  if (!s(fd, "instansi")) return { error: "Nama instansi wajib diisi." };

  const d = {
    alumni_id,
    jenis: s(fd, "jenis") as "Kerja" | "Kuliah" | "Wirausaha" | "Magang",
    instansi: s(fd, "instansi"),
    posisi: nz(fd, "posisi"),
    bidang: nz(fd, "bidang"),
    kota: nz(fd, "kota"),
    provinsi: nz(fd, "provinsi"),
    tgl_mulai: nz(fd, "tgl_mulai"),
    tgl_selesai: nz(fd, "tgl_selesai"),
    gaji_range: s(fd, "gaji_range") || "-",
    linier: fd.get("linier") ? true : false,
    sumber: sesi.profil.peran === "alumni" ? "Isian alumni" : "Input admin",
  };

  const sb = await supabaseServer();
  let refId = id;
  if (id) {
    const { error } = await sb.from("riwayat").update(d).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await sb.from("riwayat").insert(d).select("id").single();
    if (error) return { error: error.message };
    refId = data.id;
  }
  await simpanBukti(fd, refId);
  await catatLog(id ? "update" : "insert", "riwayat", refId, d.instansi);
  revalidatePath(`/alumni/${alumni_id}`);
  revalidatePath("/profil");
  revalidatePath("/dashboard");
  return { ok: id ? "Riwayat diperbarui." : "Riwayat ditambahkan." };
}

async function simpanBukti(fd: FormData, riwayatId: string) {
  const file = fd.get("bukti");
  if (!(file instanceof File) || file.size === 0) return;
  const sb = await supabaseServer();
  const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
  const path = `riwayat/${riwayatId}/bukti-${Date.now()}.${ext}`;
  const { error } = await sb.storage.from("berkas").upload(path, file, { upsert: true });
  if (!error) await sb.from("riwayat").update({ bukti_path: path }).eq("id", riwayatId);
}

export async function hapusRiwayat(fd: FormData) {
  const sesi = await sesiSaya();
  if (!sesi) return;
  const id = s(fd, "id");
  const alumni_id = s(fd, "alumni_id");
  if (sesi.profil.peran === "alumni" && sesi.profil.alumni_id !== alumni_id) return;
  const sb = await supabaseServer();
  await sb.from("riwayat").update({ deleted_at: new Date().toISOString(), deleted_by: sesi.user.id }).eq("id", id);
  await catatLog("soft delete", "riwayat", id, "");
  revalidatePath(`/alumni/${alumni_id}`);
  revalidatePath("/profil");
  revalidatePath("/sampah");
}

export async function pulihkanRiwayat(fd: FormData) {
  const sesi = await sesiSaya();
  if (!sesi || sesi.profil.peran === "alumni") return;
  const id = s(fd, "id");
  const sb = await supabaseServer();
  const { data: row } = await sb.from("riwayat").select("alumni_id").eq("id", id).single();
  if (row) {
    const { data: a } = await sb.from("alumni").select("deleted_at").eq("id", row.alumni_id).single();
    if (a?.deleted_at) {
      redirect("/sampah?pesan=" + encodeURIComponent("Pulihkan dulu data alumninya."));
    }
  }
  await sb.from("riwayat").update({ deleted_at: null, deleted_by: null }).eq("id", id);
  await catatLog("restore", "riwayat", id, "");
  revalidatePath("/sampah");
  redirect("/sampah?pesan=" + encodeURIComponent("Riwayat berhasil dipulihkan."));
}

/* ===================== TRACER STUDY ===================== */
export async function kirimTracer(_prev: unknown, fd: FormData) {
  const nama = s(fd, "nama");
  if (!nama) return { error: "Nama wajib diisi." };
  if (!s(fd, "nisn")) return { error: "NISN wajib diisi supaya data bisa dicocokkan." };

  const sb = await supabaseServer();
  const { error } = await sb.from("tracer_submissions").insert({
    nisn: s(fd, "nisn"),
    nis: nz(fd, "nis"),
    nama,
    jurusan_kode: nz(fd, "jurusan_kode"),
    tahun_lulus: n(fd, "tahun_lulus"),
    no_hp: nz(fd, "no_hp"),
    email: nz(fd, "email"),
    jenis: s(fd, "jenis") as "Kerja" | "Kuliah" | "Wirausaha" | "Magang",
    instansi: nz(fd, "instansi"),
    posisi: nz(fd, "posisi"),
    bidang: nz(fd, "bidang"),
    kota: nz(fd, "kota"),
    provinsi: nz(fd, "provinsi"),
    tgl_mulai: nz(fd, "tgl_mulai"),
    gaji_range: s(fd, "gaji_range") || "-",
    catatan: nz(fd, "catatan"),
    status: "baru",
  });
  if (error) return { error: "Gagal mengirim: " + error.message };
  return { ok: "Terima kasih! Data Anda sudah terkirim dan menunggu verifikasi admin sekolah." };
}

export async function prosesTracer(fd: FormData) {
  const sesi = await sesiSaya();
  if (!sesi || sesi.profil.peran === "alumni") return;
  const id = s(fd, "id");
  const aksi = s(fd, "aksi"); // 'setujui' | 'tolak'
  const sb = await supabaseServer();
  const { data: t } = await sb.from("tracer_submissions").select("*").eq("id", id).single();
  if (!t) return;

  if (aksi === "tolak") {
    await sb
      .from("tracer_submissions")
      .update({ status: "ditolak", diproses_oleh: sesi.user.id, diproses_pada: new Date().toISOString() })
      .eq("id", id);
    await catatLog("tolak tracer", "tracer_submissions", id, t.nama);
    revalidatePath("/tracer-masuk");
    return;
  }

  // cocokkan dengan alumni yang sudah ada berdasarkan NISN
  let alumniId: string | null = null;
  if (t.nisn) {
    const { data: a } = await sb.from("alumni").select("id").eq("nisn", t.nisn).is("deleted_at", null).maybeSingle();
    alumniId = a?.id ?? null;
  }
  if (!alumniId) {
    const { data: j } = await sb.from("jurusan").select("id").eq("kode", t.jurusan_kode ?? "TKJ").maybeSingle();
    const { data: baru, error } = await sb
      .from("alumni")
      .insert({
        nisn: t.nisn ?? `T${Date.now()}`,
        nis: t.nis ?? (t.nisn ?? "").slice(-6),
        nama: t.nama,
        jurusan_id: j?.id ?? 1,
        tahun_lulus: t.tahun_lulus,
        no_hp: t.no_hp,
        email: t.email,
      })
      .select("id")
      .single();
    if (error) {
      redirect("/tracer-masuk?pesan=" + encodeURIComponent("Gagal membuat data alumni: " + error.message));
    }
    alumniId = baru!.id;
  } else {
    await sb.from("alumni").update({ no_hp: t.no_hp, email: t.email }).eq("id", alumniId);
  }

  if (t.instansi) {
    // tutup riwayat aktif sebelumnya supaya status terkini benar
    await sb
      .from("riwayat")
      .update({ tgl_selesai: t.tgl_mulai ?? new Date().toISOString().slice(0, 10) })
      .eq("alumni_id", alumniId)
      .is("deleted_at", null)
      .is("tgl_selesai", null);
    await sb.from("riwayat").insert({
      alumni_id: alumniId,
      jenis: t.jenis,
      instansi: t.instansi,
      posisi: t.posisi,
      bidang: t.bidang,
      kota: t.kota,
      provinsi: t.provinsi,
      tgl_mulai: t.tgl_mulai,
      gaji_range: t.gaji_range,
      sumber: "Tracer study",
    });
  }

  await sb
    .from("tracer_submissions")
    .update({ status: "disetujui", diproses_oleh: sesi.user.id, diproses_pada: new Date().toISOString() })
    .eq("id", id);
  await catatLog("setujui tracer", "tracer_submissions", id, t.nama);
  revalidatePath("/tracer-masuk");
  revalidatePath("/alumni");
  revalidatePath("/dashboard");
  redirect("/tracer-masuk?pesan=" + encodeURIComponent("Data " + t.nama + " sudah masuk ke database alumni."));
}
