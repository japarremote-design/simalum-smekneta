import { redirect } from "next/navigation";
import { supabaseServer, sesiSaya } from "@/lib/supabase/server";
import FormAlumni from "@/components/FormAlumni";
import type { Jurusan } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BaruPage() {
  const sesi = await sesiSaya();
  if (!sesi || sesi.profil.peran === "alumni") redirect("/profil");
  const sb = await supabaseServer();
  const { data } = await sb.from("jurusan").select("id, kode, nama, urutan").order("urutan");

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Tambah alumni</h2>
      <p className="muted small" style={{ marginTop: -6 }}>
        Setelah disimpan, akun login alumni dibuat otomatis dengan username &amp; password awal sama dengan NISN.
      </p>
      <div className="card">
        <FormAlumni jurusan={(data ?? []) as Jurusan[]} batalHref="/alumni" />
      </div>
    </>
  );
}
