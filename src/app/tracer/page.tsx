import { supabaseServer, supabaseSiap } from "@/lib/supabase/server";
import FormTracer from "./FormTracer";
import { Brand } from "@/components/Brand";
import Footer from "@/components/Footer";
import WhatsAppFab from "@/components/WhatsAppFab";
import type { Jurusan } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tracer Study Alumni — SMKN 1 Tambelangan",
  description: "Form penelusuran alumni SMKN 1 Tambelangan. Isi data pekerjaan, kuliah, atau usaha Anda saat ini.",
};

export default async function TracerPage() {
  let jurusan: { kode: string; nama: string }[] = [];
  if (supabaseSiap) {
    const sb = await supabaseServer();
    const { data } = await sb.from("jurusan").select("id, kode, nama, urutan").order("urutan");
    jurusan = ((data ?? []) as Jurusan[]).map((j) => ({ kode: j.kode, nama: j.nama }));
  }
  const fallback = [
    { kode: "TKJ", nama: "Teknik Komputer & Jaringan" },
    { kode: "TKRO", nama: "Teknik Kendaraan Ringan Otomotif" },
    { kode: "TBSM", nama: "Teknik & Bisnis Sepeda Motor" },
    { kode: "APHP", nama: "Agribisnis Pengolahan Hasil Pertanian" },
    { kode: "ATPH", nama: "Agribisnis Tanaman Pangan & Hortikultura" },
  ];

  return (
    <div className="public-wrap">
      <div className="public-head">
        <Brand ukuran={54} sub="Tracer Study Alumni · SMK Negeri 1 Tambelangan" />
      </div>

      <div className="alert">
        Halo alumni! Isi form ini supaya sekolah tahu Anda sekarang di mana — bekerja, kuliah, atau punya usaha sendiri.
        Data dipakai untuk laporan keterserapan lulusan dan tidak dipublikasikan. Tidak perlu punya akun.
      </div>

      <FormTracer jurusan={jurusan.length ? jurusan : fallback} />
      <Footer />
      <WhatsAppFab pesan="Halo Admin SIMALUM SMKN 1 Tambelangan, saya mau tanya soal pengisian tracer study alumni." />
    </div>
  );
}
