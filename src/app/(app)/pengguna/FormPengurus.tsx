"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { tambahPengurus, resetPassword } from "./actions";

function Tombol({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" disabled={pending}>
      {pending ? "Menyimpan…" : label}
    </button>
  );
}

/** Sandi acak yang gampang dibacakan lewat telepon — tanpa huruf/angka yang mirip. */
function sandiAcak() {
  const huruf = "abcdefghjkmnpqrstuvwxyz";
  const angka = "23456789";
  const ambil = (s: string, n: number) =>
    Array.from({ length: n }, () => s[Math.floor(Math.random() * s.length)]).join("");
  return ambil(huruf, 4) + ambil(angka, 3) + ambil(huruf.toUpperCase(), 2);
}

export function FormTambah() {
  const [state, action] = useActionState(tambahPengurus, null as { ok?: string; error?: string } | null);
  const [sandi, setSandi] = useState("");
  const [buka, setBuka] = useState(false);

  if (!buka)
    return (
      <button className="btn btn-primary" onClick={() => { setBuka(true); setSandi(sandiAcak()); }}>
        + Tambah pengurus
      </button>
    );

  return (
    <form action={action} className="card" style={{ marginTop: 12 }}>
      {state?.error && <div className="alert err">{state.error}</div>}
      {state?.ok && <div className="alert ok">{state.ok}</div>}

      <div className="grid2">
        <div className="field">
          <label>Nama *</label>
          <input name="nama" required placeholder="mis. Bu Siti — Guru BK" />
        </div>
        <div className="field">
          <label>Email *</label>
          <input name="email" type="email" required placeholder="bk@smkn1tambelangan.sch.id" />
          <div className="hint">Email asli yang dipakai untuk login.</div>
        </div>
      </div>
      <div className="grid2">
        <div className="field">
          <label>Peran *</label>
          <select name="peran" defaultValue="operator">
            <option value="operator">Operator — kelola data alumni</option>
            <option value="admin">Admin — kelola data + pengguna</option>
          </select>
        </div>
        <div className="field">
          <label>Password awal *</label>
          <div className="rowflex">
            <input name="password" required minLength={8} value={sandi} onChange={(e) => setSandi(e.target.value)} style={{ flex: 1 }} />
            <button type="button" className="btn btn-sm" onClick={() => setSandi(sandiAcak())}>
              Acak
            </button>
          </div>
          <div className="hint">Minta yang bersangkutan segera menggantinya.</div>
        </div>
      </div>

      <div className="rowflex">
        <Tombol label="Simpan pengurus" />
        <button type="button" className="btn" onClick={() => setBuka(false)}>
          Batal
        </button>
      </div>
    </form>
  );
}

export function FormReset({ id, nama }: { id: string; nama: string }) {
  const [state, action] = useActionState(resetPassword, null as { ok?: string; error?: string } | null);
  const [buka, setBuka] = useState(false);
  const [sandi, setSandi] = useState("");

  if (!buka)
    return (
      <button className="btn btn-sm" onClick={() => { setBuka(true); setSandi(sandiAcak()); }}>
        Reset password
      </button>
    );

  return (
    <form action={action} style={{ minWidth: 240 }}>
      <input type="hidden" name="id" value={id} />
      {state?.error && <div className="alert err small">{state.error}</div>}
      {state?.ok && <div className="alert ok small">{state.ok}</div>}
      <div className="field" style={{ marginBottom: 6 }}>
        <label style={{ fontSize: 11 }}>Password baru untuk {nama}</label>
        <input name="password" required minLength={8} value={sandi} onChange={(e) => setSandi(e.target.value)} />
      </div>
      <div className="rowflex">
        <Tombol label="Simpan" />
        <button type="button" className="btn btn-sm" onClick={() => setBuka(false)}>
          Batal
        </button>
      </div>
    </form>
  );
}
