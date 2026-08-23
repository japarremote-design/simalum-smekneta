import { ImageResponse } from "next/og";
import { LOGO_OG } from "./logo-og";

export const alt = "SIMALUM — Sistem Informasi Alumni SMK Negeri 1 Tambelangan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg,#0f3a6e 0%,#184f95 55%,#2a78d6 100%)",
          color: "#fff",
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_OG} alt="" width={150} height={150} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, fontWeight: 700 }}>SMK NEGERI 1 TAMBELANGAN</div>
            <div style={{ fontSize: 22, color: "#cde2fb" }}>Kabupaten Sampang · Jawa Timur</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 86, fontWeight: 800, letterSpacing: -1 }}>SIMALUM</div>
          <div style={{ fontSize: 34, color: "#e6eefb", lineHeight: 1.35 }}>
            Sistem Informasi Alumni — data diri, riwayat kerja &amp; studi, tracer study, dan laporan keterserapan lulusan.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 24, color: "#cde2fb" }}>
          <div
            style={{
              display: "flex",
              padding: "8px 18px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.16)",
              fontWeight: 700,
              color: "#fff",
            }}
          >
            Tracer Study Online
          </div>
          <div style={{ display: "flex" }}>Powered by Qfaz Digital</div>
        </div>
      </div>
    ),
    size,
  );
}
