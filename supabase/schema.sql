-- =====================================================================
-- SIMALUM — Sistem Informasi Alumni SMKN 1 Tambelangan
-- Skema Supabase / PostgreSQL  |  semua tabel memakai SOFT DELETE
-- Jalankan seluruh isi file ini di Supabase Studio > SQL Editor.
-- =====================================================================

-- ---------------------------------------------------------------- enum
do $$ begin
  create type peran        as enum ('admin','operator','alumni');
  create type jenis_kelamin as enum ('L','P');
  create type jenis_riwayat as enum ('Kerja','Kuliah','Wirausaha','Magang');
  create type status_tracer as enum ('baru','disetujui','ditolak');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------ jurusan
create table if not exists public.jurusan (
  id          smallserial primary key,
  kode        text not null unique,
  nama        text not null,
  urutan      smallint default 0,
  deleted_at  timestamptz
);

insert into public.jurusan (kode, nama, urutan) values
  ('TKJ' ,'Teknik Komputer & Jaringan', 1),
  ('TKRO','Teknik Kendaraan Ringan Otomotif', 2),
  ('TBSM','Teknik & Bisnis Sepeda Motor', 3),
  ('APHP','Agribisnis Pengolahan Hasil Pertanian', 4),
  ('ATPH','Agribisnis Tanaman Pangan & Hortikultura', 5)
on conflict (kode) do nothing;

-- ------------------------------------------------------------- alumni
create table if not exists public.alumni (
  id             uuid primary key default gen_random_uuid(),
  nisn           text not null,
  nis            text not null,
  nama           text not null,
  jenis_kelamin  jenis_kelamin not null default 'L',
  tempat_lahir   text,
  tanggal_lahir  date,
  jurusan_id     smallint not null references public.jurusan(id),
  rombel         text,
  tahun_masuk    smallint,
  tahun_lulus    smallint,
  no_hp          text,
  email          text,
  alamat         text,
  desa           text,
  kecamatan      text,
  kabupaten      text default 'Sampang',
  foto_path      text,
  catatan        text,
  user_id        uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,                       -- <<< SOFT DELETE
  deleted_by     uuid,
  deleted_reason text
);

-- NISN & NIS unik hanya di antara baris yang masih hidup
create unique index if not exists uq_alumni_nisn_aktif on public.alumni (nisn) where deleted_at is null;
create unique index if not exists uq_alumni_nis_aktif  on public.alumni (nis)  where deleted_at is null;
create index if not exists ix_alumni_hidup   on public.alumni (deleted_at);
create index if not exists ix_alumni_jurusan on public.alumni (jurusan_id);
create index if not exists ix_alumni_lulus   on public.alumni (tahun_lulus);
create index if not exists ix_alumni_nama    on public.alumni using gin (to_tsvector('simple', nama));

-- ------------------------------------------------------------ riwayat
create table if not exists public.riwayat (
  id          uuid primary key default gen_random_uuid(),
  alumni_id   uuid not null references public.alumni(id) on delete cascade,
  jenis       jenis_riwayat not null default 'Kerja',
  instansi    text not null,
  posisi      text,
  bidang      text,
  kota        text,
  provinsi    text,
  negara      text default 'Indonesia',
  tgl_mulai   date,
  tgl_selesai date,                                  -- null = masih aktif
  gaji_range  text default '-',
  linier      boolean,
  sumber      text default 'Input admin',
  bukti_path  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,                           -- <<< SOFT DELETE
  deleted_by  uuid
);
create index if not exists ix_riwayat_alumni on public.riwayat (alumni_id) where deleted_at is null;
create index if not exists ix_riwayat_aktif  on public.riwayat (tgl_selesai) where deleted_at is null;

-- ----------------------------------------------------------- profiles
-- 1 baris untuk tiap akun auth.users, menyimpan peran
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nama       text not null default '',
  peran      peran not null default 'alumni',
  alumni_id  uuid references public.alumni(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ------------------------------------------------- tracer study publik
create table if not exists public.tracer_submissions (
  id           uuid primary key default gen_random_uuid(),
  nisn         text,
  nis          text,
  nama         text not null,
  jurusan_kode text,
  tahun_lulus  smallint,
  no_hp        text,
  email        text,
  jenis        jenis_riwayat not null default 'Kerja',
  instansi     text,
  posisi       text,
  bidang       text,
  kota         text,
  provinsi     text,
  tgl_mulai    date,
  gaji_range   text default '-',
  catatan      text,
  status       status_tracer not null default 'baru',
  diproses_oleh uuid,
  diproses_pada timestamptz,
  created_at   timestamptz not null default now(),
  deleted_at   timestamptz                           -- <<< SOFT DELETE
);
create index if not exists ix_tracer_status on public.tracer_submissions (status) where deleted_at is null;

-- --------------------------------------------------------- jejak audit
create table if not exists public.activity_log (
  id         bigserial primary key,
  user_id    uuid,
  aktor      text,
  aksi       text not null,
  tabel      text not null,
  ref_id     text,
  keterangan text,
  created_at timestamptz not null default now()
);
create index if not exists ix_log_waktu on public.activity_log (created_at desc);

-- =====================================================================
-- Trigger updated_at
-- =====================================================================
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_alumni_updated on public.alumni;
create trigger trg_alumni_updated before update on public.alumni
  for each row execute function public.set_updated_at();
drop trigger if exists trg_riwayat_updated on public.riwayat;
create trigger trg_riwayat_updated before update on public.riwayat
  for each row execute function public.set_updated_at();

-- Setiap user baru otomatis punya baris profiles
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nama, peran, alumni_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nama', split_part(new.email,'@',1)),
    coalesce((new.raw_user_meta_data->>'peran')::peran, 'alumni'),
    nullif(new.raw_user_meta_data->>'alumni_id','')::uuid
  )
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- VIEW: alumni aktif + status terkini otomatis dari riwayat
-- =====================================================================
create or replace view public.v_alumni_aktif
with (security_invoker = true) as
select
  a.*,
  j.kode as jurusan_kode,
  j.nama as jurusan_nama,
  coalesce(rk.status_terkini, 'Belum / Mencari') as status_terkini,
  rk.instansi as instansi_terkini
