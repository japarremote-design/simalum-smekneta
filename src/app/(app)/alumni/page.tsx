import Link from "next/link";
import { supabaseServer, sesiSaya } from "@/lib/supabase/server";
import { StatusPill, Empty } from "@/components/Ui";
import { STATUS_LIST, type AlumniAktif, type Jurusan } from "@/lib/types";
import ExportButton from "./ExportButton";

export const dynamic = "force-dynamic";

const PER = 15;

export default async function AlumniPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const jur = sp.jur ?? "";
  const tahun = sp.tahun ?? "";
  const status = sp.status ?? "";
  const hal = Math.max(1, Number(sp.hal ?? 1) || 1);
  const pesan = sp.pesan ?? "";

  const sesi = await sesiSaya();
  const admin = sesi?.profil.peran !== "alumni";
  const sb = await supabaseServer();

  const { data: jurusanList } = await sb.from("jurusan").select("id, kode, nama, urutan").order("urutan");
  const { data: tahunRows } = await sb.from("v_alumni_aktif").select("tahun_lulus").limit(20000);
  const tahunList = Array.from(new Set((tahunRows ?? []).map((r) => r.tahun_lulus).filter(Boolean))).sort() as number[];

  let query = sb
    .from("v_alumni_aktif")
    .select("id, nisn, nis, nama, jenis_kelamin, no_hp, jurusan_kode, tahun_lulus, status_terkini, instansi_terkini", {
      count: "exact",
    });
  if (q) query = query.or(`nama.ilike.%${q}%,nisn.ilike.%${q}%,nis.ilike.%${q}%,instansi_terkini.ilike.%${q}%`);
  if (jur) query = query.eq("jurusan_kode", jur);
  if (tahun) query = query.eq("tahun_lulus", Number(tahun));
  if (status) query = query.eq("status_terkini", status);

  const { data, count } = await query.order("nama").range((hal - 1) * PER, hal * PER - 1);
  const rows = (data ?? []) as AlumniAktif[];
  const total = count ?? 0;
  const halTotal = Math.max(1, Math.ceil(total / PER));

  const link = (h: number) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (jur) p.set("jur", jur);
    if (tahun) p.set("tahun", tahun);
    if (status) p.set("status", status);
    p.set("hal", String(h));
    return "/alumni?" + p.toString();
  };

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Data alumni</h2>
      {pesan && <div className="alert ok">{pesan}</div>}

      <form className="toolbar" method="get">
        <input type="search" name="q" defaultValue={q} placeholder="Cari nama, NISN, NIS, tempat kerja…" />
        <select name="jur" defaultValue={jur}>
          <option value="">Semua jurusan</option>
          {(jurusanList as Jurusan[] | null)?.map((j) => (
            <option key={j.id} value={j.kode}>
              {j.kode}
            </option>
          ))}
        </select>
        <select name="tahun" defaultValue={tahun}>
          <option value="">Semua angkatan</option>
          {tahunList.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status}>
          <option value="">Semua status</option>
          {STATUS_LIST.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button className="btn">Terapkan</button>
        {admin && (
          <>
            <Link className="btn btn-primary" href="/alumni/baru">
              + Tambah alumni
            </Link>
            <ExportButton />
          </>
        )}
      </form>

      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>NISN</th>
              <th>NIS</th>
              <th>Nama</th>
              <th>Jurusan</th>
              <th>Lulus</th>
              <th>Status</th>
              <th>Tempat kini</th>
              <th style={{ textAlign: "right" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((a) => (
                <tr key={a.id}>
                  <td className="tabular">{a.nisn}</td>
                  <td className="tabular">{a.nis}</td>
                  <td>
                    <b>{a.nama}</b>
                    <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                      {a.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}
                      {a.no_hp ? " · " + a.no_hp : ""}
                    </div>
                  </td>
                  <td>{a.jurusan_kode}</td>
                  <td className="tabular">{a.tahun_lulus ?? "—"}</td>
                  <td>
                    <StatusPill status={a.status_terkini} />
                  </td>
                  <td>{a.instansi_terkini ?? "—"}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <Link className="btn btn-sm" href={`/alumni/${a.id}`}>
                      Detail
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8}>
                  <Empty>Tidak ada data yang cocok dengan filter.</Empty>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <span>
          {total} data · halaman {hal} dari {halTotal}
        </span>
        {hal > 1 ? (
          <Link className="btn btn-sm" href={link(hal - 1)}>
            ‹ Sebelumnya
          </Link>
        ) : (
          <button className="btn btn-sm" disabled>
            ‹ Sebelumnya
          </button>
        )}
        {hal < halTotal ? (
          <Link className="btn btn-sm" href={link(hal + 1)}>
            Berikutnya ›
          </Link>
        ) : (
          <button className="btn btn-sm" disabled>
            Berikutnya ›
          </button>
        )}
      </div>
    </>
  );
}
