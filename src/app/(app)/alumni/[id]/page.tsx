import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer, sesiSaya } from "@/lib/supabase/server";
import DetailAlumni from "@/components/DetailAlumni";
import { hapusAlumni } from "@/app/actions";
import type { AlumniAktif, Riwayat } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sesi = await sesiSaya();
  const admin = sesi?.profil.peran !== "alumni";
  const sb = await supabaseServer();

  const { data: a } = await sb.from("v_alumni_aktif").select("*").eq("id", id).maybeSingle();
  if (!a) notFound();

  const { data: r } = await sb
    .from("riwayat")
    .select("*")
    .eq("alumni_id", id)
    .is("deleted_at", null)
    .order("tgl_mulai", { ascending: false, nullsFirst: false });

  let fotoUrl: string | null = null;
  if (a.foto_path) {
    const { data: signed } = await sb.storage.from("berkas").createSignedUrl(a.foto_path, 3600);
    fotoUrl = signed?.signedUrl ?? null;
  }

  return (
    <>
      <div className="rowflex" style={{ marginBottom: 12 }}>
        <Link className="btn btn-sm" href="/alumni">
          ‹ Kembali ke daftar
        </Link>
      </div>

      <DetailAlumni a={a as AlumniAktif} riwayat={(r ?? []) as Riwayat[]} fotoUrl={fotoUrl} editable admin={admin} />

      {admin && (
        <details className="card" style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer", fontWeight: 700, color: "var(--crit)" }}>Hapus data alumni ini</summary>
          <p className="small muted" style={{ marginTop: 10 }}>
            Data tidak dihapus permanen dari database. Kolom <code>deleted_at</code>, <code>deleted_by</code>, dan alasannya
            akan diisi, riwayat serta akun loginnya ikut dinonaktifkan, dan semuanya bisa dipulihkan lewat menu Kotak sampah.
          </p>
          <form action={hapusAlumni}>
            <input type="hidden" name="id" value={a.id} />
            <div className="field">
              <label>Alasan penghapusan</label>
              <input name="alasan" placeholder="mis. data ganda / salah input" />
            </div>
            <button className="btn btn-danger">Pindahkan ke kotak sampah</button>
          </form>
        </details>
      )}
    </>
  );
}
