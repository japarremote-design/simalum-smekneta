import { redirect } from "next/navigation";
import { sesiSaya } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const sesi = await sesiSaya();
  if (!sesi) redirect("/login");
  redirect(sesi.profil.peran === "alumni" ? "/profil" : "/dashboard");
}
