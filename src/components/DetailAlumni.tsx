import Link from "next/link";
import { StatusPill, Empty, tgl, periode } from "@/components/Ui";
import FormRiwayat from "@/components/FormRiwayat";
import { hapusRiwayat } from "@/app/actions";
import type { AlumniAktif, Riwayat } from "@/lib/types";

export default function DetailAlumni({
  a,
  riwayat,
  fotoUrl,
  editable,
  admin,
}: {
  a: AlumniAktif;
  riwayat: Riwayat[];
  fotoUrl: string | null;
  editable: boolean;
  admin: boolean;
}) {
  return (
    <>
      <div className="card">
        <div className="rowflex" style={{ alignItems: "flex-start", marginBottom: 12 }}>
          {fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="avatar-lg" src={fotoUrl} alt={`Foto ${a.nama}`} />
          ) : (
            <div className="avatar-lg" style={{ display: "grid", placeItems: "center", fontSize: 26, fontWeight: 800 }}>
              {a.nama.slice(0, 1)}
            </div>
          )}
          <div style={{ minWidth: 200 }}>
            <h2 style={{ margin: 0 }}>{a.nama}</h2>
            <div className="muted small">
              {a.jurusan_kode} · Lulus {a.tahun_lulus ?? "—"} · NISN {a.nisn}
            </div>
            <div style={{ marginTop: 6 }}>
              <StatusPill status={a.status_terkini} />
            </div>
          </div>
          <div className="spacer" />
          {editable && (
            <Link className="btn" href={admin ? `/alumni/${a.id}/edit` : "/profil/edit"}>
              Edit data diri
            </Link>
          )}
        </div>

        <dl className="kv">
          <dt>NISN</dt>
          <dd className="tabular">{a.nisn}</dd>
          <dt>NIS</dt>
          <dd className="tabular">{a.nis}</dd>
          <dt>Jenis kelamin</dt>
          <dd>{a.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}</dd>
          <dt>Tempat, tgl lahir</dt>
          <dd>
            {a.tempat_lahir ?? "—"}
            {a.tanggal_lahir ? `, ${tgl(a.tanggal_lahir)}` : ""}
          </dd>
          <dt>Jurusan</dt>
          <dd>
            {a.jurusan_kode} — {a.jurusan_nama}
          </dd>
          <dt>Angkatan</dt>
          <dd>
            {a.tahun_masuk ?? "—"} – {a.tahun_lulus ?? "—"}
            {a.rombel ? ` (${a.rombel})` : ""}
          </dd>
          <dt>Kontak</dt>
          <dd>
            {a.no_hp ?? "—"} · {a.email ?? "—"}
          </dd>
          <dt>Alamat</dt>
          <dd>
            {a.alamat ?? "—"}
            {a.desa ? `, Ds. ${a.desa}` : ""}
            {a.kecamatan ? `, Kec. ${a.kecamatan}` : ""}
            {a.kabupaten ? `, ${a.kabupaten}` : ""}
          </dd>
        </dl>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="rowflex" style={{ marginBottom: 4 }}>
          <h3 style={{ margin: 0 }}>Riwayat kerja / studi</h3>
          <div className="spacer" />
          {editable && <FormRiwayat alumniId={a.id} />}
        </div>
        <div className="sub">Satu alumni bisa punya banyak riwayat. Yang tanpa tanggal selesai dianggap masih aktif.</div>

        {riwayat.length ? (
          <ul className="timeline">
            {riwayat.map((r) => (
              <li key={r.id}>
                <div className="t">
                  {r.posisi || "-"} — {r.instansi}
                </div>
                <div className="m">
                  {r.jenis}
                  {r.kota ? ` · ${r.kota}` : ""}
                  {r.provinsi ? `, ${r.provinsi}` : ""} · {periode(r.tgl_mulai, r.tgl_selesai)}
                  {r.bidang ? ` · ${r.bidang}` : ""}
                  {r.gaji_range && r.gaji_range !== "-" ? ` · ${r.gaji_range}` : ""}
                  {r.sumber ? ` · sumber: ${r.sumber}` : ""}
                </div>
                {editable && (
                  <form action={hapusRiwayat} style={{ marginTop: 5 }}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="alumni_id" value={a.id} />
                    <button className="btn btn-sm btn-danger">Hapus riwayat</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Belum ada riwayat tercatat.</Empty>
        )}
      </div>
    </>
  );
}
