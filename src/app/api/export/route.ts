import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer, sesiSaya, catatLog } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const KOLOM = [
  "nisn",
  "nis",
  "nama",
  "jenis_kelamin",
  "tempat_lahir",
  "tanggal_lahir",
  "jurusan_kode",
  "tahun_masuk",
  "tahun_lulus",
  "no_hp",
  "email",
  "alamat",
  "status_terkini",
  "instansi_terkini",
];

export async function GET(req: NextRequest) {
  const sesi = await sesiSaya();
  if (!sesi || sesi.profil.peran === "alumni") {
    return new NextResponse("Tidak punya akses.", { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const sb = await supabaseServer();
  let query = sb.from("v_alumni_aktif").select(KOLOM.join(","));
  const q = sp.get("q");
  if (q) query = query.or(`nama.ilike.%${q}%,nisn.ilike.%${q}%,nis.ilike.%${q}%,instansi_terkini.ilike.%${q}%`);
  if (sp.get("jur")) query = query.eq("jurusan_kode", sp.get("jur"));
  if (sp.get("tahun")) query = query.eq("tahun_lulus", Number(sp.get("tahun")));
  if (sp.get("status")) query = query.eq("status_terkini", sp.get("status"));

  const { data, error } = await query.order("nama").limit(20000);
  if (error) return new NextResponse(error.message, { status: 500 });

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const csv = [
    KOLOM.join(","),
    ...rows.map((r) => KOLOM.map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  await catatLog("export", "alumni", null, `${rows.length} baris`);

  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="alumni_smkn1tambelangan_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
