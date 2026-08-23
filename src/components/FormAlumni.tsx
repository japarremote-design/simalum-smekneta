"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { simpanAlumni } from "@/app/actions";
import type { Alumni, Jurusan } from "@/lib/types";

function Simpan({ label = "Simpan" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" disabled={pending}>
      {pending ? "Menyimpan…" : label}
    </button>
  );
}

export default function FormAlumni({
  alumni,
  jurusan,
  batalHref,
}: {
  alumni?: Alumni | null;
  jurusan: Jurusan[];
  batalHref: string;
}) {
  const [state, action] = useActionState(simpanAlumni, null as { ok?: string; error?: string } | null);
  const v = (k: keyof Alumni) => (alumni?.[k] ?? "") as string;

  return (
    <form action={action}>
      {state?.error && <div className="alert err">{state.error}</div>}
      {state?.ok && <div className="alert ok">{state.ok}</div>}
      {alumni && <input type="hidden" name="id" value={alumni.id} />}

      <fieldset>
        <legend>Identitas</legend>
        <div className="grid2">
          <div className="field">
            <label>NISN *</label>
            <input name="nisn" defaultValue={v("nisn")} required />
            <div className="hint">Dipakai juga sebagai username login alumni.</div>
          </div>
          <div className="field">
            <label>NIS *</label>
            <input name="nis" defaultValue={v("nis")} required />
          </div>
        </div>
        <div className="field">
          <label>Nama lengkap *</label>
          <input name="nama" defaultValue={v("nama")} required />
        </div>
        <div className="grid3">
          <div className="field">
            <label>Jenis kelamin</label>
            <select name="jenis_kelamin" defaultValue={alumni?.jenis_kelamin ?? "L"}>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
          <div className="field">
            <label>Tempat lahir</label>
            <input name="tempat_lahir" defaultValue={v("tempat_lahir")} />
          </div>
          <div className="field">
            <label>Tanggal lahir</label>
            <input name="tanggal_lahir" type="date" defaultValue={v("tanggal_lahir")} />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Sekolah</legend>
        <div className="grid3">
          <div className="field">
            <label>Jurusan *</label>
            <select name="jurusan_id" defaultValue={alumni?.jurusan_id ?? jurusan[0]?.id}>
              {jurusan.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.kode} — {j.nama}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Tahun masuk</label>
            <input name="tahun_masuk" type="number" defaultValue={alumni?.tahun_masuk ?? ""} />
          </div>
          <div className="field">
            <label>Tahun lulus</label>
            <input name="tahun_lulus" type="number" defaultValue={alumni?.tahun_lulus ?? ""} />
          </div>
        </div>
        <div className="field">
          <label>Rombel terakhir</label>
          <input name="rombel" defaultValue={v("rombel")} placeholder="mis. XII TKJ 1" />
        </div>
      </fieldset>

      <fieldset>
        <legend>Kontak & alamat</legend>
        <div className="grid2">
          <div className="field">
            <label>No. HP / WhatsApp</label>
            <input name="no_hp" defaultValue={v("no_hp")} />
          </div>
          <div className="field">
            <label>Email pribadi</label>
            <input name="email" type="email" defaultValue={v("email")} />
          </div>
        </div>
        <div className="field">
          <label>Alamat</label>
          <textarea name="alamat" rows={2} defaultValue={v("alamat")} />
        </div>
        <div className="grid3">
          <div className="field">
            <label>Desa</label>
            <input name="desa" defaultValue={v("desa")} />
          </div>
          <div className="field">
            <label>Kecamatan</label>
            <input name="kecamatan" defaultValue={v("kecamatan")} />
          </div>
          <div className="field">
            <label>Kabupaten</label>
            <input name="kabupaten" defaultValue={alumni?.kabupaten ?? "Sampang"} />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Foto</legend>
        <div className="field">
          <label>Foto profil (jpg/png, maks 2 MB)</label>
          <input name="foto" type="file" accept="image/*" />
          <div className="hint">Tersimpan di Supabase Storage bucket &quot;berkas&quot; dan hanya bisa diakses pengguna yang login.</div>
        </div>
      </fieldset>

      <div className="rowflex">
        <Simpan label={alumni ? "Simpan perubahan" : "Simpan & buatkan akun login"} />
        <a className="btn" href={batalHref}>
          Batal
        </a>
      </div>
    </form>
  );
}
