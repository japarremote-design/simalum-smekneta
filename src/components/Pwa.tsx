"use client";

import { useEffect, useRef, useState } from "react";
import { useTinggiKeCssVar } from "@/lib/ukur";

type PromptPasang = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Mendaftarkan service worker + menawarkan "Pasang di HP".
 *  Di Android/Chrome muncul tombol pasang; di iPhone/Safari muncul petunjuk
 *  manual karena Apple tidak menyediakan tombol otomatis. */
export default function Pwa() {
  const [prompt, setPrompt] = useState<PromptPasang | null>(null);
  const [ios, setIos] = useState(false);
  const [tutup, setTutup] = useState(false);
  const [sudahTerpasang, setSudahTerpasang] = useState(true);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const berdiriSendiri =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setSudahTerpasang(berdiriSendiri);

    const iPhone = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const safari = /safari/i.test(navigator.userAgent) && !/crios|fxios|chrome/i.test(navigator.userAgent);
    setIos(iPhone && safari && !berdiriSendiri);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as PromptPasang);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => {
      setPrompt(null);
      setSudahTerpasang(true);
    });
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const tampil = !tutup && !sudahTerpasang && (prompt !== null || ios);

  return <Bar ref={barRef} tampil={tampil} ios={ios} prompt={prompt} onTutup={() => setTutup(true)} onSelesai={() => setPrompt(null)} />;
}

function Bar({
  ref,
  tampil,
  ios,
  prompt,
  onTutup,
  onSelesai,
}: {
  ref: React.RefObject<HTMLDivElement | null>;
  tampil: boolean;
  ios: boolean;
  prompt: PromptPasang | null;
  onTutup: () => void;
  onSelesai: () => void;
}) {
  // tinggi bar ditulis ke --pasang-tinggi; tombol WhatsApp naik sebanyak itu
  useTinggiKeCssVar(ref, "--pasang-tinggi", tampil);
  if (!tampil) return null;

  return (
    <div ref={ref} className="pasang-bar no-print" role="region" aria-label="Pasang aplikasi">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon-192.png" alt="" width={34} height={34} style={{ borderRadius: 8, flex: "none" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <b style={{ display: "block", fontSize: 13.5, lineHeight: 1.3 }}>Pasang di HP</b>
        <span className="small muted" style={{ lineHeight: 1.35, display: "block" }}>
          {ios ? "Ketuk ikon Bagikan → “Tambahkan ke Layar Utama”." : "Buka dari layar utama, tanpa browser."}
        </span>
      </div>
      {prompt && (
        <button
          className="btn btn-primary btn-sm"
          onClick={async () => {
            await prompt.prompt();
            await prompt.userChoice;
            onSelesai();
          }}
        >
          Pasang
        </button>
      )}
      <button className="btn btn-sm btn-ghost" onClick={onTutup} aria-label="Tutup">
        ✕
      </button>
    </div>
  );
}
