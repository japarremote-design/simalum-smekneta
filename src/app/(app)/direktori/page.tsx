import { supabaseServer } from "@/lib/supabase/server";
import { StatusPill, Empty } from "@/components/Ui";
import type { AlumniAktif } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DirektoriPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const sb = await supabaseServer();

  let query = sb
    .from("v_alumni_aktif")
    .select("id, nama, jurusan_kode, tahun_lulus, status_terkini, instansi_terkini");
  if (q) query = query.or(`nama.ilike.%${q}%,instansi_terkini.ilike.%${q}%`);
  const { data } = await query.order("nama").limit(100);
  const rows = (data ?? []) as AlumniAktif[];

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Direktori alumni</h2>
      <form className="toolbar" method="get">
        <input type="search" name="q" defaultValue={q} placeholder="Cari teman seangkatan…" />
        <button className="btn">Cari</button>
      </form>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Jurusan</th>
              <th>Lulus</th>
              <th>Status</th>
              <th>Tempat kini</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((a) => (
                <tr key={a.id}>
                  <td>
                    <b>{a.nama}</b>
                  </td>
                  <td>{a.jurusan_kode}</td>
                  <td className="tabular">{a.tahun_lulus ?? "—"}</td>
                  <td>
                    <StatusPill status={a.status_terkini} />
                  </td>
                  <td>{a.instansi_terkini ?? "—"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>
                  <Empty>Tidak ditemukan.</Empty>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="small muted" style={{ marginTop: 8 }}>
        Nomor HP dan alamat sesama alumni sengaja tidak ditampilkan demi privasi.
      </div>
    </>
  );
}
