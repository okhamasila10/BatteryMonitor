import TelemetryTable from "../components/TelemetryTable.jsx";
import LineChart from "../components/LineChart.jsx";
import TransmissionDelayCard from "../components/TransmissionDelayCard.jsx";

const METRIC_ICONS = {
  soh: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  volt: "M7 2v11h3v9l7-12h-4l4-8z",
  current:
    "M12 2.02c-5.51 0-9.98 4.47-9.98 9.98s4.47 9.98 9.98 9.98 9.98-4.47 9.98-9.98S17.51 2.02 12 2.02zM11.48 20v-6.26H8L13 4v6.26h3.35L11.48 20z",
  temp: "M15 13V5a3 3 0 00-6 0v8a5 5 0 106 0zm-3-9a1 1 0 011 1v3h-2V5a1 1 0 011-1z",
  cap: "M12 3C7.58 3 4 4.79 4 7s3.58 4 8 4 8-1.79 8-4-3.58-4-8-4zM4 9v3c0 2.21 3.58 4 8 4s8-1.79 8-4V9c0 2.21-3.58 4-8 4S4 11.21 4 9zm0 5v3c0 2.21 3.58 4 8 4s8-1.79 8-4v-3c0 2.21-3.58 4-8 4s-8-1.79-8-4z",
};

const ACCENTS = {
  teal: { chip: "bg-teal-50 text-teal-600", value: "text-teal-700" },
  emerald: { chip: "bg-emerald-50 text-emerald-600", value: "text-slate-900" },
  sky: { chip: "bg-sky-50 text-sky-600", value: "text-slate-900" },
  orange: { chip: "bg-orange-50 text-orange-500", value: "text-slate-900" },
  violet: { chip: "bg-violet-50 text-violet-600", value: "text-slate-900" },
};

function Metric({
  label,
  value,
  unit,
  icon,
  accent = "teal",
  pending = false,
}) {
  const a = ACCENTS[accent];
  return (
    <div className="group rounded-2xl bg-white/90 p-4 shadow-sm shadow-slate-200/50 ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${a.chip}`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4">
            <path fill="currentColor" d={METRIC_ICONS[icon]} />
          </svg>
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        {pending ? (
          <span className="text-sm font-semibold text-amber-600">—</span>
        ) : (
          <>
            <span className={`text-2xl font-bold ${a.value}`}>{value}</span>
            <span className="text-xs font-semibold text-slate-400">{unit}</span>
          </>
        )}
      </div>
    </div>
  );
}

