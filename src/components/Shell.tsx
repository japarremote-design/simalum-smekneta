"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export type NavItem = { sec?: string; href?: string; ic?: string; label?: string; badge?: number };

export function Sidebar({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <>
      <div className="logo" style={{ padding: "0 8px 10px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Logo SMKN 1 Tambelangan" width={42} height={42} style={{ flex: "none" }} />
        <div>
          <b>SIMALUM</b>
          <span>SMKN 1 Tambelangan</span>
        </div>
      </div>
      {items.map((n, i) =>
        n.sec ? (
          <div className="nav-sec" key={"s" + i}>
            {n.sec}
          </div>
        ) : (
          <Link
            key={n.href}
            href={n.href!}
            className={"nav-item" + (path === n.href || path.startsWith(n.href + "/") ? " on" : "")}
          >
            <span className="ic">{n.ic}</span>
            {n.label}
            {n.badge ? <span className={"nav-badge tabular" + (n.href === "/tracer-masuk" ? " badge-warn" : "")}>{n.badge}</span> : null}
          </Link>
        ),
      )}
    </>
  );
}

export function MenuToggle() {
  const [open, setOpen] = useState(false);
  const toggle = () => {
    const sb = document.getElementById("sidebar");
    if (!sb) return;
    sb.classList.toggle("open");
    setOpen(sb.classList.contains("open"));
  };
  return (
    <>
      <button className="btn btn-sm btn-ghost" id="menubtn" onClick={toggle} aria-label="Menu">
        ☰
      </button>
      {open && <div id="scrim" onClick={toggle} />}
    </>
  );
}

export function ThemeToggle() {
  return (
    <button
      className="btn btn-sm btn-ghost"
      title="Ganti tema terang / gelap"
      onClick={() => {
        const r = document.documentElement;
        r.dataset.theme = r.dataset.theme === "dark" ? "light" : "dark";
      }}
    >
      ◐
    </button>
  );
}
