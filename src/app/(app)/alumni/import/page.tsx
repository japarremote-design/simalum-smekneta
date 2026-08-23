"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { importAlumni } from "./actions";

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" disabled={pending}>
      {pending ? "Memproses…" : "Import sekarang"}
    </button>
  );
}

const CONTOH = `nisn,nis,nama,jenis_kelamin,jurusan_kode,tahun_masuk,tahun_lulus,no_hp,email,status,instansi_terkini
3512345678,22.001,Ahmad Hidayat,L,TKJ,2022,2025,085712345678,ahmad@gmail.com,Bekerja,PT Telkom Akses
3598765432,22.002,Siti Rahmawati,P,APHP,2022,2025,085798765432,siti@gmail.com,Kuliah,Universitas Trunojoyo Madura`;

export default function ImportPage() {
  const [state, action] = useActionState(
    importAlumni,
    null as { ok?: string; error?: string; dilewati?: string[] } | null,
  );

  return (
    <>
      <div className="rowflex" style={{ marginBottom: 12 }}>
        <Link className="btn btn-sm" href="/alumni">
          ‹ Kembali
        </Link>
      </div>
      <h2 style={{ marginTop: 0 }}>Import data alumni dari CSV</h2>

      {state?.error && <div className="alert err">{state.error}</div>}
      {state?.ok && <div className="alert ok">{state.ok}</div>}

      <div className="card">
        <h3>Ketentuan file</h3>
        <div className="sub">
          Baris pertama harus berisi nama kolom. Kolom wajib: <code>nisn</code> dan <code>nama</code>. Kolom opsional:{" "}
          <code>nis</code>, <code>jenis_kelamin</code>, <code>jurusan_kode</code>, <code>tahun_masuk</code>,{" "}
          <code>tahun_lulus</code>, <code>no_hp</code>, <code>email</code>, <code>alamat</code>, <code>status</code>,{" "}
          <code>instansi_terkini</code>, <code>posisi</code>, <code>kota</code>, <code>provinsi</code>. Baris dengan NISN
          yang sudah ada akan dilewati, bukan ditimpa.
        </div>

        <form action={action}>
          <div className="field">
            <label>Pilih file CSV</label>
            <input type="file" name="berkas" accept=".csv,.txt" />
            <div className="hint">Dari Excel: File → Save As → CSV UTF-8.</div>
          </div>
          <div className="field">
            <label>…atau tempel isinya di sini</label>
            <textarea name="teks" rows={7} placeholder={CONTOH} style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }} />
          </div>
          <Tombol />
        </form>
      </div>

      {state?.dilewati && state.dilewati.length > 0 && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3>Baris yang dilewati ({state.dilewati.length})</h3>
          <ul className="small">
            {state.dilewati.slice(0, 80).map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
