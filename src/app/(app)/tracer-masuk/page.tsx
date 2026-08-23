import { redirect } from "next/navigation";
import { supabaseServer, sesiSaya } from "@/lib/supabase/server";
import { Card, Empty, waktu, tgl } from "@/components/Ui";
import { prosesTracer } from "@/app/actions";
import type { TracerSubmission } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TracerMasukPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const sesi = await sesiSaya();
  if (!sesi) redirect("/login");
  if (sesi.profil.peran === "alumni") redirect("/profil");

  const status = sp.status ?? "baru";
  const sb = await supabaseServer();
  let q = sb.from("tracer_submissions").select("*").is("deleted_at", null);
  if (status !== "semua") q = q.eq("status", status);
  const { data } = await q.order("created_at", { ascending: false }).limit(200);
  const rows = (data ?? []) as TracerSubmission[];

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Tracer study masuk</h2>
      {sp.pesan && <div className="alert ok">{sp.pesan}</div>}
      <div className="alert">
        Kiriman dari halaman publik <code>/tracer</code>. Saat disetujui, sistem mencocokkan NISN dengan data yang ada —
        kalau cocok riwayatnya ditambahkan, kalau belum ada alumninya dibuatkan baru.
      </div>

      <form className="toolbar" method="get">
        <select name="status" defaultValue={status}>
          <option value="baru">Menunggu verifikasi</option>
          <option value="disetujui">Sudah disetujui</option>
          <option value="ditolak">Ditolak</option>
          <option value="semua">Semua</option>
        </select>
        <button className="btn">Tampilkan</button>
      </form>

      {rows.length ? (
        <div className="stack">
          {rows.map((t) => (
            <Card key={t.id}>
              <div className="rowflex">
                <div>
                  <b>{t.nama}</b>{" "}
                  <span className="muted small">
                    · NISN {t.nisn ?? "—"} · {t.jurusan_kode ?? "—"} · lulus {t.tahun_lulus ?? "—"}
                  </span>
                  <div className="small muted">Dikirim {waktu(t.created_at)}</div>
                </div>
                <div className="spacer" />
                <span className="pill">{t.status}</span>
              </div>

              <dl className="kv" style={{ marginTop: 10 }}>
                <dt>Kegiatan</dt>
                <dd>
                  {t.jenis} di <b>{t.instansi ?? "—"}</b>
                  {t.posisi ? ` sebagai ${t.posisi}` : ""}
                </dd>
                <dt>Lokasi</dt>
                <dd>
                  {t.kota ?? "—"}
                  {t.provinsi ? `, ${t.provinsi}` : ""}
                </dd>
                <dt>Mulai</dt>
                <dd>{tgl(t.tgl_mulai)}</dd>
                <dt>Kontak</dt>
                <dd>
                  {t.no_hp ?? "—"} · {t.email ?? "—"}
                </dd>
                {t.catatan && (
                  <>
                    <dt>Catatan</dt>
                    <dd>{t.catatan}</dd>
                  </>
                )}
              </dl>

              {t.status === "baru" && (
                <div className="rowflex" style={{ marginTop: 12 }}>
                  <form action={prosesTracer}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="aksi" value="setujui" />
                    <button className="btn btn-primary btn-sm">Setujui &amp; masukkan ke database</button>
                  </form>
                  <form action={prosesTracer}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="aksi" value="tolak" />
                    <button className="btn btn-sm btn-danger">Tolak</button>
                  </form>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Empty>Tidak ada kiriman pada filter ini.</Empty>
        </Card>
      )}
    </>
  );
}
