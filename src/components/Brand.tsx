import { SITUS } from "@/lib/situs";

/** Logo sekolah + nama aplikasi. Sumbernya public/logo.png — timpa file itu kalau logo sekolah berubah. */
export function Brand({ ukuran = 42, sub }: { ukuran?: number; sub?: string }) {
  return (
    <div className="logo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt={`Logo ${SITUS.sekolah}`}
        width={ukuran}
        height={ukuran}
        style={{ width: ukuran, height: ukuran, flex: "none" }}
      />
      <div>
        <b>{SITUS.nama}</b>
        <span>{sub ?? `${SITUS.namaPanjang} · ${SITUS.sekolahPendek}`}</span>
      </div>
    </div>
  );
}
