// Kartu delay transmisi ESP32 → dashboard.
// Menampilkan Current / Average / Min / Max delay (ms) secara realtime,
// dihitung dari history (maks. 30 data terakhir) di useTransmissionDelay.

function fmtMs(v) {
  if (v == null || !Number.isFinite(v)) return "—";
  return Math.round(v).toLocaleString("id-ID");
}

// Warna indikator berdasarkan besar delay (kasar): hijau < 1s, kuning < 3s, merah.
function delayTone(v) {
  if (v == null || !Number.isFinite(v)) return "text-slate-400";
  if (v < 1000) return "text-emerald-600";
  if (v < 3000) return "text-amber-600";
  return "text-rose-600";
}

function Stat({ label, value, tone = "text-slate-900" }) {
  return (
    <div className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-100">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-1 gap-y-0.5">
        <span
          className={`min-w-0 break-words text-2xl font-bold leading-none tabular-nums ${tone}`}
        >
          {value}
        </span>
        <span className="text-[11px] font-semibold text-slate-400">ms</span>
      </div>
    </div>
  );
}

export default function TransmissionDelayCard({
  current,
  avg,
  min,
  max,
  count = 0,
}) {
  const hasData = count > 0;

  return (
    <div className="@container rounded-2xl bg-white/80 p-5 shadow-sm shadow-slate-200/50 ring-1 ring-slate-200/70 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <svg viewBox="0 0 24 24" className="h-4 w-4">
              <path
                fill="currentColor"
                d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 10.41l3.29 3.3-1.42 1.41L11 13.66V7h2v5.41z"
              />
            </svg>
          </span>
          Delay Transmisi
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
          {hasData ? `${count} data` : "menunggu"}
        </span>
      </div>

      {/* Current delay — disorot */}
      <div className="mt-4 rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-500 p-4 text-white shadow-lg shadow-sky-500/20">
        <div className="text-[10px] font-bold uppercase tracking-widest text-sky-100">
          Current Delay
        </div>
        <div className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-1 gap-y-1">
          <span className="min-w-0 break-words text-3xl font-bold leading-none tabular-nums @[32rem]:text-4xl">
            {fmtMs(current)}
          </span>
          <span className="text-sm font-semibold text-sky-100">ms</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 @[42rem]:grid-cols-3">
        <Stat label="Average" value={fmtMs(avg)} tone={delayTone(avg)} />
        <Stat label="Minimum" value={fmtMs(min)} tone="text-emerald-600" />
        <Stat label="Maximum" value={fmtMs(max)} tone={delayTone(max)} />
      </div>
    </div>
  );
}
