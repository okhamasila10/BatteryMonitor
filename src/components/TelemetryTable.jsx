import PaginationControls from "./PaginationControls.jsx";
import usePagination from "../usePagination.js";

function Delta({ value, unit, decimals = 2 }) {
  if (value == null || !Number.isFinite(value)) {
    return <span className="text-slate-300">—</span>;
  }
  if (Math.abs(value) < 0.001) {
    return <span className="text-slate-400">0</span>;
  }
  const up = value > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 font-semibold ${up ? "text-emerald-600" : "text-rose-600"}`}
    >
      <span aria-hidden>{up ? "▲" : "▼"}</span>
      {Math.abs(value).toFixed(decimals)}
      {unit ? <span className="text-[10px] font-normal opacity-70">{unit}</span> : null}
    </span>
  );
}

function ModeBadge({ mode }) {
  const m = String(mode || "").toUpperCase();
  const cls =
    m === "DISCHARGE"
      ? "bg-orange-50 text-orange-700 ring-orange-200"
      : m === "CHARGE"
        ? "bg-sky-50 text-sky-700 ring-sky-200"
        : m === "DONE"
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${cls}`}
    >
      {m || "—"}
    </span>
  );
}

export default function TelemetryTable({
  rows,
  emptyMessage = "Belum ada data telemetry.",
  pageSize = 25,
  showDelta = true,
}) {
  const pagination = usePagination(rows, pageSize);
  const visible = pagination.pageItems;

  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-slate-100">
      <table className="w-full min-w-[720px] text-left text-xs">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-3 font-bold">Waktu</th>
            <th className="px-4 py-3 font-bold">Mode</th>
            <th className="px-4 py-3 font-bold">Tegangan (V)</th>
            {showDelta ? (
              <th className="px-4 py-3 font-bold">Δ V</th>
            ) : null}
            <th className="px-4 py-3 font-bold">Arus (mA)</th>
            {showDelta ? (
              <th className="px-4 py-3 font-bold">Δ I</th>
            ) : null}
            <th className="px-4 py-3 font-bold">Suhu (°C)</th>
            {showDelta ? (
              <th className="px-4 py-3 font-bold">Δ T</th>
            ) : null}
            <th className="px-4 py-3 font-bold">Kapasitas (mAh)</th>
            {showDelta ? (
              <th className="px-4 py-3 font-bold">Δ Cap</th>
            ) : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {visible.length === 0 ? (
            <tr>
              <td
                className="px-4 py-10 text-center text-sm text-slate-400"
                colSpan={showDelta ? 10 : 6}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            visible.map((r, i) => (
              <tr
                key={`${r.time}-${i}`}
                className="bg-white transition hover:bg-teal-50/30"
              >
                <td className="whitespace-nowrap px-4 py-2.5 font-semibold text-slate-800">
                  {r.time}
                </td>
                <td className="px-4 py-2.5">
                  <ModeBadge mode={r.mode} />
                </td>
                <td className="px-4 py-2.5 font-semibold">
                  {r.voltage.toFixed(3)}
                </td>
                {showDelta ? (
                  <td className="px-4 py-2.5">
                    <Delta value={r.dVoltage} unit="V" decimals={3} />
                  </td>
                ) : null}
                <td className="px-4 py-2.5 font-semibold">
                  {r.current.toFixed(0)}
                </td>
                {showDelta ? (
                  <td className="px-4 py-2.5">
                    <Delta value={r.dCurrent} unit="mA" decimals={0} />
                  </td>
                ) : null}
                <td className="px-4 py-2.5 font-semibold">
                  {r.temp.toFixed(2)}
                </td>
                {showDelta ? (
                  <td className="px-4 py-2.5">
                    <Delta value={r.dTemp} unit="°C" decimals={2} />
                  </td>
                ) : null}
                <td className="px-4 py-2.5 font-semibold">
                  {r.capacity.toFixed(1)}
                </td>
                {showDelta ? (
                  <td className="px-4 py-2.5">
                    <Delta value={r.dCapacity} unit="mAh" decimals={1} />
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <PaginationControls {...pagination} />
    </div>
  );
}
