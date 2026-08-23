# SIMALUM — Sistem Informasi Alumni SMKN 1 Tambelangan

Database alumni berbasis web: data diri, riwayat kerja & studi, tracer study, upload berkas, dan laporan keterserapan lulusan siap cetak.
Dibangun dengan **Next.js 15 (App Router) + Supabase (PostgreSQL)**. **Semua penghapusan bersifat soft delete** — data tidak pernah hilang dari database.

---

## Fitur

| Untuk admin / guru BK | Untuk alumni | Untuk publik |
|---|---|---|
| Dashboard statistik & grafik | Login dengan NISN | Form tracer study tanpa login |
| CRUD data alumni + riwayat kerja | Update data diri sendiri | — |
| Kotak sampah & pemulihan data | Tambah riwayat kerja/kuliah/usaha | — |
| Verifikasi kiriman tracer study | Upload foto & bukti kerja | — |
| Import & export CSV | Direktori alumni | Preview link bergambar |
| Laporan cetak / PDF per angkatan | Statistik sekolah | Tombol WhatsApp ke admin |
| Jejak audit (siapa mengubah apa) | | |

### Soft delete — cara kerjanya

Tidak ada satu pun `DELETE` di aplikasi ini. Saat admin menghapus alumni:

1. Kolom `deleted_at`, `deleted_by`, dan `deleted_reason` di baris alumni diisi.
2. Riwayat kerja dan akun loginnya ikut ditandai terhapus.
3. Barisnya hilang dari daftar normal, tapi muncul di menu **Kotak sampah** dan bisa dipulihkan kapan saja.
4. Di level database, policy `DELETE` sengaja **tidak dibuat**, jadi penghapusan permanen tertutup bahkan lewat API.
5. `UNIQUE` untuk NISN dipasang sebagai *partial index* `where deleted_at is null`, sehingga NISN yang sudah dihapus tidak memblokir pendaftaran baru — tapi sistem menolak memulihkan data kalau NISN-nya sudah dipakai baris aktif lain.

---

## Cara memasang (± 15 menit)

### 1. Siapkan proyek Supabase

1. Daftar gratis di <https://supabase.com> → **New project**. Pilih region **Southeast Asia (Singapore)** — WAJIB, jangan pilih yang lain. Lihat catatan lokasi server di bawah.
2. Simpan password database yang muncul.
3. Buka **SQL Editor** → **New query** → salin seluruh isi `supabase/schema.sql` → **Run**.
   Ini membuat semua tabel, view, trigger, policy keamanan (RLS), dan bucket penyimpanan berkas.
4. Buka **Authentication → Providers → Email**, lalu **matikan** "Confirm email" (alumni login dengan NISN, bukan email asli).

### 2. Siapkan aplikasi

```bash
npm install
cp .env.local.example .env.local
```

Isi `.env.local` dari **Supabase → Project Settings → API**:

| Variabel | Diambil dari |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key — **rahasia**, jangan dibagikan |
| `NEXT_PUBLIC_ALUMNI_EMAIL_DOMAIN` | biarkan apa adanya |
| `NEXT_PUBLIC_SITE_URL` | alamat aplikasi setelah online, mis. `https://alumni-smkn1tambelangan.vercel.app` — dipakai untuk preview link WhatsApp |

### 3. Buat akun admin pertama

```bash
node scripts/buat-admin.mjs admin@smkn1tambelangan.sch.id rahasia123 "Admin Sekolah"
```

### 4. (Opsional) Isi data contoh

```bash
npm run seed        # 60 alumni contoh + akun loginnya
npm run seed 200    # atau tentukan jumlahnya
```

### 5. Jalankan

```bash
npm run dev
```

Buka <http://localhost:3000>.

- **Admin** → tab "Login Admin", pakai email & password dari langkah 3.
- **Alumni** → tab "Login Alumni", username & password awal = **NISN**.
- **Tracer study publik** → <http://localhost:3000/tracer> (tidak perlu login).

---

## Deploy ke Vercel (gratis)