function Gauge({ label, value, sub, color, pending = false }) {
  const pct = pending ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div className="@container rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-100">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-x-2 gap-y-0.5">
        {pending ? (
          <div className="text-sm font-semibold text-amber-600">Pending</div>
        ) : (
          <div className="text-2xl font-bold leading-none text-slate-900 @[7rem]:text-3xl">
            {value.toFixed(0)}%
          </div>
        )}
        <div className="text-xs font-semibold text-slate-500">{sub}</div>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white ring-1 ring-slate-100">
        <div
          className={`h-2 rounded-full ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        ></div>
      </div>
    </div>
  );
}

export default function DashboardPage({
  voltage,
  current,
  temp,
  capacity,
  soh,
  sohReady,
  soc,
  telemetryRows,
  telemetryChart,
  delay,
  batteryOn,
  controlMode,
  onTogglePower,
  onStartDischarge,
  onStartCharge,
  onStopMode,
  effectiveId,
}) {
  const isDischarging = controlMode === "DISCHARGE";
  const isCharging = controlMode === "CHARGE";

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* ── Battery Control ────────────────────────────────────────────── */}
      <div className="col-span-12">
        <div className="rounded-2xl bg-white/90 p-5 shadow-sm shadow-slate-200/60 ring-1 ring-slate-200/80 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Kontrol Baterai
                </h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  {effectiveId}
                </span>
              </div>
            </div>

            {/* ON/OFF toggle */}
            <button
              type="button"
              onClick={onTogglePower}
              className={`inline-flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-all md:w-auto md:min-w-32 ${
                batteryOn
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-400/25 hover:bg-emerald-600"
                  : "bg-slate-100 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-200"
              }`}
            >
              <span>Daya</span>
              <span className="ml-4 inline-flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${batteryOn ? "bg-white animate-pulse" : "bg-slate-400"}`} />
                {batteryOn ? "ON" : "OFF"}
              </span>
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {/* Discharge button */}
            <button
              type="button"
              onClick={isDischarging ? onStopMode : onStartDischarge}
              className={`flex min-h-20 items-center justify-between rounded-xl px-4 py-3 text-left transition-all ${
                isDischarging
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-400/25 hover:bg-orange-600"
                  : "bg-orange-50 text-orange-700 ring-1 ring-orange-200 hover:bg-orange-100"
              }`}
            >
              <span>
                <span className="block text-sm font-bold">
                  {isDischarging ? "Stop Discharge" : "Discharge"}
                </span>
                <span className={`mt-1 block text-xs font-medium ${isDischarging ? "text-orange-50" : "text-orange-600/80"}`}>
                  {isDischarging ? "Mode pengosongan sedang berjalan" : "Mulai pengosongan baterai"}
                </span>
              </span>
              <span className={`ml-3 h-3 w-3 rounded-full ${isDischarging ? "bg-white" : "bg-orange-400"}`} />
            </button>

            {/* Charge button */}
            <button
              type="button"
              onClick={isCharging ? onStopMode : onStartCharge}
              className={`flex min-h-20 items-center justify-between rounded-xl px-4 py-3 text-left transition-all ${
                isCharging
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-400/25 hover:bg-sky-600"
                  : "bg-sky-50 text-sky-700 ring-1 ring-sky-200 hover:bg-sky-100"
              }`}
            >
              <span>
                <span className="block text-sm font-bold">
                  {isCharging ? "Stop Charge" : "Charge"}
                </span>
                <span className={`mt-1 block text-xs font-medium ${isCharging ? "text-sky-50" : "text-sky-600/80"}`}>
                  {isCharging ? "Mode pengisian sedang berjalan" : "Mulai pengisian baterai"}
                </span>
              </span>
              <span className={`ml-3 h-3 w-3 rounded-full ${isCharging ? "bg-white" : "bg-sky-400"}`} />
            </button>

          </div>
        </div>
      </div>

      <div className="col-span-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Metric
          label="SOH"
          value={sohReady ? soh.toFixed(1) : "—"}
          unit="%"
          icon="soh"
          accent="teal"
          pending={!sohReady}
        />
        <Metric
          label="TEGANGAN"
          value={voltage.toFixed(2)}
          unit="V"
          icon="volt"
          accent="emerald"
        />
        <Metric
          label="ARUS"
          value={current.toFixed(0)}
          unit="mA"
          icon="current"
          accent="sky"
        />
        <Metric
          label="SUHU"
          value={temp.toFixed(1)}
          unit="°C"
          icon="temp"
          accent="orange"
        />
        <Metric
          label="KAPASITAS"
          value={capacity.toFixed(0)}
          unit="mAh"
          icon="cap"
          accent="violet"
        />
      </div>

      <div className="col-span-12">
        <div className="rounded-2xl bg-white/80 p-5 shadow-sm shadow-slate-200/50 ring-1 ring-slate-200/70 backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <svg viewBox="0 0 24 24" className="h-4 w-4">
                <path
                  fill="currentColor"
                  d="M3 17h2v-7H3v7zm4 0h2V7H7v10zm4 0h2v-4h-2v4zm4 0h2V4h-2v13zm4 0h2v-9h-2v9z"
                />
              </svg>
            </span>
            Tren telemetry
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Grafik real-time dari data Firebase
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div>
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Tegangan (V)
              </div>
              <LineChart
                values={telemetryChart.voltage}
                labels={telemetryChart.labels}
                color="#10b981"
                height={170}
              />
            </div>
            <div>
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Arus (mA)
              </div>
              <LineChart
                values={telemetryChart.current}
                labels={telemetryChart.labels}
                color="#0ea5e9"
                height={170}
              />
            </div>
            <div>
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Suhu (°C)
              </div>
              <LineChart
                values={telemetryChart.temp}
                labels={telemetryChart.labels}
                color="#f97316"
                height={170}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-8">
        <div className="rounded-2xl bg-white/80 p-5 shadow-sm shadow-slate-200/50 ring-1 ring-slate-200/70 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                  <svg viewBox="0 0 24 24" className="h-4 w-4">
                    <path
                      fill="currentColor"
                      d="M4 10.5c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5h16c.83 0 1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5H4zm0-4h16c1.1 0 2 .9 2 2v1H2v-1c0-1.1.9-2 2-2z"
                    />
                  </svg>
                </span>
                Data telemetry
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Tabel per sampel — kolom Δ menunjukkan kenaikan/penurunan vs
                sampel sebelumnya
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              {telemetryRows.length} baris
            </div>
          </div>
          <div className="mt-4">
            <TelemetryTable rows={telemetryRows} pageSize={25} />
          </div>
        </div>
      </div>

      <div className="col-span-12 space-y-6 lg:col-span-4">
        <TransmissionDelayCard
          current={delay?.current}
          avg={delay?.avg}
          min={delay?.min}
          max={delay?.max}
          count={delay?.count}
        />
        <div className="rounded-2xl bg-white/80 p-5 shadow-sm shadow-slate-200/50 ring-1 ring-slate-200/70 backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <svg viewBox="0 0 24 24" className="h-4 w-4">
                <path
                  fill="currentColor"
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                />
              </svg>
            </span>
            SOH &amp; SOC
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Gauge
              label="SOH"
              value={soh}
              sub={sohReady ? "Setelah cycle" : "Belum ada"}
              color="bg-gradient-to-r from-teal-500 to-emerald-400"
              pending={!sohReady}
            />
            <Gauge
              label="SOC"
              value={soc}
              sub="Estimasi V"
              color="bg-gradient-to-r from-sky-500 to-indigo-400"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
