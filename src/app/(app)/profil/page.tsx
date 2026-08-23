import { redirect } from "next/navigation";
import { supabaseServer, sesiSaya } from "@/lib/supabase/server";
import DetailAlumni from "@/components/DetailAlumni";
import { Card, Empty } from "@/components/Ui";
import type { AlumniAktif, Riwayat } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const sesi = await sesiSaya();
  if (!sesi) redirect("/login");
  if (sesi.profil.peran !== "alumni") redirect("/dashboard");

  const id = sesi.profil.alumni_id;
  if (!id)
    return (
      <Card title="Profil belum terhubung">
        <Empty>Akun Anda belum tertaut ke data alumni. Hubungi admin sekolah.</Empty>
      </Card>
    );

  const sb = await supabaseServer();
  const { data: a } = await sb.from("v_alumni_aktif").select("*").eq("id", id).maybeSingle();
  if (!a)
    return (
      <Card title="Data tidak ditemukan">
        <Empty>Data alumni Anda tidak ditemukan atau sedang dinonaktifkan. Hubungi admin sekolah.</Empty>
      </Card>
    );

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
      <h2 style={{ marginTop: 0 }}>Profil &amp; riwayat saya</h2>
      <div className="alert">
        Pastikan data Anda selalu terbaru — terutama tempat kerja atau kuliah. Data ini dipakai sekolah untuk laporan
        keterserapan lulusan.
      </div>
      <DetailAlumni a={a as AlumniAktif} riwayat={(r ?? []) as Riwayat[]} fotoUrl={fotoUrl} editable admin={false} />
    </>
  );
}
