import { redirect } from "next/navigation";
import { supabaseServer, sesiSaya } from "@/lib/supabase/server";
import { Card, Empty, waktu } from "@/components/Ui";
import type { LogRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LogPage() {
  const sesi = await sesiSaya();
  if (!sesi) redirect("/login");
  if (sesi.profil.peran === "alumni") redirect("/profil");

  const sb = await supabaseServer();
  const { data } = await sb
    .from("activity_log")
    .select("id, aktor, aksi, tabel, ref_id, keterangan, created_at")
    .order("created_at", { ascending: false })
    .limit(300);
  const rows = (data ?? []) as LogRow[];

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Jejak audit</h2>
      <Card sub="Semua perubahan tercatat: siapa menambah, mengubah, menghapus, dan memulihkan data.">
        {rows.length ? (
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Aktor</th>
                  <th>Aksi</th>
                  <th>Tabel</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => (
                  <tr key={l.id}>
                    <td className="tabular">{waktu(l.created_at)}</td>
                    <td>{l.aktor}</td>
                    <td>{l.aksi}</td>
                    <td>{l.tabel}</td>
                    <td>{l.keterangan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>Belum ada aktivitas.</Empty>
        )}
      </Card>
    </>
  );
}
