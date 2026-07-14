const ICONS = {
  Dashboard: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
  Monitoring:
    "M3 17h2v-7H3v7zm4 0h2V7H7v10zm4 0h2v-4h-2v4zm4 0h2V4h-2v13zm4 0h2v-9h-2v9z",
  "SOH Analysis": "M4 19h16v2H4v-2zM5 4h4v11H5V4zm5 4h4v7h-4V8zm5-2h4v9h-4V6z",
  "Cycle Data":
    "M12 6V3L8 7l4 4V8c2.76 0 5 2.24 5 5a5 5 0 01-9.9 1H5.02A7 7 0 0019 13c0-3.87-3.13-7-7-7z",
  "Data Log":
    "M6 2h9l5 5v15a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm8 1.5V8h4.5L14 3.5zM8 12h8v2H8v-2zm0 4h8v2H8v-2zm0-8h5v2H8V8z",
};

const NAV = [
  { group: "Ringkasan", items: ["Dashboard", "Monitoring"] },
  { group: "Analisa", items: ["SOH Analysis", "Cycle Data"] },
  { group: "Riwayat", items: ["Data Log"] },
];

export default function Sidebar({ active, onSelect, conn }) {
  return (
    <aside className="sticky top-6 flex h-[calc(100vh-3rem)] w-64 shrink-0 flex-col overflow-y-auto rounded-3xl bg-white/80 p-5 shadow-xl shadow-slate-200/60 ring-1 ring-white/60 backdrop-blur-xl">
      <div className="mb-8 flex items-center gap-3 px-1">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 text-white shadow-lg shadow-teal-500/30">
          <svg viewBox="0 0 24 24" className="h-6 w-6">
            <path
              fill="currentColor"
              d="M16 4H8a2 2 0 00-2 2v2H4v8h2v2a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2zm-3 12h-2l1-3H9l4-5-1 3h2l-1 5z"
            />
          </svg>
        </div>
        <div>
          <div className="text-base font-bold tracking-tight text-slate-900">
            Battery Monitor
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-5">
        {NAV.map((section) => (
          <div key={section.group}>
            <div className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {section.group}
            </div>
            <div className="flex flex-col gap-1">
              {section.items.map((label) => {
                const isActive = active === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => onSelect(label)}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-lg shadow-teal-500/25"
                        : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                        isActive
                          ? "bg-white/20"
                          : "bg-slate-100 text-slate-500 group-hover:bg-white"
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4">
                        <path fill="currentColor" d={ICONS[label]} />
                      </svg>
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {conn ? (
        <div className="mt-5 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${conn.dot} animate-pulse-dot`}
            ></span>
            <div className="text-xs font-semibold text-slate-700">
              {conn.label}
            </div>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Realtime Database
          </div>
        </div>
      ) : null}
    </aside>
  );
}
