/**
 * Mengisi database dengan data alumni CONTOH supaya aplikasi bisa langsung dicoba.
 * Jalankan: npm run seed
 * Butuh SUPABASE_SERVICE_ROLE_KEY di .env.local (script ini melewati RLS).
 *
 * Hapus data contoh nanti lewat SQL Editor:
 *   delete from public.riwayat where sumber = 'Data contoh';
 *   delete from public.alumni where catatan = 'Data contoh';
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// baca .env.local sederhana
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

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DOMAIN = process.env.NEXT_PUBLIC_ALUMNI_EMAIL_DOMAIN || "alumni.smkn1tambelangan.sch.id";
if (!URL || !KEY) {
  console.error("✗ NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di .env.local");
  process.exit(1);
}
const sb = createClient(URL, KEY, { auth: { persistSession: false } });

const D = ["Abdul", "Ahmad", "Bagus", "Dimas", "Fauzan", "Hendra", "Imron", "Khoirul", "Lukman", "Moh.", "Rizal", "Samsul", "Taufik", "Wahyu", "Yusuf", "Faisal", "Hasan", "Rendi"];
const B = ["Aisyah", "Dewi", "Fatimah", "Halimah", "Indah", "Kartika", "Lailatul", "Maulida", "Nabila", "Putri", "Rahma", "Siti", "Umi", "Wardah", "Yuliana", "Zahra", "Firda", "Novi"];
const LD = ["Hidayat", "Maulana", "Firmansyah", "Ramadhan", "Saputra", "Wijaya", "Kurniawan", "Pratama", "Rosidi", "Basri", "Setiawan", "Halim", "Efendi", "Mubarok"];
const LB = ["Anggraini", "Safitri", "Lestari", "Ningsih", "Susanti", "Aminah", "Hasanah", "Fitriani", "Wulandari", "Rahmawati", "Oktaviani", "Maghfiroh"];
const PERUSAHAAN = [
  ["PT Maspion Group", "Sidoarjo", "Jawa Timur", "Operator Produksi"],
  ["PT Astra Honda Motor", "Jakarta Utara", "DKI Jakarta", "Teknisi Perakitan"],
  ["Bengkel Jaya Motor", "Sampang", "Jawa Timur", "Mekanik"],
  ["PT Indofood Sukses Makmur", "Surabaya", "Jawa Timur", "Staf QC"],
  ["CV Berkah Digital", "Sampang", "Jawa Timur", "Teknisi Jaringan"],
  ["PT Telkom Akses", "Pamekasan", "Jawa Timur", "Teknisi FTTH"],
  ["Alfamart DC Madura", "Bangkalan", "Jawa Timur", "Staf Gudang"],
  ["PT Sinar Sosro", "Mojokerto", "Jawa Timur", "Operator Mesin"],
  ["PT Pelindo Marine", "Surabaya", "Jawa Timur", "Staf IT Support"],
  ["PT Sampoerna", "Pasuruan", "Jawa Timur", "Operator Produksi"],
];
const KAMPUS = [
  ["Universitas Trunojoyo Madura", "Bangkalan", "Jawa Timur", "Teknik Informatika"],
  ["Politeknik Negeri Malang", "Malang", "Jawa Timur", "Teknik Mesin"],
  ["UIN Sunan Ampel", "Surabaya", "Jawa Timur", "Ekonomi Syariah"],
  ["Universitas Negeri Surabaya", "Surabaya", "Jawa Timur", "Pendidikan Teknik"],
];
const USAHA = [
  ["Servis HP & Laptop Barokah", "Tambelangan", "Jawa Timur", "Pemilik"],
  ["Ternak Ayam Petelur Mandiri", "Sampang", "Jawa Timur", "Pemilik"],
  ["Kedai Kopi Madura Asli", "Sampang", "Jawa Timur", "Pemilik"],
];

let rs = 20260820;
const rnd = () => (rs = (rs * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pad = (x, n = 2) => String(x).padStart(n, "0");

const JUMLAH = Number(process.argv[2] || 60);

async function main() {
  const { data: jurusan, error: eJur } = await sb.from("jurusan").select("id, kode");
  if (eJur) throw eJur;
  if (!jurusan?.length) throw new Error("Tabel jurusan kosong — jalankan supabase/schema.sql dulu.");

  const dipakai = new Set();
  let masuk = 0;

  for (let i = 0; i < JUMLAH; i++) {
    const jk = rnd() < 0.48 ? "L" : "P";
    let nama;
    do {
      nama = jk === "L" ? `${pick(D)} ${pick(LD)}` : `${pick(B)} ${pick(LB)}`;
    } while (dipakai.has(nama));
    dipakai.add(nama);

    const lulus = ri(2019, 2025);
    const jur = pick(jurusan);
    const nisn = `${ri(30, 49)}${ri(1000000, 9999999)}`;

    const { data: a, error } = await sb
      .from("alumni")
      .insert({
        nisn,
        nis: `${String(lulus - 3).slice(2)}.${pad(i + 1, 3)}`,
        nama,
        jenis_kelamin: jk,
        tempat_lahir: pick(["Sampang", "Tambelangan", "Bangkalan", "Pamekasan", "Surabaya"]),
        tanggal_lahir: `${lulus - 18}-${pad(ri(1, 12))}-${pad(ri(1, 28))}`,
        jurusan_id: jur.id,
        rombel: `XII ${jur.kode} ${ri(1, 2)}`,
        tahun_masuk: lulus - 3,
        tahun_lulus: lulus,
        no_hp: `0857${ri(10000000, 99999999)}`,
        email: `${nama.toLowerCase().replace(/[^a-z]+/g, ".")}@gmail.com`,
        alamat: `Dusun ${pick(["Krajan", "Tengah", "Barat", "Timur"])}, Desa ${pick(["Tambelangan", "Barung", "Samaran", "Bringin"])}`,
        kecamatan: "Tambelangan",
        kabupaten: "Sampang",
        catatan: "Data contoh",
      })
      .select("id")
      .single();
    if (error) {
      console.warn("  lewati", nama, "-", error.message);
      continue;
    }

    const roll = rnd();
    const riwayat = [];
    if (roll < 0.56) {
      const p = pick(PERUSAHAAN);
      riwayat.push({
        jenis: "Kerja",
        instansi: p[0],
        posisi: p[3],
        kota: p[1],
        provinsi: p[2],
        tgl_mulai: `${lulus}-${pad(ri(1, 10))}-01`,
        gaji_range: pick(["< 2 jt", "2 – 3,5 jt", "3,5 – 5 jt"]),
      });
    } else if (roll < 0.76) {
      const k = pick(KAMPUS);
      riwayat.push({ jenis: "Kuliah", instansi: k[0], posisi: "Mahasiswa", bidang: k[3], kota: k[1], provinsi: k[2], tgl_mulai: `${lulus}-08-01` });
    } else if (roll < 0.88) {
      const u = pick(USAHA);
      riwayat.push({ jenis: "Wirausaha", instansi: u[0], posisi: u[3], kota: u[1], provinsi: u[2], tgl_mulai: `${lulus}-${pad(ri(1, 12))}-01` });
    }
    if (riwayat.length) {
      await sb.from("riwayat").insert(riwayat.map((r) => ({ ...r, alumni_id: a.id, sumber: "Data contoh" })));
    }

    const { data: akun, error: eAkun } = await sb.auth.admin.createUser({
      email: `${nisn}@${DOMAIN}`,
      password: nisn,
      email_confirm: true,
      user_metadata: { nama, peran: "alumni", alumni_id: a.id },
    });
    if (!eAkun && akun?.user) {
      await sb.from("profiles").upsert({ id: akun.user.id, nama, peran: "alumni", alumni_id: a.id });
      await sb.from("alumni").update({ user_id: akun.user.id }).eq("id", a.id);
    }

    masuk++;
    if (masuk % 10 === 0) console.log(`  ${masuk} alumni…`);
  }

  console.log(`\n✓ Selesai. ${masuk} alumni contoh dimasukkan.`);
  console.log("  Login alumni: username & password = NISN masing-masing (lihat tabel alumni).");
}

main().catch((e) => {
  console.error("✗ Gagal:", e.message);
  process.exit(1);
});
