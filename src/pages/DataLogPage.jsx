import PaginationControls from "../components/PaginationControls.jsx";
import usePagination from "../usePagination.js";

export default function DataLogPage({
  logStart,
  setLogStart,
  logEnd,
  setLogEnd,
  downloadCsv,
  downloadExcel,
  logRows,
}) {
  const pagination = usePagination(logRows, 25);
  const visibleRows = pagination.pageItems;

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 rounded-2xl bg-white/70 p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-700">Data Log</div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="text-xs font-semibold text-slate-500">
              Filter tanggal
            </div>
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                value={logStart}
                onChange={(e) => setLogStart(e.target.value)}
                className="h-9 rounded-xl bg-white px-3 text-xs ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <div className="text-xs font-semibold text-slate-400">-</div>
              <input
                type="datetime-local"
                value={logEnd}
                onChange={(e) => setLogEnd(e.target.value)}
                className="h-9 rounded-xl bg-white px-3 text-xs ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <button
              type="button"
              onClick={downloadExcel}
              className="h-9 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Download Excel
            </button>
            <button
              type="button"
              onClick={downloadCsv}
              className="h-9 rounded-xl bg-teal-700 px-4 text-xs font-semibold text-white shadow-sm hover:bg-teal-800"
            >
              Download CSV
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl bg-white p-4 ring-1 ring-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Waktu</th>
                <th className="px-3 py-2 font-semibold">Mode</th>
                <th className="px-3 py-2 font-semibold">Tegangan</th>
                <th className="px-3 py-2 font-semibold">Arus</th>
                <th className="px-3 py-2 font-semibold">Suhu</th>
                <th className="px-3 py-2 font-semibold">Kapasitas</th>
                <th className="px-3 py-2 font-semibold">SOH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {visibleRows.length === 0 ? (
                <tr>
                  <td
                    className="px-3 py-6 text-center text-sm text-slate-500"
                    colSpan="7"
                  >
                    Belum ada data telemetry.
                  </td>
                </tr>
              ) : (
                visibleRows.map((r, i) => (
                  <tr key={`${r.time}-${i}`} className="bg-white">
                    <td className="px-3 py-2 font-semibold">{r.time}</td>
                    <td className="px-3 py-2">{r.mode}</td>
                    <td className="px-3 py-2">{r.voltage.toFixed(3)} V</td>
                    <td className="px-3 py-2">{r.current.toFixed(0)} mA</td>
                    <td className="px-3 py-2">{r.temp.toFixed(2)} °C</td>
                    <td className="px-3 py-2">{r.capacity.toFixed(0)} mAh</td>
                    <td className="px-3 py-2 font-semibold">
                      {r.soh != null ? `${r.soh.toFixed(1)}%` : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <PaginationControls {...pagination} />
        </div>
        <div className="mt-3 text-xs text-slate-500">
          Unduhan mencakup seluruh {logRows.length} baris terfilter.
        </div>
      </div>
    </div>
  );
}
