"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { useTinggiKeCssVar } from "@/lib/ukur";

export type NavBawah = { href: string; label: string; ikon: React.ReactNode; badge?: number };

/** Menu bawah khusus HP — ditaruh di jangkauan jempol.
 *  Item terakhir "Lainnya" membuka laci berisi menu selengkapnya. */
export default function BottomNav({ items }: { items: NavBawah[] }) {
  const path = usePathname();
  const [laci, setLaci] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // tinggi menu bawah ditulis ke --nav-bawah supaya tombol WhatsApp dan
  // ajakan "Pasang di HP" bisa menumpuk di atasnya, tidak saling menindih
  useTinggiKeCssVar(navRef, "--nav-bawah");

  const bukaLaci = () => {
    const sb = document.getElementById("sidebar");
    if (!sb) return;
    const kini = !sb.classList.contains("open");
    sb.classList.toggle("open", kini);
    setLaci(kini);
  };

  const aktif = (href: string) => path === href || path.startsWith(href + "/");

  return (
    <>
      {laci && <div id="scrim" onClick={bukaLaci} />}
      <nav id="bottomnav" ref={navRef} className="no-print" aria-label="Menu utama">
        {items.map((n) => (
          <Link key={n.href} href={n.href} className={"bn-item" + (aktif(n.href) ? " on" : "")} onClick={() => setLaci(false)}>
            <span className="bn-ikon">
              {n.ikon}
              {n.badge ? <span className="bn-badge">{n.badge > 99 ? "99+" : n.badge}</span> : null}
            </span>
            <span className="bn-label">{n.label}</span>
          </Link>
        ))}
        <button className={"bn-item" + (laci ? " on" : "")} onClick={bukaLaci} aria-expanded={laci}>
          <span className="bn-ikon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </span>
          <span className="bn-label">Lainnya</span>
        </button>
      </nav>
    </>
  );
}
