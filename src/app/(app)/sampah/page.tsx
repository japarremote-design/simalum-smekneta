import { redirect } from "next/navigation";
import { supabaseServer, sesiSaya } from "@/lib/supabase/server";
import { Card, Empty, waktu } from "@/components/Ui";
import { pulihkanAlumni, pulihkanRiwayat } from "@/app/actions";
import type { Alumni, Riwayat } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SampahPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const sesi = await sesiSaya();
  if (!sesi) redirect("/login");
  if (sesi.profil.peran === "alumni") redirect("/profil");

  const sb = await supabaseServer();
  const [{ data: ta }, { data: tr }] = await Promise.all([
    sb.from("alumni").select("*").not("deleted_at", "is", null).order("deleted_at", { ascending: false }),
    sb
      .from("riwayat")
      .select("*, alumni(nama)")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
  ]);

  const alumniTerhapus = (ta ?? []) as Alumni[];
  const riwayatTerhapus = (tr ?? []) as (Riwayat & { alumni: { nama: string } | null })[];

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Kotak sampah</h2>
      {sp.pesan && <div className="alert">{sp.pesan}</div>}
      <div className="alert">
        Tidak ada data yang benar-benar hilang. Baris hanya ditandai <code>deleted_at</code> dan disembunyikan dari daftar
        normal — sesuai prinsip <b>soft delete</b>. Penghapusan permanen sengaja ditutup di level database.
      </div>

      <Card
        title={`Alumni terhapus (${alumniTerhapus.length})`}
        sub="Memulihkan alumni juga mengaktifkan kembali akun loginnya."
        style={{ marginBottom: 12 }}
      >
        {alumniTerhapus.length ? (
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>NISN</th>
                  <th>Nama</th>
                  <th>Lulus</th>
                  <th>Dihapus pada</th>
                  <th>Alasan</th>
                  <th style={{ textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {alumniTerhapus.map((a) => (
                  <tr key={a.id} className="row-deleted">
                    <td className="tabular">{a.nisn}</td>
                    <td>{a.nama}</td>
                    <td className="tabular">{a.tahun_lulus ?? "—"}</td>
                    <td className="tabular">{waktu(a.deleted_at)}</td>
                    <td>{a.deleted_reason ?? "—"}</td>
                    <td style={{ textAlign: "right" }}>
                      <form action={pulihkanAlumni}>
                        <input type="hidden" name="id" value={a.id} />
                        <button className="btn btn-sm btn-primary">Pulihkan</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>Kosong.</Empty>
        )}
      </Card>

      <Card title={`Riwayat terhapus (${riwayatTerhapus.length})`} sub="Riwayat kerja/studi yang dihapus dari profil alumni.">
        {riwayatTerhapus.length ? (
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Alumni</th>
                  <th>Instansi</th>
                  <th>Posisi</th>
                  <th>Jenis</th>
                  <th>Dihapus pada</th>
                  <th style={{ textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {riwayatTerhapus.map((r) => (
                  <tr key={r.id} className="row-deleted">
                    <td>{r.alumni?.nama ?? "—"}</td>
                    <td>{r.instansi}</td>
                    <td>{r.posisi ?? "—"}</td>
                    <td>{r.jenis}</td>
                    <td className="tabular">{waktu(r.deleted_at)}</td>
                    <td style={{ textAlign: "right" }}>
                      <form action={pulihkanRiwayat}>
                        <input type="hidden" name="id" value={r.id} />
                        <button className="btn btn-sm btn-primary">Pulihkan</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>Kosong.</Empty>
        )}
      </Card>
    </>
  );
}
