"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer, supabaseAdmin, sesiSaya, catatLog } from "@/lib/supabase/server";

const DOMAIN = process.env.NEXT_PUBLIC_ALUMNI_EMAIL_DOMAIN || "alumni.smkn1tambelangan.sch.id";

function parseCSV(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === "," || c === ";") {
      row.push(cell);
      cell = "";
    } else if (c === "\n") {
      row.push(cell);
      out.push(row);
      row = [];
      cell = "";
    } else if (c !== "\r") cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    out.push(row);
  }
  return out.filter((r) => r.some((c) => c.trim() !== ""));
}

export async function importAlumni(_prev: unknown, fd: FormData) {
  const sesi = await sesiSaya();
  if (!sesi || sesi.profil.peran === "alumni") return { error: "Tidak punya akses." };

  const file = fd.get("berkas");
  const teks = String(fd.get("teks") ?? "");
  let isi = teks;
  if (file instanceof File && file.size > 0) isi = await file.text();
  if (!isi.trim()) return { error: "Pilih file CSV atau tempel isinya dulu." };

  const rows = parseCSV(isi.replace(/^﻿/, ""));
  if (rows.length < 2) return { error: "File tidak berisi baris data." };

  const head = rows[0].map((h) => h.trim().toLowerCase());
  const need = ["nisn", "nama"];
  for (const k of need) if (!head.includes(k)) return { error: `Kolom wajib "${k}" tidak ditemukan di baris pertama.` };

  const sb = await supabaseServer();
  const { data: jurusanRows } = await sb.from("jurusan").select("id, kode");
  const jurMap = new Map((jurusanRows ?? []).map((j) => [j.kode.toUpperCase(), j.id]));

  const { data: adaRows } = await sb.from("alumni").select("nisn").is("deleted_at", null).limit(20000);
  const sudahAda = new Set((adaRows ?? []).map((r) => r.nisn));

  let masuk = 0;
  const dilewati: string[] = [];
  const buatAkun: { id: string; nisn: string; nama: string }[] = [];

  for (const r of rows.slice(1)) {
    const g = (k: string) => {
      const i = head.indexOf(k);
      return i < 0 ? "" : String(r[i] ?? "").trim();
    };
    const nisn = g("nisn");
    const nama = g("nama");
    if (!nisn || !nama) {
      dilewati.push(`${nama || "(tanpa nama)"} — NISN/nama kosong`);
      continue;
    }
    if (sudahAda.has(nisn)) {
      dilewati.push(`${nama} — NISN ${nisn} sudah ada`);
      continue;
    }

    const kode = (g("jurusan_kode") || g("jurusan")).toUpperCase();
    const { data: baru, error } = await sb
      .from("alumni")
      .insert({
        nisn,
        nis: g("nis") || nisn.slice(-6),
        nama,
        jenis_kelamin: g("jenis_kelamin").toUpperCase().startsWith("P") ? "P" : "L",
        tempat_lahir: g("tempat_lahir") || null,
        tanggal_lahir: g("tanggal_lahir") || null,
        jurusan_id: jurMap.get(kode) ?? jurMap.values().next().value ?? 1,
        tahun_masuk: Number(g("tahun_masuk")) || null,
        tahun_lulus: Number(g("tahun_lulus")) || null,
        no_hp: g("no_hp") || null,
        email: g("email") || null,
        alamat: g("alamat") || null,
      })
      .select("id")
      .single();

    if (error || !baru) {
      dilewati.push(`${nama} — ${error?.message ?? "gagal disimpan"}`);
      continue;
    }
    sudahAda.add(nisn);
    masuk++;
    buatAkun.push({ id: baru.id, nisn, nama });

    const instansi = g("instansi_terkini") || g("instansi");
    if (instansi) {
      const st = g("status_terkini") || g("status");
      await sb.from("riwayat").insert({
        alumni_id: baru.id,
        jenis: st === "Kuliah" ? "Kuliah" : st === "Wirausaha" ? "Wirausaha" : "Kerja",
        instansi,
        posisi: g("posisi") || null,
        kota: g("kota") || null,
        provinsi: g("provinsi") || null,
        tgl_mulai: g("tahun_lulus") ? `${g("tahun_lulus")}-07-01` : null,
        sumber: "Import CSV",
      });
    }
  }

  // buatkan akun login untuk yang baru masuk (butuh service role key)
  let catatanAkun = `${buatAkun.length} akun login dibuat.`;
  try {
    const admin = supabaseAdmin();
    for (const u of buatAkun) {
      const { data: akun, error } = await admin.auth.admin.createUser({
        email: `${u.nisn}@${DOMAIN}`,
        password: u.nisn,
        email_confirm: true,
        user_metadata: { nama: u.nama, peran: "alumni", alumni_id: u.id },
      });
      if (!error && akun.user) {
        await admin.from("profiles").upsert({ id: akun.user.id, nama: u.nama, peran: "alumni", alumni_id: u.id });
        await admin.from("alumni").update({ user_id: akun.user.id }).eq("id", u.id);
      }
    }
  } catch {
    catatanAkun = "Akun login belum dibuat — isi SUPABASE_SERVICE_ROLE_KEY di .env.local lalu import ulang.";
  }

  await catatLog("import", "alumni", null, `${masuk} masuk, ${dilewati.length} dilewati`);
  revalidatePath("/alumni");
  revalidatePath("/dashboard");

  return {
    ok: `${masuk} data alumni berhasil diimport. ${catatanAkun}`,
    dilewati,
  };
}
