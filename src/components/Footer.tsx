import { SITUS } from "@/lib/situs";

export default function Footer() {
  return (
    <footer className="footer no-print">
      <div className="footer-in">
        <div>
          © {new Date().getFullYear()} {SITUS.sekolah} · {SITUS.daerah}
        </div>
        <div>
          Powered by{" "}
          <a href={SITUS.pengembang.url} target="_blank" rel="noopener noreferrer" className="powered">
            {SITUS.pengembang.nama}
          </a>
        </div>
      </div>
    </footer>
  );
}
