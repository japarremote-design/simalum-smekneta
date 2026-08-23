import { redirect } from "next/navigation";
import { supabaseServer, sesiSaya } from "@/lib/supabase/server";
import FormAlumni from "@/components/FormAlumni";
import type { Alumni, Jurusan } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditProfilPage() {
  const sesi = await sesiSaya();
  if (!sesi) redirect("/login");
  if (sesi.profil.peran !== "alumni" || !sesi.profil.alumni_id) redirect("/dashboard");

  const sb = await supabaseServer();
  const [{ data: a }, { data: jurusan }] = await Promise.all([
    sb.from("alumni").select("*").eq("id", sesi.profil.alumni_id).maybeSingle(),
    sb.from("jurusan").select("id, kode, nama, urutan").order("urutan"),
  ]);
  if (!a) redirect("/profil");

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Edit data diri saya</h2>
      <div className="card">
        <FormAlumni alumni={a as Alumni} jurusan={(jurusan ?? []) as Jurusan[]} batalHref="/profil" />
      </div>
    </>
  );
}
