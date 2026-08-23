"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { masuk } from "../actions";
import { Brand } from "@/components/Brand";
import WhatsAppFab from "@/components/WhatsAppFab";
import { SITUS } from "@/lib/situs";

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" disabled={pending} style={{ width: "100%", justifyContent: "center" }}>
      {pending ? "Memproses…" : "Masuk"}
    </button>
  );
}

export default function LoginPage() {
  const [peran, setPeran] = useState<"admin" | "alumni">("admin");
  const [state, action] = useActionState(masuk, null as { error?: string } | null);

  const belumSiap = !process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <div id="login">
      <div className="login-box">
        <Brand ukuran={46} />

        {belumSiap && (
          <div className="alert err">
            <b>Aplikasi belum tersambung ke database.</b>
            <div className="small" style={{ marginTop: 4 }}>
              Isi <code>NEXT_PUBLIC_SUPABASE_URL</code> dan <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> di Environment
              Variables (Vercel) atau file <code>.env.local</code>, lalu deploy ulang.
            </div>
          </div>
        )}

        <div className="segmented">
          <button type="button" className={peran === "admin" ? "on" : ""} onClick={() => setPeran("admin")}>
            Login Admin
          </button>
          <button type="button" className={peran === "alumni" ? "on" : ""} onClick={() => setPeran("alumni")}>
            Login Alumni
          </button>
        </div>

        {state?.error && <div className="err">{state.error}</div>}

        <form action={action}>
          <input type="hidden" name="peran" value={peran} />
          <div className="field">
            <label>{peran === "admin" ? "Email admin" : "NISN"}</label>
            <input
              name="identitas"
              key={peran}
              autoComplete="username"
              placeholder={peran === "admin" ? "admin@smkn1tambelangan.sch.id" : "NISN 10 digit"}
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
          </div>
          <Tombol />
        </form>

        <div className="demo-note">
          {peran === "alumni" ? (
            <>
              Password awal akun alumni sama dengan NISN. Belum punya akun?{" "}
              <Link href="/tracer">isi form tracer study</Link> — admin akan mendaftarkan Anda.
            </>
          ) : (
            <>
              Akun admin dibuat lewat Supabase (lihat README). Alumni yang ingin memperbarui data tanpa akun bisa lewat{" "}
              <Link href="/tracer">form tracer study</Link>.
            </>
          )}
        </div>

        <div className="center small muted" style={{ marginTop: 16 }}>
          Powered by{" "}
          <a href={SITUS.pengembang.url} target="_blank" rel="noopener noreferrer" className="powered">
            {SITUS.pengembang.nama}
          </a>
        </div>
      </div>
      <WhatsAppFab pesan="Halo Admin SIMALUM SMKN 1 Tambelangan, saya kesulitan login ke aplikasi alumni." />
    </div>
  );
}
