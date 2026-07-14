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

export default function CycleDataPage({ cycleRows }) {
  const orderedRows = cycleRows.slice().reverse();
  const pagination = usePagination(orderedRows, 25);
  const visibleRows = pagination.pageItems;

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 rounded-2xl bg-white/80 p-5 shadow-sm shadow-slate-200/50 ring-1 ring-slate-200/70 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <svg viewBox="0 0 24 24" className="h-4 w-4">
                <path
                  fill="currentColor"
                  d="M12 6V3L8 7l4 4V8c2.76 0 5 2.24 5 5a5 5 0 01-9.9 1H5.02A7 7 0 0019 13c0-3.87-3.13-7-7-7z"
                />
              </svg>
            </span>
            Cycle Data
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
            Total: {cycleRows.length} cycle
          </div>
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl ring-1 ring-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 font-bold">Cycle ke-</th>
                <th className="px-4 py-3 font-bold">SOH</th>
                <th className="px-4 py-3 font-bold">Kapasitas (mAh)</th>
                <th className="px-4 py-3 font-bold">Discharge (menit)</th>
                <th className="px-4 py-3 font-bold">Charge (menit)</th>
                <th className="px-4 py-3 font-bold">Suhu maks (°C)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {visibleRows.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-sm text-slate-400"
                    colSpan="6"
                  >
                    Belum ada cycle yang selesai.
                  </td>
                </tr>
              ) : (
                visibleRows.map((r) => (
                    <tr
                      key={r.cycle}
                      className="bg-white transition hover:bg-teal-50/40"
                    >
                      <td className="px-4 py-3 font-bold text-slate-900">
                        #{r.cycle}
                      </td>
                      <td className="px-4 py-3">
                        <SohBadge value={r.soh} />
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {r.capacityMah.toFixed(0)}
                      </td>
                      <td className="px-4 py-3">{r.dischargeMin.toFixed(1)}</td>
                      <td className="px-4 py-3">{r.chargeMin.toFixed(1)}</td>
                      <td className="px-4 py-3">{r.tempMax.toFixed(1)}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
          <PaginationControls {...pagination} />
        </div>
      </div>
    </div>
  );
}
