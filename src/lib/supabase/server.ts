import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Client Supabase untuk Server Component / Server Action (memakai sesi login). */
/** true kalau kunci Supabase sudah diisi di environment variable. */
export const supabaseSiap = Boolean(URL && ANON);

export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(URL, ANON, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list: { name: string; value: string; options?: CookieOptions }[]) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // dipanggil dari Server Component — diurus oleh middleware
        }
      },
    },
  });
}

/** Client dengan service role — LEWATI RLS. Hanya untuk pembuatan akun & seed. */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local");
  return createClient(URL, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function sesiSaya() {
  if (!supabaseSiap) return null;
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data: profil } = await sb
    .from("profiles")
    .select("id, nama, peran, alumni_id, created_at, deleted_at")
    .eq("id", user.id)
    .maybeSingle();
  if (!profil) return null;
  return { user, profil };
}

export async function catatLog(
  aksi: string,
  tabel: string,
  ref_id: string | null,
  keterangan: string,
) {
  try {
    if (!supabaseSiap) return;
    const sb = await supabaseServer();
    const {
      data: { user },
    } = await sb.auth.getUser();
    let aktor = "sistem";
    if (user) {
      const { data } = await sb.from("profiles").select("nama").eq("id", user.id).maybeSingle();
      aktor = data?.nama || user.email || "pengguna";
    }
    await sb.from("activity_log").insert({ user_id: user?.id ?? null, aktor, aksi, tabel, ref_id, keterangan });
  } catch {
    /* log tidak boleh menggagalkan aksi utama */
  }
}
