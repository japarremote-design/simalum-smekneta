import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Penjaga supaya project Supabase gratisan tidak dijeda.
 *
 * Supabase menjeda project Free yang tidak menerima permintaan database selama
 * 7 hari. Endpoint ini sengaja MENYENTUH DATABASE (bukan sekadar balas "OK"),
 * karena yang dihitung Supabase adalah aktivitas database — bukan aktivitas
 * aplikasi. Dipanggil terjadwal oleh Vercel Cron (lihat vercel.json) dan boleh
 * juga dipanggil layanan cron gratis dari luar.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  // Kalau CRON_SECRET diisi di Environment Variables, endpoint ini hanya mau
  // melayani pemanggil yang menyertakannya. Vercel Cron mengirimnya otomatis.
  const rahasia = process.env.CRON_SECRET;
  if (rahasia) {
    const dibawa =
      req.headers.get("authorization") === `Bearer ${rahasia}` ||
      req.nextUrl.searchParams.get("kunci") === rahasia;
    if (!dibawa) {
      return NextResponse.json({ ok: false, pesan: "Tidak diizinkan." }, { status: 401 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const kunci = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !kunci) {
    return NextResponse.json(
      { ok: false, pesan: "NEXT_PUBLIC_SUPABASE_URL / ANON_KEY belum diisi." },
      { status: 500 },
    );
  }

  const mulai = Date.now();
  try {
    // Client tanpa sesi — cukup untuk menandai "database masih dipakai".
    const sb = createClient(url, kunci, { auth: { persistSession: false } });

    // Query paling ringan yang ada: hitung baris tabel jurusan (isinya 5 baris).
    const { count, error } = await sb.from("jurusan").select("id", { count: "exact", head: true });
    if (error) throw error;

    return NextResponse.json({
      ok: true,
      pesan: "Database aktif — hitungan jeda 7 hari direset.",
      jurusan: count ?? 0,
      lama_ms: Date.now() - mulai,
      waktu: new Date().toISOString(),
    });
  } catch (e) {
    const pesan = e instanceof Error ? e.message : "Gagal menghubungi database.";
    // 503 supaya layanan pemantau di luar bisa mengirim notifikasi ke om
    return NextResponse.json(
      { ok: false, pesan, petunjuk: "Project Supabase mungkin sedang dijeda — buka dashboard lalu Resume.", lama_ms: Date.now() - mulai },
      { status: 503 },
    );
  }
}
