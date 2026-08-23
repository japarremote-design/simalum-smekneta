"use client";

import { useEffect, useState } from "react";

type PromptPasang = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Mendaftarkan service worker + menawarkan "Pasang di HP".
 *  Di Android/Chrome muncul tombol pasang; di iPhone/Safari muncul petunjuk
 *  manual karena Apple tidak menyediakan tombol otomatis. */
export default function Pwa() {
  const [prompt, setPrompt] = useState<PromptPasang | null>(null);
  const [ios, setIos] = useState(false);
  const [tutup, setTutup] = useState(false);
  const [sudahTerpasang, setSudahTerpasang] = useState(true);

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

  if (tutup || sudahTerpasang || (!prompt && !ios)) return null;

  return (
    <div className="pasang-bar no-print" role="region" aria-label="Pasang aplikasi">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon-192.png" alt="" width={38} height={38} style={{ borderRadius: 9, flex: "none" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <b style={{ display: "block", fontSize: 13.5 }}>Pasang SIMALUM di HP</b>
        <span className="small muted">
          {ios ? "Ketuk ikon Bagikan, lalu pilih “Tambahkan ke Layar Utama”." : "Buka cepat dari layar utama, tanpa browser."}
        </span>
      </div>
      {prompt && (
        <button
          className="btn btn-primary btn-sm"
          onClick={async () => {
            await prompt.prompt();
            await prompt.userChoice;
            setPrompt(null);
          }}
        >
          Pasang
        </button>
      )}
      <button className="btn btn-sm btn-ghost" onClick={() => setTutup(true)} aria-label="Tutup">
        ✕
      </button>
    </div>
  );
}
