/** Satu tempat untuk semua identitas sekolah & pengembang.
 *  Ganti di sini kalau ada perubahan — dipakai di seluruh aplikasi. */
export const SITUS = {
  nama: "SIMALUM",
  namaPanjang: "Sistem Informasi Alumni",
  sekolah: "SMK Negeri 1 Tambelangan",
  sekolahPendek: "SMKN 1 Tambelangan",
  daerah: "Kabupaten Sampang, Jawa Timur",
  /** Dipakai untuk Open Graph & canonical. Di Vercel isi NEXT_PUBLIC_SITE_URL. */
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://alumni-smkn1tambelangan.vercel.app",

  pengembang: {
    nama: "Qfaz Digital",
    url: "https://qfazdigital.my.id/",
  },

  whatsapp: {
    /** Format lokal untuk ditampilkan */
    tampil: "0838-5322-3801",
    /** Format internasional untuk wa.me (tanpa 0 di depan, pakai 62) */
    internasional: "6283853223801",
    pesanAwal:
      "Halo Admin SIMALUM SMKN 1 Tambelangan, saya ingin bertanya tentang data alumni / tracer study.",
  },
} as const;

export const waLink = (pesan?: string) =>
  `https://wa.me/${SITUS.whatsapp.internasional}?text=${encodeURIComponent(pesan ?? SITUS.whatsapp.pesanAwal)}`;
