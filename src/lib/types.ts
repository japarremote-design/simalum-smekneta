export type Peran = "admin" | "operator" | "alumni";
export type JenisRiwayat = "Kerja" | "Kuliah" | "Wirausaha" | "Magang";
export type StatusTerkini = "Bekerja" | "Kuliah" | "Wirausaha" | "Magang" | "Belum / Mencari";

export const STATUS_LIST: StatusTerkini[] = ["Bekerja", "Kuliah", "Wirausaha", "Belum / Mencari"];
export const JENIS_LIST: JenisRiwayat[] = ["Kerja", "Kuliah", "Wirausaha", "Magang"];
export const GAJI_LIST = ["-", "< 2 jt", "2 – 3,5 jt", "3,5 – 5 jt", "> 5 jt"];

export const STATUS_COLOR: Record<string, string> = {
  Bekerja: "var(--s1)",
  Kuliah: "var(--s2)",
  Wirausaha: "var(--s3)",
  "Belum / Mencari": "var(--s4)",
  Magang: "var(--s5)",
};

export type Jurusan = { id: number; kode: string; nama: string; urutan: number | null };

export type Alumni = {
  id: string;
  nisn: string;
  nis: string;
  nama: string;
  jenis_kelamin: "L" | "P";
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  jurusan_id: number;
  rombel: string | null;
  tahun_masuk: number | null;
  tahun_lulus: number | null;
  no_hp: string | null;
  email: string | null;
  alamat: string | null;
  desa: string | null;
  kecamatan: string | null;
  kabupaten: string | null;
  foto_path: string | null;
  catatan: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
  deleted_reason: string | null;
};

export type AlumniAktif = Alumni & {
  jurusan_kode: string;
  jurusan_nama: string;
  status_terkini: StatusTerkini;
  instansi_terkini: string | null;
};

export type Riwayat = {
  id: string;
  alumni_id: string;
  jenis: JenisRiwayat;
  instansi: string;
  posisi: string | null;
  bidang: string | null;
  kota: string | null;
  provinsi: string | null;
  negara: string | null;
  tgl_mulai: string | null;
  tgl_selesai: string | null;
  gaji_range: string | null;
  linier: boolean | null;
  sumber: string | null;
  bukti_path: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
};

export type Profil = {
  id: string;
  nama: string;
  peran: Peran;
  alumni_id: string | null;
  created_at: string;
  deleted_at: string | null;
};

export type TracerSubmission = {
  id: string;
  nisn: string | null;
  nis: string | null;
  nama: string;
  jurusan_kode: string | null;
  tahun_lulus: number | null;
  no_hp: string | null;
  email: string | null;
  jenis: JenisRiwayat;
  instansi: string | null;
  posisi: string | null;
  bidang: string | null;
  kota: string | null;
  provinsi: string | null;
  tgl_mulai: string | null;
  gaji_range: string | null;
  catatan: string | null;
  status: "baru" | "disetujui" | "ditolak";
  created_at: string;
  deleted_at: string | null;
};

export type LogRow = {
  id: number;
  aktor: string | null;
  aksi: string;
  tabel: string;
  ref_id: string | null;
  keterangan: string | null;
  created_at: string;
};
