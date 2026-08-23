"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { buatAdminPertama } from "./actions";

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" disabled={pending} style={{ width: "100%", justifyContent: "center" }}>
      {pending ? "Membuat akun…" : "Buat akun admin"}
    </button>
  );
}

export default function FormSetup() {
  const [state, action] = useActionState(buatAdminPertama, null as { ok?: string; error?: string } | null);

  if (state?.ok)
    return (
      <div className="card center" style={{ padding: 28 }}>
        <div style={{ fontSize: 32 }}>✓</div>
        <h2 style={{ margin: "8px 0" }}>Berhasil</h2>
        <p className="muted">{state.ok}</p>
        <Link className="btn btn-primary" href="/login">
          Login sekarang
        </Link>
      </div>
    );

  return (
    <form action={action} className="card">
      {state?.error && <div className="alert err">{state.error}</div>}

      <div className="field">
        <label>Nama pengelola *</label>
        <input name="nama" defaultValue="Admin Sekolah" required />
        <div className="hint">Muncul di pojok aplikasi dan di jejak audit.</div>
      </div>
      <div className="field">
        <label>Email *</label>
        <input name="email" type="email" required placeholder="admin@smkn1tambelangan.sch.id" />
        <div className="hint">Dipakai untuk login lewat tab “Login Admin”.</div>
      </div>
      <div className="grid2">
        <div className="field">
          <label>Password *</label>
          <input name="password" type="password" required minLength={8} />
          <div className="hint">Minimal 8 karakter.</div>
        </div>
        <div className="field">
          <label>Ulangi password *</label>
          <input name="ulangi" type="password" required minLength={8} />
        </div>
      </div>

      <Tombol />

      <p className="small muted" style={{ marginTop: 14, marginBottom: 0 }}>
        Halaman ini hanya bisa dipakai selama belum ada admin. Begitu akun pertama jadi, halaman ini otomatis terkunci.
      </p>
    </form>
  );
}
