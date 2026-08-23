#!/usr/bin/env python3
"""Buat ulang semua ikon aplikasi dari public/logo.png.

Jalankan kalau logo sekolah diganti:

    pip install pillow numpy scipy
    python3 scripts/buat-ikon.py

Kalau logo barunya masih berlatar hitam/putih (misalnya hasil foto atau JPG),
tambahkan --bersihkan supaya latarnya dihapus dulu jadi transparan:

    python3 scripts/buat-ikon.py logo-baru.jpg --bersihkan
"""
import sys, io, base64
from pathlib import Path
from PIL import Image, ImageFilter

AKAR = Path(__file__).resolve().parent.parent
PUB = AKAR / "public"
PUTIH = (255, 255, 255, 255)


def bersihkan_latar(img: Image.Image, tol=42, kikis_gelap=9) -> Image.Image:
    """Hapus latar polos jadi transparan, tanpa merusak isi logo.

    Warna latar dideteksi otomatis dari empat pojok gambar, jadi logo berlatar
    putih maupun hitam sama-sama bisa. Yang dihapus hanya area yang WARNANYA
    MIRIP LATAR **dan** NYAMBUNG KE PINGGIR gambar — sehingga bagian putih di
    dalam logo (kotak nama, halaman buku) tetap aman.

    Kalau latarnya gelap, hasil hapusnya dikikis beberapa piksel dulu karena
    garis tepi logo biasanya juga hitam dan menempel ke latar.
    """
    import numpy as np
    from scipy import ndimage

    a = np.asarray(img.convert("RGB")).astype(np.int16)
    pojok = np.array([a[2, 2], a[2, -3], a[-3, 2], a[-3, -3]])
    latar_warna = np.median(pojok, axis=0)
    mirip = np.abs(a - latar_warna).max(axis=2) < tol

    label, _ = ndimage.label(mirip)
    tepi = set(label[0, :]) | set(label[-1, :]) | set(label[:, 0]) | set(label[:, -1])
    tepi.discard(0)
    latar = np.isin(label, list(tepi))

    gelap = latar_warna.mean() < 110
    m = Image.fromarray((latar * 255).astype("uint8"), "L")
    if gelap:
        m = m.filter(ImageFilter.MinFilter(kikis_gelap * 2 + 1))
    else:
        # latar terang: lebarkan sedikit untuk membuang sisa bayangan JPG di tepi
        m = m.filter(ImageFilter.MaxFilter(3))

    alpha = Image.fromarray(255 - np.asarray(m)).filter(ImageFilter.GaussianBlur(0.6))
    out = img.convert("RGBA")
    out.putalpha(alpha)
    print(f"  latar terdeteksi: {tuple(int(x) for x in latar_warna)} ({'gelap' if gelap else 'terang'})")
    return out.crop(out.getbbox())


def jadikan_persegi(img: Image.Image, sisi=512) -> Image.Image:
    s = max(img.size)
    kanvas = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    kanvas.paste(img, ((s - img.width) // 2, (s - img.height) // 2), img)
    return kanvas.resize((sisi, sisi), Image.LANCZOS)


def ikon(logo, nama, ukuran, padding, latar=PUTIH, warna=96):
    kanvas = Image.new("RGBA", (ukuran, ukuran), latar)
    isi = int(ukuran * (1 - padding * 2))
    k = logo.resize((isi, isi), Image.LANCZOS)
    kanvas.paste(k, ((ukuran - isi) // 2, (ukuran - isi) // 2), k)
    kanvas.convert("RGB").quantize(colors=warna, method=Image.MEDIANCUT, dither=Image.NONE).save(
        PUB / nama, optimize=True
    )
    print(f"  {nama:<26} {ukuran}px")


def main():
    arg = [a for a in sys.argv[1:] if not a.startswith("--")]
    sumber = Path(arg[0]) if arg else PUB / "logo.png"
    img = Image.open(sumber).convert("RGBA")

    if "--bersihkan" in sys.argv:
        print("membersihkan latar…")
        img = bersihkan_latar(img)

    logo = jadikan_persegi(img, 512)
    logo.quantize(colors=128, method=Image.FASTOCTREE, dither=Image.NONE).save(PUB / "logo.png", optimize=True)
    print(f"  {'logo.png':<26} 512px")

    logo = Image.open(PUB / "logo.png").convert("RGBA")
    ikon(logo, "icon-192.png", 192, 0.10)
    ikon(logo, "icon-512.png", 512, 0.10, warna=128)
    ikon(logo, "apple-touch-icon.png", 180, 0.09)
    # maskable: Android memotong sampai ~20% tepi jadi bulat
    ikon(logo, "icon-maskable-512.png", 512, 0.23)

    fav = Image.new("RGBA", (128, 128), PUTIH)
    k = logo.resize((120, 120), Image.LANCZOS)
    fav.paste(k, (4, 4), k)
    fav.convert("RGB").save(PUB / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print(f"  {'favicon.ico':<26} multi-ukuran")

    # logo kecil untuk ditanam di gambar preview Open Graph
    og = Image.new("RGBA", (300, 300), (0, 0, 0, 0))
    og.alpha_composite(logo.resize((300, 300), Image.LANCZOS))
    buf = io.BytesIO()
    og.quantize(colors=64, method=Image.FASTOCTREE, dither=Image.NONE).save(buf, format="PNG", optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode()
    (AKAR / "src/app/logo-og.ts").write_text(
        "/* Logo sekolah versi kecil (base64) untuk ditanam di gambar preview Open Graph.\n"
        "   Dibuat otomatis oleh scripts/buat-ikon.py — jangan diedit tangan. */\n"
        f'export const LOGO_OG = "data:image/png;base64,{b64}";\n'
    )
    print(f"  {'src/app/logo-og.ts':<26} {len(b64) // 1024} KB")
    print("\n✓ Selesai. Jalankan npm run dev / deploy ulang untuk melihat hasilnya.")


if __name__ == "__main__":
    main()
