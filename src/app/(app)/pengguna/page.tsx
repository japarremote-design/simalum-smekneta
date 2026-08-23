import { redirect } from "next/navigation";
import { sesiSaya, supabaseAdmin } from "@/lib/supabase/server";
import { Card, Empty, waktu } from "@/components/Ui";
import { FormTambah, FormReset } from "./FormPengurus";
import { ubahPeran, setAktif } from "./actions";

export const dynamic = "force-dynamic";

type Baris = {
  id: string;
  nama: string;
  peran: string;
  deleted_at: string | null;
  created_at: string;
  email: string;
  terakhir_masuk: string | null;
};

export default async function PenggunaPage() {
  const sesi = await sesiSaya();
  if (!sesi) redirect("/login");
  if (sesi.profil.peran !== "admin") {
    return (
      <>
        <h2 style={{ marginTop: 0 }}>Kelola pengguna</h2>
        <Card>
          <Empty>
            Halaman ini khusus peran <b>admin</b>. Akun Anda berperan <b>{sesi.profil.peran}</b> — bisa mengelola data
            alumni, tapi tidak bisa menambah atau mengubah akun pengurus.
          </Empty>
        </Card>
      </>
    );
  }

  let baris: Baris[] = [];
  let galat: string | null = null;
  try {
    const admin = supabaseAdmin();
    const { data: profil, error } = await admin
      .from("profiles")
      .select("id, nama, peran, deleted_at, created_at")
      .in("peran", ["admin", "operator"])
      .order("created_at");
    if (error) throw error;

    const { data: daftar } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const petaEmail = new Map((daftar?.users ?? []).map((u) => [u.id, { email: u.email ?? "—", masuk: u.last_sign_in_at }]));

    baris = (profil ?? []).map((p) => ({
      ...p,
      email: petaEmail.get(p.id)?.email ?? "—",
      terakhir_masuk: petaEmail.get(p.id)?.masuk ?? null,
    })) as Baris[];
  } catch (e) {
    galat = e instanceof Error ? e.message : "Gagal membaca daftar pengguna.";
  }

  const adminAktif = baris.filter((b) => b.peran === "admin" && !b.deleted_at).length;

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Kelola pengguna</h2>

      {galat ? (
        <div className="alert err">
          <b>Tidak bisa membaca daftar pengguna.</b>
          <div className="small" style={{ marginTop: 4 }}>{galat}</div>
          <div className="small" style={{ marginTop: 6 }}>
            Biasanya karena <code>SUPABASE_SERVICE_ROLE_KEY</code> belum diisi di Environment Variables.
          </div>
        </div>
      ) : (
        <>
          <div className="alert">
            <b>Dua tingkat peran.</b> <b>Admin</b> bisa semuanya termasuk mengelola akun pengurus.{" "}
            <b>Operator</b> bisa mengelola data alumni, tapi tidak bisa menambah atau menurunkan akun orang lain —
            cocok untuk guru BK atau staf TU.
            <div className="small" style={{ marginTop: 6 }}>
              Akun <b>alumni</b> tidak muncul di sini; itu dibuat otomatis saat data alumni ditambahkan.
            </div>
          </div>

          <FormTambah />

          <Card
            title={`Pengurus (${baris.length})`}
            sub="Menonaktifkan pengurus membuatnya langsung tidak bisa login, tapi datanya tetap tersimpan."
            style={{ marginTop: 12 }}
          >
            {baris.length ? (
              <div className="tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>Email</th>
                      <th>Peran</th>
                      <th>Terakhir masuk</th>
                      <th style={{ textAlign: "right" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {baris.map((b) => {
                      const sayaSendiri = b.id === sesi.user.id;
                      const adminTerakhir = b.peran === "admin" && !b.deleted_at && adminAktif <= 1;
                      const terkunci = sayaSendiri || adminTerakhir;
                      return (
                        <tr key={b.id} className={b.deleted_at ? "row-deleted" : undefined}>
                          <td>
                            <b>{b.nama}</b>
                            {sayaSendiri && <span className="pill" style={{ marginLeft: 6 }}>Anda</span>}
                            {b.deleted_at && (
                              <div className="small" style={{ color: "var(--crit)" }}>
                                nonaktif sejak {waktu(b.deleted_at)}
                              </div>
                            )}
                          </td>
                          <td className="small">{b.email}</td>
                          <td>
                            <form action={ubahPeran} className="rowflex">
                              <input type="hidden" name="id" value={b.id} />
                              <select name="peran" defaultValue={b.peran} disabled={terkunci}>
                                <option value="admin">admin</option>
                                <option value="operator">operator</option>
                              </select>
                              {!terkunci && <button className="btn btn-sm">Ubah</button>}
                            </form>
                          </td>
                          <td className="small">{b.terakhir_masuk ? waktu(b.terakhir_masuk) : "belum pernah"}</td>
                          <td style={{ textAlign: "right" }}>
                            <div className="rowflex" style={{ justifyContent: "flex-end" }}>
                              <FormReset id={b.id} nama={b.nama} />
                              {!terkunci && (
                                <form action={setAktif}>
                                  <input type="hidden" name="id" value={b.id} />
                                  <input type="hidden" name="aktifkan" value={b.deleted_at ? "1" : "0"} />
                                  <button className={"btn btn-sm" + (b.deleted_at ? " btn-primary" : " btn-danger")}>
                                    {b.deleted_at ? "Aktifkan" : "Nonaktifkan"}
                                  </button>
                                </form>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty>Belum ada pengurus lain selain Anda.</Empty>
            )}

            <div className="small muted" style={{ marginTop: 10 }}>
              Akun Anda sendiri dan admin terakhir sengaja dikunci — supaya tidak ada kejadian semua admin
              nonaktif dan aplikasi jadi tidak bisa dikelola siapa pun.
            </div>
          </Card>
        </>
      )}
    </>
  );
}
