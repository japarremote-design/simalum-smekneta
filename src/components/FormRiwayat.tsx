"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { simpanRiwayat } from "@/app/actions";
import { GAJI_LIST, JENIS_LIST, type Riwayat } from "@/lib/types";

function Simpan() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" disabled={pending}>
      {pending ? "Menyimpan…" : "Simpan riwayat"}
    </button>
  );
}

export default function FormRiwayat({ alumniId, riwayat }: { alumniId: string; riwayat?: Riwayat | null }) {
  const [buka, setBuka] = useState(!!riwayat);
  const [state, action] = useActionState(simpanRiwayat, null as { ok?: string; error?: string } | null);
  const v = (k: keyof Riwayat) => (riwayat?.[k] ?? "") as string;

  if (!buka)
    return (
      <button className="btn btn-sm btn-primary" onClick={() => setBuka(true)}>
        + Tambah riwayat
      </button>
    );

  return (
    <form action={action} className="card" style={{ marginTop: 10 }}>
      {state?.error && <div className="alert err">{state.error}</div>}
      {state?.ok && <div className="alert ok">{state.ok}</div>}
      <input type="hidden" name="alumni_id" value={alumniId} />
      {riwayat && <input type="hidden" name="id" value={riwayat.id} />}

      <div className="grid2">
        <div className="field">
          <label>Jenis</label>
          <select name="jenis" defaultValue={riwayat?.jenis ?? "Kerja"}>
            {JENIS_LIST.map((j) => (
              <option key={j}>{j}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Nama instansi / perusahaan / kampus *</label>
          <input name="instansi" defaultValue={v("instansi")} required />
        </div>
      </div>
      <div className="grid2">
        <div className="field">
          <label>Posisi / jabatan</label>
          <input name="posisi" defaultValue={v("posisi")} />
        </div>
        <div className="field">
          <label>Bidang / program studi</label>
          <input name="bidang" defaultValue={v("bidang")} />
        </div>
      </div>
      <div className="grid2">
        <div className="field">
          <label>Kota</label>
          <input name="kota" defaultValue={v("kota")} />
        </div>
        <div className="field">
          <label>Provinsi</label>
          <input name="provinsi" defaultValue={v("provinsi")} />
        </div>
      </div>
      <div className="grid3">
        <div className="field">
          <label>Tanggal mulai</label>
          <input name="tgl_mulai" type="date" defaultValue={v("tgl_mulai")} />
        </div>
        <div className="field">
          <label>Tanggal selesai</label>
          <input name="tgl_selesai" type="date" defaultValue={v("tgl_selesai")} />
          <div className="hint">Kosongkan bila masih aktif sampai sekarang.</div>
        </div>
        <div className="field">
          <label>Kisaran penghasilan</label>
          <select name="gaji_range" defaultValue={riwayat?.gaji_range ?? "-"}>
            {GAJI_LIST.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label>
          <input type="checkbox" name="linier" defaultChecked={!!riwayat?.linier} /> Sesuai / linier dengan jurusan
        </label>
      </div>
      <div className="field">
        <label>Bukti (surat kerja, kartu mahasiswa, dll — pdf/gambar)</label>
        <input name="bukti" type="file" accept="image/*,application/pdf" />
      </div>

      <div className="rowflex">
        <Simpan />
        <button type="button" className="btn" onClick={() => setBuka(false)}>
          Tutup
        </button>
      </div>
    </form>
  );
}
