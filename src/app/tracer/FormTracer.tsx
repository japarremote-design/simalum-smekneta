"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { kirimTracer } from "../actions";
import { GAJI_LIST, JENIS_LIST } from "@/lib/types";

function Kirim() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" disabled={pending} style={{ width: "100%", justifyContent: "center" }}>
      {pending ? "Mengirim…" : "Kirim data saya"}
    </button>
  );
}

export default function FormTracer({ jurusan }: { jurusan: { kode: string; nama: string }[] }) {
  const [state, action] = useActionState(kirimTracer, null as { ok?: string; error?: string } | null);
  const tahunIni = new Date().getFullYear();

  if (state?.ok)
    return (
      <div className="card center" style={{ padding: 30 }}>
        <div style={{ fontSize: 34 }}>✓</div>
        <h2 style={{ margin: "8px 0" }}>Terima kasih!</h2>
        <p className="muted">{state.ok}</p>
        <Link className="btn" href="/tracer">
          Isi lagi untuk alumni lain
        </Link>
      </div>
    );

  return (
    <form action={action} className="card">
      {state?.error && <div className="alert err">{state.error}</div>}

      <fieldset>
        <legend>Data diri</legend>
        <div className="grid2">
          <div className="field">
            <label>NISN *</label>
            <input name="nisn" required placeholder="10 digit" />
            <div className="hint">Dipakai untuk mencocokkan dengan data sekolah.</div>
          </div>
          <div className="field">
            <label>NIS</label>
            <input name="nis" />
          </div>
        </div>
        <div className="field">
          <label>Nama lengkap *</label>
          <input name="nama" required />
        </div>
        <div className="grid2">
          <div className="field">
            <label>Jurusan</label>
            <select name="jurusan_kode" defaultValue="">
              <option value="">— pilih —</option>
              {jurusan.map((j) => (
                <option key={j.kode} value={j.kode}>
                  {j.kode} — {j.nama}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Tahun lulus</label>
            <input name="tahun_lulus" type="number" min={1990} max={tahunIni} placeholder={String(tahunIni)} />
          </div>
        </div>
        <div className="grid2">
          <div className="field">
            <label>No. HP / WhatsApp</label>
            <input name="no_hp" />
          </div>
          <div className="field">
            <label>Email</label>
            <input name="email" type="email" />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Kegiatan sekarang</legend>
        <div className="grid2">
          <div className="field">
            <label>Saat ini saya</label>
            <select name="jenis" defaultValue="Kerja">
              {JENIS_LIST.map((j) => (
                <option key={j} value={j}>
                  {j === "Kerja" ? "Bekerja" : j === "Kuliah" ? "Kuliah" : j === "Wirausaha" ? "Wirausaha" : "Magang"}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Nama perusahaan / kampus / usaha</label>
            <input name="instansi" />
          </div>
        </div>
        <div className="grid2">
          <div className="field">
            <label>Posisi / jabatan</label>
            <input name="posisi" />
          </div>
          <div className="field">
            <label>Bidang / program studi</label>
            <input name="bidang" />
          </div>
        </div>
        <div className="grid3">
          <div className="field">
            <label>Kota</label>
            <input name="kota" />
          </div>
          <div className="field">
            <label>Provinsi</label>
            <input name="provinsi" />
          </div>
          <div className="field">
            <label>Mulai sejak</label>
            <input name="tgl_mulai" type="date" />
          </div>
        </div>
        <div className="field">
          <label>Kisaran penghasilan per bulan</label>
          <select name="gaji_range" defaultValue="-">
            {GAJI_LIST.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
          <div className="hint">Opsional — hanya dipakai untuk rekap, tidak ditampilkan ke publik.</div>
        </div>
        <div className="field">
          <label>Catatan / pesan untuk sekolah</label>
          <textarea name="catatan" rows={3} />
        </div>
      </fieldset>

      <Kirim />
      <div className="center small muted" style={{ marginTop: 12 }}>
        Sudah punya akun alumni? <Link href="/login">Masuk di sini</Link>
      </div>
    </form>
  );
}
