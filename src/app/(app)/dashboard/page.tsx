import { supabaseServer, sesiSaya } from "@/lib/supabase/server";
import { HBar, VBar, SBar, Legend } from "@/components/Charts";
import { Card, Tile, Empty, waktu } from "@/components/Ui";
import { STATUS_COLOR, STATUS_LIST, type AlumniAktif, type LogRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const sesi = await sesiSaya();
  const admin = sesi?.profil.peran !== "alumni";
  const sb = await supabaseServer();

  const { data: rows } = await sb
    .from("v_alumni_aktif")
    .select("id, nama, jurusan_kode, tahun_lulus, status_terkini, instansi_terkini")
    .limit(20000);
  const A = (rows ?? []) as Pick<
    AlumniAktif,
    "id" | "nama" | "jurusan_kode" | "tahun_lulus" | "status_terkini" | "instansi_terkini"
  >[];

  const { count: jmlSampah } = await sb
    .from("alumni")
    .select("id", { count: "exact", head: true })
    .not("deleted_at", "is", null);

  const hitung = (st: string) => A.filter((a) => a.status_terkini === st).length;
  const bekerja = hitung("Bekerja"),
    kuliah = hitung("Kuliah"),
    usaha = hitung("Wirausaha");
  const pct = A.length ? Math.round(((bekerja + kuliah + usaha) / A.length) * 100) : 0;

  const dataStatus = STATUS_LIST.map((st) => ({ k: st, v: hitung(st), c: STATUS_COLOR[st] }));

  const jurusanKode = Array.from(new Set(A.map((a) => a.jurusan_kode))).sort();
  const series = STATUS_LIST.map((st) => ({
    name: st,
    color: STATUS_COLOR[st],
    vals: jurusanKode.map((j) => A.filter((a) => a.jurusan_kode === j && a.status_terkini === st).length),
  }));

  const tahun = Array.from(new Set(A.map((a) => a.tahun_lulus).filter(Boolean))).sort() as number[];
  const dataTahun = tahun.map((t) => ({ k: String(t), v: A.filter((a) => a.tahun_lulus === t).length }));

  const inst: Record<string, number> = {};
  A.forEach((a) => {
    if (a.instansi_terkini) inst[a.instansi_terkini] = (inst[a.instansi_terkini] ?? 0) + 1;
  });
  const topInst = Object.entries(inst)
    .sort((x, y) => y[1] - x[1])
    .slice(0, 8)
    .map(([k, v]) => ({ k, v }));

  let log: LogRow[] = [];
  if (admin) {
    const { data } = await sb
      .from("activity_log")
      .select("id, aktor, aksi, tabel, ref_id, keterangan, created_at")
      .order("created_at", { ascending: false })
      .limit(8);
    log = (data ?? []) as LogRow[];
  }

  return (
    <>
      <h2 style={{ marginTop: 0 }}>{admin ? "Dashboard" : "Statistik alumni SMKN 1 Tambelangan"}</h2>

      <div className="tiles">
        <Tile label="Total alumni aktif" value={A.length} sub={admin ? `${jmlSampah ?? 0} data di kotak sampah` : undefined} />
        <Tile
          label="Sudah bekerja"
          value={bekerja}
          color="var(--s1)"
          sub={`${A.length ? Math.round((bekerja / A.length) * 100) : 0}% dari total`}
        />
        <Tile label="Kuliah" value={kuliah} color="var(--s2)" sub="melanjutkan pendidikan" />
        <Tile label="Wirausaha" value={usaha} color="var(--s3)" sub="buka usaha sendiri" />
        <Tile label="Keterserapan" value={`${pct}%`} sub="bekerja + wirausaha + kuliah" />
      </div>

      {A.length === 0 ? (
        <Card title="Belum ada data alumni">
          <Empty>
            Database masih kosong. Tambahkan lewat menu <b>Data alumni</b>, atau jalankan <code>npm run seed</code> untuk
            mengisi data contoh.
          </Empty>
        </Card>
      ) : (
        <div className="charts">
          <Card title="Status alumni saat ini" sub="Dihitung otomatis dari riwayat yang masih aktif">
            <HBar data={dataStatus} />
          </Card>
          <Card title="Sebaran per jurusan" sub="Jumlah alumni per kompetensi keahlian, dipecah per status">
            <SBar cats={jurusanKode} series={series} />
            <Legend series={series} />
          </Card>
          <Card title="Jumlah lulusan per tahun" sub="Berdasarkan tahun kelulusan yang tercatat">
            <VBar data={dataTahun} />
          </Card>
          <Card title="Tempat kerja / studi terbanyak" sub="8 instansi teratas dari riwayat aktif">
            {topInst.length ? <HBar data={topInst} unit="orang" /> : <Empty>Belum ada riwayat.</Empty>}
          </Card>
        </div>
      )}

      {admin && (
        <Card title="Aktivitas terakhir" sub="Jejak audit — termasuk penghapusan & pemulihan data" style={{ marginTop: 12 }}>
          {log.length ? (
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Aktor</th>
                    <th>Aksi</th>
                    <th>Tabel</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((l) => (
                    <tr key={l.id}>
                      <td className="tabular">{waktu(l.created_at)}</td>
                      <td>{l.aktor}</td>
                      <td>{l.aksi}</td>
                      <td>{l.tabel}</td>
                      <td>{l.keterangan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>Belum ada aktivitas.</Empty>
          )}
        </Card>
      )}
    </>
  );
}
