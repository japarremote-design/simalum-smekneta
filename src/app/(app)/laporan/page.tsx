import { redirect } from "next/navigation";
import { supabaseServer, sesiSaya } from "@/lib/supabase/server";
import { HBar, SBar, Legend } from "@/components/Charts";
import { Card, Empty } from "@/components/Ui";
import { STATUS_COLOR, STATUS_LIST, type AlumniAktif } from "@/lib/types";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const sesi = await sesiSaya();
  if (!sesi) redirect("/login");
  if (sesi.profil.peran === "alumni") redirect("/profil");

  const tahun = sp.tahun ?? "";
  const sb = await supabaseServer();

  let q = sb
    .from("v_alumni_aktif")
    .select("id, nama, nisn, jurusan_kode, tahun_lulus, status_terkini, instansi_terkini");
  if (tahun) q = q.eq("tahun_lulus", Number(tahun));
  const { data } = await q.order("jurusan_kode").order("nama").limit(20000);
  const A = (data ?? []) as AlumniAktif[];

  const { data: tahunRows } = await sb.from("v_alumni_aktif").select("tahun_lulus").limit(20000);
  const tahunList = Array.from(new Set((tahunRows ?? []).map((r) => r.tahun_lulus).filter(Boolean))).sort() as number[];

  const jurusanKode = Array.from(new Set(A.map((a) => a.jurusan_kode))).sort();
  const hitung = (st: string) => A.filter((a) => a.status_terkini === st).length;
  const series = STATUS_LIST.map((st) => ({
    name: st,
    color: STATUS_COLOR[st],
    vals: jurusanKode.map((j) => A.filter((a) => a.jurusan_kode === j && a.status_terkini === st).length),
  }));
  const terserap = hitung("Bekerja") + hitung("Wirausaha") + hitung("Kuliah");
  const pct = A.length ? Math.round((terserap / A.length) * 100) : 0;

  return (
    <>
      <div className="rowflex no-print" style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Laporan keterserapan lulusan</h2>
        <div className="spacer" />
        <form method="get" className="rowflex">
          <select name="tahun" defaultValue={tahun}>
            <option value="">Semua angkatan</option>
            {tahunList.map((t) => (
              <option key={t} value={t}>
                Lulusan {t}
              </option>
            ))}
          </select>
          <button className="btn">Terapkan</button>
        </form>
        <PrintButton />
      </div>

      <div className="report-head center">
        <div style={{ fontWeight: 800, fontSize: 16 }}>LAPORAN KETERSERAPAN LULUSAN</div>
        <div style={{ fontWeight: 700 }}>SMK NEGERI 1 TAMBELANGAN — KABUPATEN SAMPANG</div>
        <div className="small muted">
          {tahun ? `Lulusan tahun ${tahun}` : "Seluruh angkatan"} · dicetak{" "}
          {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
        </div>
        <hr />
      </div>

      <div className="tiles">
        <div className="tile">
          <div className="lab">Jumlah lulusan</div>
          <div className="val tabular">{A.length}</div>
        </div>
        <div className="tile">
          <div className="lab">Bekerja</div>
          <div className="val tabular" style={{ color: "var(--s1)" }}>
            {hitung("Bekerja")}
          </div>
        </div>
        <div className="tile">
          <div className="lab">Kuliah</div>
          <div className="val tabular" style={{ color: "var(--s2)" }}>
            {hitung("Kuliah")}
          </div>
        </div>
        <div className="tile">
          <div className="lab">Wirausaha</div>
          <div className="val tabular" style={{ color: "var(--s3)" }}>
            {hitung("Wirausaha")}
          </div>
        </div>
        <div className="tile">
          <div className="lab">Keterserapan</div>
          <div className="val tabular">{pct}%</div>
        </div>
      </div>

      {A.length === 0 ? (
        <Card>
          <Empty>Belum ada data untuk angkatan ini.</Empty>
        </Card>
      ) : (
        <>
          <Card title="Rekap status per jurusan" style={{ marginBottom: 12 }}>
            <SBar cats={jurusanKode} series={series} />
            <Legend series={series} />
          </Card>

          <Card title="Ringkasan status" style={{ marginBottom: 12 }}>
            <HBar data={STATUS_LIST.map((st) => ({ k: st, v: hitung(st), c: STATUS_COLOR[st] }))} />
          </Card>

          <Card title="Rekap angka per jurusan" style={{ marginBottom: 12 }}>
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Jurusan</th>
                    {STATUS_LIST.map((s) => (
                      <th key={s} style={{ textAlign: "right" }}>
                        {s}
                      </th>
                    ))}
                    <th style={{ textAlign: "right" }}>Total</th>
                    <th style={{ textAlign: "right" }}>Keterserapan</th>
                  </tr>
                </thead>
                <tbody>
                  {jurusanKode.map((j, i) => {
                    const tot = series.reduce((t, s) => t + s.vals[i], 0);
                    const srp = series.filter((s) => s.name !== "Belum / Mencari").reduce((t, s) => t + s.vals[i], 0);
                    return (
                      <tr key={j}>
                        <td>
                          <b>{j}</b>
                        </td>
                        {series.map((s) => (
                          <td key={s.name} className="tabular" style={{ textAlign: "right" }}>
                            {s.vals[i]}
                          </td>
                        ))}
                        <td className="tabular" style={{ textAlign: "right" }}>
                          <b>{tot}</b>
                        </td>
                        <td className="tabular" style={{ textAlign: "right" }}>
                          {tot ? Math.round((srp / tot) * 100) : 0}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Daftar lulusan" sub={`${A.length} orang`}>
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>NISN</th>
                    <th>Nama</th>
                    <th>Jurusan</th>
                    <th>Lulus</th>
                    <th>Status</th>
                    <th>Tempat kerja / studi</th>
                  </tr>
                </thead>
                <tbody>
                  {A.map((a, i) => (
                    <tr key={a.id}>
                      <td className="tabular">{i + 1}</td>
                      <td className="tabular">{a.nisn}</td>
                      <td>{a.nama}</td>
                      <td>{a.jurusan_kode}</td>
                      <td className="tabular">{a.tahun_lulus ?? "—"}</td>
                      <td>{a.status_terkini}</td>
                      <td>{a.instansi_terkini ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div style={{ marginTop: 26, display: "flex", justifyContent: "flex-end" }}>
            <div className="center small">
              <div>Tambelangan, {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</div>
              <div>Kepala SMKN 1 Tambelangan</div>
              <div style={{ height: 58 }} />
              <div style={{ fontWeight: 700, textDecoration: "underline" }}>__________________________</div>
              <div>NIP. ..................................</div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
