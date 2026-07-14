import LineChart from "../components/LineChart.jsx";
import PaginationControls from "../components/PaginationControls.jsx";
import usePagination from "../usePagination.js";

function SohBadge({ value }) {
  const cls =
    value >= 90
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : value >= 80
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-rose-50 text-rose-700 ring-rose-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${cls}`}
    >
      {value.toFixed(1)}%
    </span>
  );
}

export default function SohAnalysisPage({
  sohReady,
  cyclesCount,
  capacityInitial,
  capacityNow,
  degradation,
  cycleHistoryRows,
  sohChart,
}) {
  const avgSoh = cycleHistoryRows.length
    ? cycleHistoryRows.reduce((a, r) => a + r.soh, 0) / cycleHistoryRows.length
    : 0;
  const orderedCycleHistoryRows = cycleHistoryRows.slice().reverse();
  const pagination = usePagination(orderedCycleHistoryRows, 25);
  const visibleCycleHistoryRows = pagination.pageItems;

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 space-y-6 lg:col-span-4">
        <div className="rounded-2xl bg-white/80 p-5 shadow-sm shadow-slate-200/50 ring-1 ring-slate-200/70 backdrop-blur">
          <div className="text-sm font-bold text-slate-800">
            Kapasitas awal vs sekarang
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
              <div className="text-[10px] font-semibold text-slate-500">
                AWAL
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {capacityInitial ? capacityInitial.toFixed(0) : "—"}
                {capacityInitial ? (
                  <span className="ml-1 text-xs text-slate-400">mAh</span>
                ) : null}
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
              <div className="text-[10px] font-semibold text-slate-500">
                SEKARANG
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {capacityNow ? capacityNow.toFixed(0) : "—"}
                {capacityNow ? (
                  <span className="ml-1 text-xs text-slate-400">mAh</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/80 p-5 shadow-sm shadow-slate-200/50 ring-1 ring-slate-200/70 backdrop-blur">
          <div className="text-sm font-bold text-slate-800">
            Degradasi baterai
          </div>
          <div className="mt-3 text-3xl font-bold text-rose-600">
            {sohReady ? `${degradation.toFixed(1)}%` : "—"}
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Dibanding SOH cycle pertama
          </div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-8">
        <div className="rounded-2xl bg-white/80 p-5 shadow-sm shadow-slate-200/50 ring-1 ring-slate-200/70 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-800">
                Riwayat SOH per cycle
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Setiap baris = 1 cycle penuh (discharge + charge)
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              {cyclesCount} cycle
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Min SOH
              <div className="mt-1 font-semibold text-slate-800">
                {cycleHistoryRows.length
                  ? `${Math.min(...cycleHistoryRows.map((r) => r.soh)).toFixed(1)}%`
                  : "—"}
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Rata-rata
              <div className="mt-1 font-semibold text-slate-800">
                {cycleHistoryRows.length ? `${avgSoh.toFixed(1)}%` : "—"}
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Max SOH
              <div className="mt-1 font-semibold text-slate-800">
                {cycleHistoryRows.length
                  ? `${Math.max(...cycleHistoryRows.map((r) => r.soh)).toFixed(1)}%`
                  : "—"}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Tren SOH per cycle
            </div>
            <LineChart
              values={sohChart.values}
              labels={sohChart.labels}
              color="#14b8a6"
              height={160}
            />
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl ring-1 ring-slate-100">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-bold">Cycle</th>
                  <th className="px-4 py-3 font-bold">SOH</th>
                  <th className="px-4 py-3 font-bold">Kapasitas (mAh)</th>
                  <th className="px-4 py-3 font-bold">Δ SOH</th>
                  <th className="px-4 py-3 font-bold">Δ Kapasitas</th>
                  <th className="px-4 py-3 font-bold">Suhu max</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {visibleCycleHistoryRows.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-10 text-center text-sm text-slate-400"
                      colSpan="6"
                    >
                      Belum ada cycle selesai. Lakukan discharge + charge penuh.
                    </td>
                  </tr>
                ) : (
                  visibleCycleHistoryRows.map((r) => (
                      <tr
                        key={r.cycle}
                        className="bg-white transition hover:bg-teal-50/30"
                      >
                        <td className="px-4 py-3 font-bold text-slate-900">
                          #{r.cycle}
                        </td>
                        <td className="px-4 py-3">
                          <SohBadge value={r.soh} />
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {r.capacity.toFixed(0)}
                        </td>
                        <td className="px-4 py-3">
                          {r.dSoh != null ? (
                            <span
                              className={
                                r.dSoh >= 0
                                  ? "font-semibold text-emerald-600"
                                  : "font-semibold text-rose-600"
                              }
                            >
                              {r.dSoh >= 0 ? "▲" : "▼"}{" "}
                              {Math.abs(r.dSoh).toFixed(2)}%
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {r.dCapacity != null ? (
                            <span
                              className={
                                r.dCapacity >= 0
                                  ? "font-semibold text-emerald-600"
                                  : "font-semibold text-rose-600"
                              }
                            >
                              {r.dCapacity >= 0 ? "▲" : "▼"}{" "}
                              {Math.abs(r.dCapacity).toFixed(0)} mAh
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3">{r.tempMax.toFixed(1)} °C</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
            <PaginationControls {...pagination} />
          </div>
        </div>
      </div>
    </div>
  );
}
