"use client";

import { useEffect } from "react";

/**
 * Jaring pengaman tampilan.
 *
 * Tanpa berkas ini, error apa pun yang lolos ke browser hanya memunculkan
 * "Application error: a client-side exception has occurred" — pengguna tidak
 * tahu apa-apa dan pengurus aplikasi tidak tahu harus melapor apa.
 * Di sini errornya ditampilkan apa adanya beserta tombol untuk mencoba lagi.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("SIMALUM error:", error);
  }, [error]);

  return (
    <div style={{ padding: 24, maxWidth: 560, margin: "0 auto" }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Ada yang bermasalah</h2>
        <p className="muted">
          Halaman ini gagal dimuat. Coba lagi dulu — kalau masih sama, kirimkan keterangan di bawah ini ke pengelola
          aplikasi.
        </p>

        <pre
          style={{
            background: "var(--plane)",
            border: "1px solid var(--line)",
            borderRadius: 9,
            padding: 11,
            fontSize: 12,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            marginBottom: 14,
          }}
        >
          {error.message || "Tidak ada keterangan."}
          {error.digest ? `\n\nKode: ${error.digest}` : ""}
        </pre>

        <div className="rowflex">
          <button className="btn btn-primary" onClick={() => reset()}>
            Coba lagi
          </button>
          <a className="btn" href="/dashboard">
            Kembali ke dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
