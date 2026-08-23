/* Ikon garis sederhana — modul biasa (BUKAN "use client") supaya elemennya
   bisa dibuat di Server Component lalu dikirim sebagai prop ke menu bawah. */
import React from "react";

const ik = (d: string) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export const IKON = {
  dashboard: ik("M3 13h8V3H3zM13 21h8V11h-8zM13 3v6h8V3zM3 21h8v-6H3z"),
  alumni: ik("M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87"),
  tracer: ik("M4 4h16v16H4zM4 8l8 5 8-5"),
  laporan: ik("M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"),
  profil: ik("M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8"),
  direktori: ik("M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"),
  statistik: ik("M18 20V10M12 20V4M6 20v-6"),
};
