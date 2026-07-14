import { useId } from "react";

// Grafik garis SVG ringan dengan area gradient + grid.
// props: values (number[]), color (hex), height, labels (string[] untuk sumbu X)
export default function LineChart({
  values = [],
  color = "#14b8a6",
  height = 150,
  labels = [],
  strokeWidth = 2.5,
}) {
  const gid = useId();
  const w = 560;
  const h = height;
  const padY = h * 0.12;

  if (!values || values.length < 2) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-slate-50 text-xs font-medium text-slate-400 ring-1 ring-slate-100"
        style={{ height: h }}
      >
        Menunggu data...
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min < 1e-6 ? 1e-6 : max - min;
  const xs = values.map((_, i) => (i / (values.length - 1)) * w);
  const ys = values.map((v) => h - padY - ((v - min) / range) * (h - padY * 2));
  const line = xs
    .map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`)
    .join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  const grid = [0.25, 0.5, 0.75].map((g) => h * g);

  return (
    <div>
      <div className="overflow-hidden rounded-lg bg-slate-50 ring-1 ring-slate-100">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          className="w-full"
          style={{ height: h }}
        >
          <defs>
            <linearGradient id={`grad-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {grid.map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2={w}
              y2={y}
              stroke="rgb(226 232 240)"
              strokeWidth="1"
            />
          ))}
          <polygon points={area} fill={`url(#grad-${gid})`} />
          <polyline
            points={line}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      {labels.length ? (
        <div
          className="mt-2 grid gap-2 text-[10px] font-semibold text-slate-400"
          style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}
        >
          {labels.map((t, i) => (
            <div
              key={`${t}-${i}`}
              className={`min-w-0 truncate ${i === 0 ? "text-left" : i === labels.length - 1 ? "text-right" : "text-center"}`}
              title={t}
            >
              {t}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
