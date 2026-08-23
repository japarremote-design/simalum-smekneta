import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SIMALUM — Alumni SMKN 1 Tambelangan",
    short_name: "SIMALUM",
    description:
      "Database alumni SMK Negeri 1 Tambelangan: data diri, riwayat kerja & studi, tracer study, dan laporan keterserapan lulusan.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f9f9f7",
    theme_color: "#184f95",
    lang: "id",
    dir: "ltr",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Isi Tracer Study", short_name: "Tracer", url: "/tracer" },
      { name: "Data Alumni", short_name: "Alumni", url: "/alumni" },
      { name: "Laporan", short_name: "Laporan", url: "/laporan" },
    ],
  };
}
