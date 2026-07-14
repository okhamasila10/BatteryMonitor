const STATE_INFO = {
  IDLE: {
    label: "Menunggu",
    desc: "Klik tombol Discharge di dashboard untuk memulai.",
    cls: "bg-slate-50 text-slate-700 ring-slate-200",
    dot: "bg-slate-400",
  },
  DISCHARGE: {
    label: "Discharge",
    cls: "bg-orange-50 text-orange-800 ring-orange-200",
    dot: "bg-orange-500",
  },
  CHARGE: {
    label: "Charge",
    cls: "bg-sky-50 text-sky-800 ring-sky-200",
    dot: "bg-sky-500",
  },
  DONE: {
    label: "Cycle selesai",
    desc: "SOH baru saja dihitung dari cycle penuh.",
    cls: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    dot: "bg-emerald-500",
  },
};

export default function CycleStatusBanner({
  state,
  cycleNow,
  sohReady,
  sohNow,
}) {
  const info = STATE_INFO[state] ?? STATE_INFO.IDLE;

  return (
    <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-200/70 backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${info.cls}`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${info.dot} animate-pulse-dot`} />
          </span>
          <div>
            <div className="text-sm font-bold text-slate-800">
              Cycle {cycleNow || 1} — {info.label}
            </div>
            <div className="mt-0.5 text-xs text-slate-500">{info.desc}</div>
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            SOH
          </div>
          {sohReady ? (
            <div className="mt-1 text-2xl font-bold text-teal-700">
              {sohNow.toFixed(1)}
              <span className="text-sm font-semibold text-slate-400">%</span>
            </div>
          ) : (
            <div className="mt-1 text-sm font-semibold text-amber-600">
              Menunggu 1 cycle
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
