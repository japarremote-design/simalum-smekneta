import Link from "next/link";
import { jumlahAdmin } from "./actions";
import FormSetup from "./FormSetup";
import { Brand } from "@/components/Brand";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Buat Admin Pertama — SIMALUM",
  robots: { index: false, follow: false },
};

export default async function SetupPage() {
  const { jumlah, error } = await jumlahAdmin();

  return (
    <div className="public-wrap" style={{ maxWidth: 560 }}>
      <div className="public-head">
        <Brand ukuran={54} sub="Penyiapan awal · SMK Negeri 1 Tambelangan" />
      </div>

      {error ? (
        <div className="card">
          <div className="alert err">
            <b>Belum bisa dilanjutkan.</b>
            <div className="small" style={{ marginTop: 4 }}>{error}</div>
          </div>
          <p className="small muted">
            Perbaiki dulu penyebabnya di Supabase / Environment Variables, lalu muat ulang halaman ini.
          </p>
        </div>
      ) : jumlah > 0 ? (
        <div className="card center" style={{ padding: 28 }}>
          <div style={{ fontSize: 30 }}>🔒</div>
          <h2 style={{ margin: "8px 0" }}>Halaman ini sudah dikunci</h2>
          <p className="muted">
            Admin sudah ada di sistem ini ({jumlah} akun), jadi halaman penyiapan otomatis dinonaktifkan demi keamanan.
            Admin baru berikutnya ditambahkan lewat Supabase oleh admin yang sudah ada.
          </p>
          <Link className="btn btn-primary" href="/login">
            Ke halaman login
          </Link>
        </div>
      ) : (
        <>
          <div className="alert">
            Belum ada satu pun akun admin di sistem ini. Buat yang pertama di sini — tidak perlu buka Supabase.
            Setelah selesai, halaman ini akan mengunci dirinya sendiri secara permanen.
          </div>
          <FormSetup />
        </>
      )}

      <Footer />
    </div>
  );
}
