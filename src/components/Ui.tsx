import React from "react";
import { STATUS_COLOR } from "@/lib/types";

export function StatusPill({ status }: { status: string }) {
  return (
    <span className="pill">
      <span className="dot" style={{ background: STATUS_COLOR[status] || "var(--muted)" }} />
      {status}
    </span>
  );
}

export function Card({
  title,
  sub,
  children,
  style,
}: {
  title?: string;
  sub?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="card" style={style}>
      {title && <h3>{title}</h3>}
      {sub && <div className="sub">{sub}</div>}
      {children}
    </div>
  );
}

export function Tile({ label, value, sub, color }: { label: string; value: React.ReactNode; sub?: string; color?: string }) {
  return (
    <div className="tile">
      <div className="lab">{label}</div>
      <div className="val tabular" style={color ? { color } : undefined}>
        {value}
      </div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

export function tgl(s: string | null | undefined) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function waktu(s: string | null | undefined) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function periode(mulai: string | null, selesai: string | null) {
  const f = (s: string | null) => (s ? s.slice(0, 7) : "");
  return `${f(mulai) || "?"} – ${selesai ? f(selesai) : "sekarang"}`;
}
