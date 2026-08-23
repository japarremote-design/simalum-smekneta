import React from "react";

export type Titik = { k: string; v: number; c?: string };

export function HBar({ data, color = "var(--s1)", unit = "alumni" }: { data: Titik[]; color?: string; unit?: string }) {
  const max = Math.max(1, ...data.map((d) => d.v));
  const rowH = 30,
    w = 560,
    labW = data.some((d) => d.k.length > 14) ? 170 : 120,
    pad = 8;
  const h = data.length * rowH + pad;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: h }} role="img">
      {data.map((d, i) => {
        const y = i * rowH + pad / 2;
        const bw = Math.max(2, ((w - labW - 56) * d.v) / max);
        return (
          <g key={d.k} className="barhit">
            <title>{`${d.k} — ${d.v} ${unit}`}</title>
            <text x={labW - 10} y={y + 15} textAnchor="end" dominantBaseline="middle">
              {d.k}
            </text>
            <rect className="mark" x={labW} y={y + 4} width={bw} height={rowH - 14} rx={4} fill={d.c || color} />
            <text className="val tabular" x={labW + bw + 8} y={y + 15} dominantBaseline="middle">
              {d.v}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function VBar({ data, color = "var(--s1)", unit = "alumni" }: { data: Titik[]; color?: string; unit?: string }) {
  const w = 560,
    h = 210,
    padL = 34,
    padB = 26,
    padT = 12;
  const max = Math.max(1, ...data.map((d) => d.v));
  const bw = (w - padL - 8) / Math.max(1, data.length);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: h }} role="img">
      {[0, 1, 2, 3, 4].map((g) => {
        const y = padT + ((h - padT - padB) * g) / 4;
        return (
          <g key={g}>
            <line className="gridline" x1={padL} y1={y} x2={w} y2={y} />
            <text x={padL - 7} y={y} textAnchor="end" dominantBaseline="middle" className="tabular">
              {Math.round(max * (1 - g / 4))}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const bh = ((h - padT - padB) * d.v) / max;
        const x = padL + i * bw + bw * 0.18;
        const y = h - padB - bh;
        return (
          <g key={d.k} className="barhit">
            <title>{`${d.k} — ${d.v} ${unit}`}</title>
            <rect className="mark" x={x} y={y} width={bw * 0.64} height={Math.max(2, bh)} rx={4} fill={color} />
            <text className="val tabular" x={x + bw * 0.32} y={y - 5} textAnchor="middle">
              {d.v}
            </text>
            <text x={x + bw * 0.32} y={h - padB + 15} textAnchor="middle">
              {d.k}
            </text>
          </g>
        );
      })}
      <line className="baseline" x1={padL} y1={h - padB} x2={w} y2={h - padB} />
    </svg>
  );
}

export type Seri = { name: string; color: string; vals: number[] };

export function SBar({ cats, series }: { cats: string[]; series: Seri[] }) {
  const w = 560,
    rowH = 34,
    labW = 64,
    pad = 6;
  const h = Math.max(rowH, cats.length * rowH) + pad;
  const max = Math.max(1, ...cats.map((_, i) => series.reduce((t, s) => t + (s.vals[i] || 0), 0)));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: h }} role="img">
      {cats.map((c, i) => {
        let x = labW;
        const y = i * rowH + pad / 2;
        const total = series.reduce((t, s) => t + (s.vals[i] || 0), 0);
        const segs = series.map((s) => {
          const v = s.vals[i] || 0;
          const bw = ((w - labW - 42) * v) / max;
          const seg = { s, v, x, bw };
          x += bw;
          return seg;
        });
        return (
          <g key={c}>
            <text x={labW - 10} y={y + 15} textAnchor="end" dominantBaseline="middle">
              {c}
            </text>
            {segs
              .filter((s) => s.v > 0)
              .map((s) => (
                <g key={s.s.name} className="barhit">
                  <title>{`${c} · ${s.s.name} — ${s.v} alumni`}</title>
                  <rect
                    className="mark"
                    x={s.x}
                    y={y + 4}
                    width={Math.max(1, s.bw - 2)}
                    height={rowH - 14}
                    rx={4}
                    fill={s.s.color}
                  />
                </g>
              ))}
            <text className="val tabular" x={x + 6} y={y + 15} dominantBaseline="middle">
              {total}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function Legend({ series }: { series: { name: string; color: string }[] }) {
  return (
    <div className="legend">
      {series.map((s) => (
        <span key={s.name}>
          <span className="dot" style={{ background: s.color }} />
          {s.name}
        </span>
      ))}
    </div>
  );
}
