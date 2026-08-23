import type { Metadata, Viewport } from "next";
import { SITUS } from "@/lib/situs";
import Pwa from "@/components/Pwa";
import "./globals.css";

const JUDUL = `${SITUS.nama} — ${SITUS.namaPanjang} ${SITUS.sekolahPendek}`;
const RINGKAS = `Database alumni ${SITUS.sekolah}: data diri, riwayat kerja & studi, tracer study online, dan laporan keterserapan lulusan.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITUS.url),
  title: { default: JUDUL, template: `%s — ${SITUS.nama}` },
  description: RINGKAS,
  applicationName: SITUS.nama,
  keywords: [
    "alumni SMKN 1 Tambelangan",
    "tracer study SMK",
    "database alumni",
    "SMK Negeri 1 Tambelangan",
    "Sampang",
    "keterserapan lulusan",
  ],
  authors: [{ name: SITUS.pengembang.nama, url: SITUS.pengembang.url }],
  creator: SITUS.pengembang.nama,
  publisher: SITUS.sekolah,
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: SITUS.nama, statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITUS.url,
    siteName: `${SITUS.nama} · ${SITUS.sekolahPendek}`,
    title: JUDUL,
    description: RINGKAS,
  },
  twitter: {
    card: "summary_large_image",
    title: JUDUL,
    description: RINGKAS,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#184f95" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
  ],
};

/** Data terstruktur supaya pencarian Google menampilkan nama & logo sekolah. */
const skemaSekolah = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: SITUS.sekolah,
  alternateName: SITUS.sekolahPendek,
  url: SITUS.url,
  logo: `${SITUS.url}/icon-512.png`,
  address: { "@type": "PostalAddress", addressLocality: "Tambelangan", addressRegion: "Jawa Timur", addressCountry: "ID" },
  telephone: `+${SITUS.whatsapp.internasional}`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-theme="light">
      <body>
        {children}
        <Pwa />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(skemaSekolah) }} />
      </body>
    </html>
  );
}
