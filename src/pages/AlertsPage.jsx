import PaginationControls from "../components/PaginationControls.jsx";
import usePagination from "../usePagination.js";

export default function AlertsPage({ alerts, formatLogTime }) {
  const orderedAlerts = alerts.slice().reverse();
  const pagination = usePagination(orderedAlerts, 25);
  const visibleAlerts = pagination.pageItems;

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 rounded-2xl bg-white/80 p-5 shadow-sm shadow-slate-200/50 ring-1 ring-slate-200/70 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
              <svg viewBox="0 0 24 24" className="h-4 w-4">
                <path
                  fill="currentColor"
                  d="M12 22a2.5 2.5 0 002.45-2h-4.9A2.5 2.5 0 0012 22zm6-6V11a6 6 0 00-5-5.91V4a1 1 0 10-2 0v1.09A6 6 0 006 11v5l-2 2v1h16v-1l-2-2z"
                />
              </svg>
            </span>
            Alerts / Status
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
            Riwayat: {alerts.length}
          </div>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 font-bold">Waktu</th>
                <th className="px-4 py-3 font-bold">Tipe</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {visibleAlerts.map((a, idx) => (
                  <tr
                    key={`${a.ts}-${a.type}-${idx}`}
                    className="bg-white transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-semibold">
                      {formatLogTime(a.ts)}
                    </td>
                    <td className="px-4 py-3">{a.type}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          a.severity === "Danger"
                            ? "inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 ring-1 ring-rose-200"
                            : "inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200"
                        }
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${a.severity === "Danger" ? "bg-rose-500" : "bg-amber-500"}`}
                        ></span>
                        {a.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">{a.message}</td>
                  </tr>
                ))}
              {alerts.length === 0 ? (
                <tr className="bg-white">
                  <td className="px-4 py-10 text-center" colSpan="4">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                        <svg viewBox="0 0 24 24" className="h-6 w-6">
                          <path
                            fill="currentColor"
                            d="M9 16.2l-3.5-3.5L4 14.2l5 5 12-12-1.5-1.4z"
                          />
                        </svg>
                      </span>
                      <span className="text-sm font-semibold">
                        Tidak ada warning. Baterai aman.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <PaginationControls {...pagination} />
        </div>
      </div>
    </div>
  );
}