1. Push folder ini ke GitHub.
2. Buka <https://vercel.com> → **Add New → Project** → pilih repositorinya.
3. Di **Environment Variables**, isi keempat variabel yang sama seperti `.env.local`.
4. **Deploy**. Aplikasi langsung online, misalnya `https://alumni-smkn1tambelangan.vercel.app`.
   Setelah tahu alamat pastinya, isi `NEXT_PUBLIC_SITE_URL` dengan alamat itu lalu deploy ulang sekali — supaya preview link di WhatsApp memakai alamat yang benar.
5. Sebarkan link `/tracer` ke grup WhatsApp alumni — kiriman mereka masuk ke menu **Tracer masuk** untuk diverifikasi.

Domain sekolah sendiri bisa dipasang lewat **Vercel → Settings → Domains**.

---

## Lokasi server — jangan sampai salah

Vercel secara bawaan menjalankan aplikasi di **Washington D.C. (iad1)**. Kalau database ada di Singapura sementara aplikasinya di Amerika, setiap klik harus bolak-balik menyeberangi Samudra Pasifik — bisa menambah 0,5–1 detik per halaman.

Karena itu file `vercel.json` di proyek ini sudah mengunci region ke **Singapura (`sin1`)**:

```json
{ "regions": ["sin1"] }
```

Pastikan dua-duanya Singapura:

| Bagian | Setelan yang benar | Cara mengecek |
|---|---|---|
| Database | Southeast Asia (Singapore) | Supabase → Project Settings → General → Region |
| Aplikasi | Singapore, `sin1` | Vercel → Project → Settings → Functions → Function Region |

Region Supabase **tidak bisa diubah** setelah proyek dibuat — kalau terlanjur memilih Amerika, buat proyek baru di Singapura lalu jalankan `schema.sql` di sana.

---

## Sudah siap dibagikan & dipasang di HP

**Preview link (Open Graph).** Saat alamat aplikasi dikirim ke grup WhatsApp / Facebook, yang muncul bukan link polos tapi kartu bergambar dengan logo, nama sekolah, dan keterangan singkat. Gambarnya dibuat otomatis oleh `src/app/opengraph-image.tsx` — tidak perlu upload gambar manual. Untuk mengubah tampilannya, edit file itu.

**Pasang di HP (PWA).** Aplikasi bisa dipasang seperti aplikasi biasa:

- **Android/Chrome**: muncul tawaran "Pasang SIMALUM di HP" di bagian bawah layar, atau lewat menu ⋮ → *Install app*.
- **iPhone/Safari**: ketuk ikon Bagikan → *Tambahkan ke Layar Utama* (Apple tidak menyediakan tombol otomatis).

Setelah dipasang, aplikasi punya ikon sendiri di layar utama, terbuka tanpa alamat browser, dan kalau tidak ada sinyal menampilkan halaman "Tidak ada koneksi" yang rapi. Diatur di `src/app/manifest.ts` dan `public/sw.js`.

**Menu bawah untuk HP.** Di layar kecil, menu utama pindah ke bawah layar supaya terjangkau jempol; menu selengkapnya ada di tombol "Lainnya". Di layar besar otomatis kembali jadi sidebar kiri.

**Tombol WhatsApp.** Tombol hijau mengambang di setiap halaman, langsung membuka chat ke nomor admin dengan pesan pembuka yang sudah terisi. Berkedip halus untuk menarik perhatian, dan otomatis berhenti berkedip kalau pengguna mengaktifkan "kurangi animasi" di HP-nya.

---

## Mengganti identitas (logo, nomor WA, nama pengembang)

Semua ada di **satu file**: `src/lib/situs.ts`

```ts
whatsapp: {
  tampil: "0838-5322-3801",        // yang ditampilkan
  internasional: "6283853223801",  // untuk link wa.me — pakai 62, bukan 0
  pesanAwal: "Halo Admin SIMALUM…",
},
pengembang: { nama: "Qfaz Digital", url: "https://qfazdigital.my.id/" },
```

**Logo sekolah**: logo asli SMKN 1 Tambelangan sudah terpasang di `public/logo.png` (latar hitamnya sudah dibersihkan jadi transparan, jadi tampil rapi di mode terang maupun gelap).

