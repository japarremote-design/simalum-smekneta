/* Service worker SIMALUM — dibutuhkan supaya aplikasi bisa "Pasang di HP".
   Strategi sengaja dibuat konservatif: halaman & data SELALU diambil dari jaringan
   supaya data alumni tidak pernah basi. Yang di-cache hanya aset statis dan
   halaman offline cadangan. */
const VERSI = "simalum-v1";
const ASET = ["/offline.html", "/logo.png", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png", "/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSI).then((c) => c.addAll(ASET)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((k) => Promise.all(k.filter((n) => n !== VERSI).map((n) => caches.delete(n)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigasi halaman: jaringan dulu, kalau offline tampilkan halaman cadangan.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/offline.html")));
    return;
  }

  // Aset statis: pakai cache kalau ada, sambil diperbarui di belakang layar.
  if (url.pathname.startsWith("/_next/static") || ASET.includes(url.pathname)) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const salinan = res.clone();
            caches.open(VERSI).then((c) => c.put(req, salinan));
            return res;
          }),
      ),
    );
  }
});
