import TelemetryTable from "../components/TelemetryTable.jsx";

export default function MonitoringPage({ telemetryRows, summary }) {
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 rounded-2xl bg-white/80 p-5 shadow-sm shadow-slate-200/50 ring-1 ring-slate-200/70 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <svg viewBox="0 0 24 24" className="h-4 w-4">
                <path
                  fill="currentColor"
                  d="M4 10.5c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5h16c.83 0 1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5H4zm0-4h16c1.1 0 2 .9 2 2v1H2v-1c0-1.1.9-2 2-2z"
                />
              </svg>
            </span>
            Monitoring Detail
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Tegangan", value: `${summary.voltage.toFixed(2)} V` },
            { label: "Arus", value: `${summary.current.toFixed(0)} mA` },
            { label: "Suhu", value: `${summary.temp.toFixed(1)} \u00b0C` },
            { label: "Kapasitas", value: `${summary.capacity.toFixed(0)} mAh` },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl bg-white p-3 ring-1 ring-slate-100"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {s.label}
              </div>
              <div className="mt-1 text-lg font-bold text-slate-900">
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <TelemetryTable
            rows={telemetryRows}
            pageSize={25}
            emptyMessage="Tidak ada data dalam rentang waktu ini."
          />
        </div>
      </div>
    </div>
  );
}
