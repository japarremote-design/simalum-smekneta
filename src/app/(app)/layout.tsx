import { redirect } from "next/navigation";
import { sesiSaya, supabaseServer } from "@/lib/supabase/server";
import { Sidebar, MenuToggle, ThemeToggle, type NavItem } from "@/components/Shell";
import BottomNav, { type NavBawah } from "@/components/BottomNav";
import { IKON } from "@/components/ikon";
import WhatsAppFab from "@/components/WhatsAppFab";
import Footer from "@/components/Footer";
import { keluar } from "../actions";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sesi = await sesiSaya();
  if (!sesi) redirect("/login");
  const admin = sesi.profil.peran !== "alumni";
  const sb = await supabaseServer();

  let items: NavItem[];
  let bawah: NavBawah[];

  if (admin) {
    const [{ count: jmlAlumni }, { count: jmlSampah }, { count: jmlTracer }] = await Promise.all([
      sb.from("alumni").select("id", { count: "exact", head: true }).is("deleted_at", null),
      sb.from("alumni").select("id", { count: "exact", head: true }).not("deleted_at", "is", null),
      sb.from("tracer_submissions").select("id", { count: "exact", head: true }).eq("status", "baru"),
    ]);
    items = [
      { sec: "Utama" },
      { href: "/dashboard", ic: "▤", label: "Dashboard" },
      { href: "/alumni", ic: "▤", label: "Data alumni", badge: jmlAlumni ?? 0 },
      { href: "/laporan", ic: "🖨", label: "Laporan cetak" },
      { sec: "Pengelolaan" },
      { href: "/tracer-masuk", ic: "✉", label: "Tracer masuk", badge: jmlTracer ?? 0 },
      { href: "/sampah", ic: "♻", label: "Kotak sampah", badge: jmlSampah ?? 0 },
      { href: "/log", ic: "≡", label: "Jejak audit" },
    ];
    bawah = [
      { href: "/dashboard", label: "Beranda", ikon: IKON.dashboard },
      { href: "/alumni", label: "Alumni", ikon: IKON.alumni },
      { href: "/tracer-masuk", label: "Tracer", ikon: IKON.tracer, badge: jmlTracer ?? 0 },
      { href: "/laporan", label: "Laporan", ikon: IKON.laporan },
    ];
  } else {
    items = [
      { sec: "Akun saya" },
      { href: "/profil", ic: "◍", label: "Profil & riwayat" },
      { sec: "Lainnya" },
      { href: "/direktori", ic: "▤", label: "Direktori alumni" },
      { href: "/dashboard", ic: "▤", label: "Statistik sekolah" },
    ];
    bawah = [
      { href: "/profil", label: "Profil", ikon: IKON.profil },
      { href: "/direktori", label: "Direktori", ikon: IKON.direktori },
      { href: "/dashboard", label: "Statistik", ikon: IKON.statistik },
    ];
  }

  const inisial = (sesi.profil.nama || "?").slice(0, 1).toUpperCase();

  return (
    <div id="app">
      <aside id="sidebar">
        <Sidebar items={items} />
        <div style={{ marginTop: "auto", paddingTop: 12 }}>
          <form action={keluar}>
            <button className="btn btn-sm" style={{ width: "100%", justifyContent: "center" }}>
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <div id="main">
        <div id="topbar">
          <MenuToggle />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" width={28} height={28} style={{ flex: "none" }} />
          <h1 id="pagetitle">SIMALUM</h1>
          <ThemeToggle />
          <div className="who">
            <div className="avatar">{inisial}</div>
            <div style={{ lineHeight: 1.25 }}>
              <div style={{ fontWeight: 700 }}>{sesi.profil.nama}</div>
              <div style={{ color: "var(--muted)", fontSize: 11.5 }}>{admin ? "Administrator" : "Alumni"}</div>
            </div>
          </div>
          <form action={keluar} className="no-print">
            <button className="btn btn-sm">Keluar</button>
          </form>
        </div>

        <div id="content">{children}</div>
        <Footer />
      </div>

      <BottomNav items={bawah} />
      <WhatsAppFab
        pesan={`Halo Admin SIMALUM ${
          admin ? "" : "(alumni: " + sesi.profil.nama + ") "
        }SMKN 1 Tambelangan, saya ingin bertanya tentang data alumni.`}
      />
    </div>
  );
}