Kalau suatu saat logonya berubah, tidak perlu bikin ikon satu per satu — ada skripnya:

```bash
pip install pillow numpy scipy
python3 scripts/buat-ikon.py logo-baru.png

# kalau logo barunya masih berlatar hitam/putih (foto atau JPG):
python3 scripts/buat-ikon.py logo-baru.jpg --bersihkan
```

Sekali jalan, skrip itu membuat ulang semuanya: `logo.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `icon-maskable-512.png` (dengan jarak tepi ekstra supaya tidak terpotong saat Android memotongnya jadi bulat), `favicon.ico`, dan logo kecil yang tertanam di gambar preview Open Graph.

---

## Alur kerja harian

```
Alumni isi /tracer  →  masuk ke "Tracer masuk"  →  admin klik "Setujui"
                                                        │
                        cocokkan NISN ────────┬─────────┘
                                              │
                    ada  → riwayat baru ditambahkan, yang lama ditutup otomatis
                    belum → data alumni baru dibuatkan
```

Status alumni (**Bekerja / Kuliah / Wirausaha / Belum**) tidak diketik manual — dihitung otomatis oleh view `v_alumni_aktif` dari riwayat yang belum punya tanggal selesai.

---

## Format CSV untuk import

Baris pertama wajib berisi nama kolom. Wajib ada `nisn` dan `nama`:

```csv
nisn,nis,nama,jenis_kelamin,jurusan_kode,tahun_masuk,tahun_lulus,no_hp,email,status,instansi_terkini
3512345678,22.001,Ahmad Hidayat,L,TKJ,2022,2025,085712345678,ahmad@gmail.com,Bekerja,PT Telkom Akses
```

Kolom opsional lain: `alamat`, `tempat_lahir`, `tanggal_lahir`, `posisi`, `kota`, `provinsi`.
Baris dengan NISN yang sudah ada akan **dilewati**, bukan ditimpa. Setiap alumni yang masuk otomatis dibuatkan akun login.

---

## Struktur folder

```
vercel.json                  kunci region Singapura + header keamanan
supabase/schema.sql          skema database + RLS + storage (jalankan sekali)
scripts/buat-admin.mjs       membuat akun admin
scripts/buat-ikon.py         buat ulang semua ikon dari logo sekolah
scripts/seed.mjs             mengisi data contoh
src/middleware.ts            penjaga sesi & halaman terproteksi
src/app/actions.ts           semua aksi tulis (login, CRUD, soft delete, tracer)
src/app/login                halaman login admin & alumni
src/app/tracer               form tracer study publik
src/app/(app)/…              halaman setelah login (dashboard, alumni, sampah, laporan, dll)
src/lib/situs.ts             identitas sekolah, nomor WhatsApp, pengembang — ubah di sini
src/app/manifest.ts          pengaturan "pasang di HP"
src/app/opengraph-image.tsx  gambar preview saat link dibagikan
public/logo.png              logo sekolah (latar sudah transparan)
public/sw.js                 service worker (mode offline)
src/components/              komponen tampilan: grafik, form, menu bawah, tombol WA
```

---

## Keamanan

- **Row Level Security aktif di semua tabel.** Alumni hanya bisa membaca data hidup dan mengubah barisnya sendiri; data di kotak sampah hanya terlihat oleh admin.
- Berkas (foto, ijazah, bukti kerja) disimpan di bucket **privat**; tautannya dibuat sementara (1 jam) saat halaman dibuka.
- `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di sisi server untuk membuat akun — jangan pernah ditulis dengan awalan `NEXT_PUBLIC_`.
- Nomor HP dan alamat tidak ditampilkan di direktori antar-alumni.

## Perawatan

- **Ganti password admin**: Supabase → Authentication → Users → pilih user → Reset password.
- **Reset password alumni**: Supabase → Authentication → Users → cari `<nisn>@alumni.…` → Reset.
- **Tambah jurusan baru**: `insert into public.jurusan (kode, nama, urutan) values ('DKV','Desain Komunikasi Visual', 6);`
- **Backup**: Supabase → Database → Backups (otomatis harian), atau export CSV berkala dari menu Data alumni.