from public.alumni a
join public.jurusan j on j.id = a.jurusan_id
left join lateral (
  select
    case r.jenis when 'Kerja' then 'Bekerja'
                 when 'Wirausaha' then 'Wirausaha'
                 when 'Kuliah' then 'Kuliah'
                 else 'Magang' end as status_terkini,
    r.instansi
  from public.riwayat r
  where r.alumni_id = a.id and r.deleted_at is null and r.tgl_selesai is null
  order by array_position(array['Kerja','Wirausaha','Kuliah','Magang']::jenis_riwayat[], r.jenis),
           r.tgl_mulai desc nulls last
  limit 1
) rk on true
where a.deleted_at is null;

-- =====================================================================
-- Helper peran (security definer supaya tidak rekursif ke RLS profiles)
-- =====================================================================
create or replace function public.peran_saya() returns peran
language sql stable security definer set search_path = public as $$
  select peran from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.peran_saya() in ('admin','operator'), false)
$$;

create or replace function public.alumni_saya() returns uuid
language sql stable security definer set search_path = public as $$
  select alumni_id from public.profiles where id = auth.uid()
$$;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.alumni             enable row level security;
alter table public.riwayat            enable row level security;
alter table public.profiles           enable row level security;
alter table public.jurusan            enable row level security;
alter table public.tracer_submissions enable row level security;
alter table public.activity_log       enable row level security;

-- jurusan: semua yang login boleh baca, admin boleh ubah
drop policy if exists jurusan_baca on public.jurusan;
create policy jurusan_baca on public.jurusan for select to authenticated using (true);
drop policy if exists jurusan_kelola on public.jurusan;
create policy jurusan_kelola on public.jurusan for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- alumni: admin lihat semua (termasuk kotak sampah); alumni hanya melihat
-- baris hidup, dan hanya boleh mengubah barisnya sendiri
drop policy if exists alumni_baca on public.alumni;
create policy alumni_baca on public.alumni for select to authenticated
  using (public.is_admin() or deleted_at is null);
drop policy if exists alumni_tambah on public.alumni;
create policy alumni_tambah on public.alumni for insert to authenticated
  with check (public.is_admin());
drop policy if exists alumni_ubah on public.alumni;
create policy alumni_ubah on public.alumni for update to authenticated
  using (public.is_admin() or id = public.alumni_saya())
  with check (public.is_admin() or id = public.alumni_saya());
-- tidak ada policy DELETE: penghapusan permanen ditutup, semua lewat soft delete

-- riwayat
drop policy if exists riwayat_baca on public.riwayat;
create policy riwayat_baca on public.riwayat for select to authenticated
  using (public.is_admin() or deleted_at is null);
drop policy if exists riwayat_tambah on public.riwayat;
create policy riwayat_tambah on public.riwayat for insert to authenticated
  with check (public.is_admin() or alumni_id = public.alumni_saya());
drop policy if exists riwayat_ubah on public.riwayat;
create policy riwayat_ubah on public.riwayat for update to authenticated
  using (public.is_admin() or alumni_id = public.alumni_saya())
  with check (public.is_admin() or alumni_id = public.alumni_saya());

-- profiles
drop policy if exists profil_baca on public.profiles;
create policy profil_baca on public.profiles for select to authenticated
  using (public.is_admin() or id = auth.uid());
drop policy if exists profil_ubah on public.profiles;
create policy profil_ubah on public.profiles for update to authenticated
  using (public.is_admin() or id = auth.uid())
  with check (public.is_admin() or id = auth.uid());

-- tracer study: SIAPA SAJA (tanpa login) boleh mengirim, hanya admin yang membaca
drop policy if exists tracer_kirim on public.tracer_submissions;
create policy tracer_kirim on public.tracer_submissions for insert to anon, authenticated
  with check (status = 'baru');
drop policy if exists tracer_baca on public.tracer_submissions;
create policy tracer_baca on public.tracer_submissions for select to authenticated
  using (public.is_admin());
drop policy if exists tracer_ubah on public.tracer_submissions;
create policy tracer_ubah on public.tracer_submissions for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- log
drop policy if exists log_baca on public.activity_log;
create policy log_baca on public.activity_log for select to authenticated
  using (public.is_admin());
drop policy if exists log_tulis on public.activity_log;
create policy log_tulis on public.activity_log for insert to authenticated with check (true);

-- =====================================================================
-- STORAGE: bucket berkas (foto profil, ijazah, bukti kerja)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('berkas','berkas', false)
on conflict (id) do nothing;

drop policy if exists berkas_baca on storage.objects;
create policy berkas_baca on storage.objects for select to authenticated
  using (bucket_id = 'berkas');
drop policy if exists berkas_unggah on storage.objects;
create policy berkas_unggah on storage.objects for insert to authenticated
  with check (bucket_id = 'berkas');
drop policy if exists berkas_ubah on storage.objects;
create policy berkas_ubah on storage.objects for update to authenticated
  using (bucket_id = 'berkas' and public.is_admin());

-- =====================================================================
-- SELESAI. Langkah berikutnya ada di README.md (buat akun admin pertama).
-- =====================================================================
