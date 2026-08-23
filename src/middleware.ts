import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIK = ["/login", "/tracer", "/auth"];

/** Berkas yang HARUS bisa diakses tanpa login, kalau tidak:
 *  - manifest & sw.js diblokir → tombol "Pasang di HP" tidak muncul
 *  - opengraph-image diblokir → preview link di WhatsApp/Facebook kosong */
const BERKAS_PUBLIK = [
  "/manifest.webmanifest",
  "/sw.js",
  "/offline.html",
  "/opengraph-image",
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico",
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Kalau environment variable Supabase belum diisi, jangan sampai seluruh
  // aplikasi jadi error 500 — biarkan lewat supaya halaman bisa menampilkan
  // pesan yang jelas ke pengurus aplikasi.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list: { name: string; value: string; options?: CookieOptions }[]) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const publik =
    PUBLIK.some((p) => path.startsWith(p)) ||
    BERKAS_PUBLIK.some((f) => path === f || path.startsWith(f + "/"));

  if (!user && !publik) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|offline.html|opengraph-image|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt|xml|js)$).*)",
  ],
};
