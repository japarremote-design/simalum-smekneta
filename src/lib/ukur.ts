"use client";

import { useEffect, type RefObject } from "react";

/**
 * Mengukur tinggi sebuah elemen mengambang lalu menuliskannya ke variabel CSS
 * di <html>, supaya elemen mengambang lain bisa menumpuk di atasnya tanpa
 * saling menindih — berapa pun tingginya (teks bisa jadi 1 atau 2 baris,
 * dan tinggi menu bawah berbeda antar HP).
 *
 * Dipakai oleh menu bawah (--nav-bawah) dan ajakan pasang di HP (--pasang-tinggi).
 */
export function useTinggiKeCssVar(ref: RefObject<HTMLElement | null>, namaVar: string, aktif = true) {
  useEffect(() => {
    const akar = document.documentElement;
    const el = ref.current;

    if (!aktif || !el) {
      akar.style.setProperty(namaVar, "0px");
      return () => akar.style.setProperty(namaVar, "0px");
    }

    const perbarui = () => akar.style.setProperty(namaVar, `${Math.round(el.getBoundingClientRect().height)}px`);
    perbarui();

    const pengamat = new ResizeObserver(perbarui);
    pengamat.observe(el);
    window.addEventListener("resize", perbarui);

    return () => {
      pengamat.disconnect();
      window.removeEventListener("resize", perbarui);
      akar.style.setProperty(namaVar, "0px");
    };
  }, [ref, namaVar, aktif]);
}
