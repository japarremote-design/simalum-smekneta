"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function ExportButton() {
  const sp = useSearchParams();
  const p = new URLSearchParams();
  ["q", "jur", "tahun", "status"].forEach((k) => {
    const v = sp.get(k);
    if (v) p.set(k, v);
  });
  return (
    <>
      <Link className="btn" href="/alumni/import">
        Import CSV
      </Link>
      <a className="btn" href={"/api/export?" + p.toString()}>
        Export CSV
      </a>
    </>
  );
}
