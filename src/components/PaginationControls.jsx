const PAGE_SIZES = [10, 25, 50, 100];

export default function PaginationControls({
  page,
  pageSize,
  pageCount,
  total,
  start,
  end,
  setPage,
  setPageSize,
  canPrev,
  canNext,
}) {
  if (total === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
      <div className="font-medium">
        Menampilkan {start + 1}-{end} dari {total} baris
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 font-semibold">
          <span>Per halaman</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="h-8 rounded-lg bg-white px-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Jumlah baris per halaman"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <div className="font-semibold text-slate-600">
          Halaman {page} / {pageCount}
        </div>
        <div className="flex items-center overflow-hidden rounded-lg ring-1 ring-slate-200">
          <button
            type="button"
            onClick={() => setPage(1)}
            disabled={!canPrev}
            className="h-8 px-2 font-bold text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:text-slate-300"
            aria-label="Halaman pertama"
          >
            «
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!canPrev}
            className="h-8 border-l border-slate-200 px-2 font-bold text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:text-slate-300"
            aria-label="Halaman sebelumnya"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={!canNext}
            className="h-8 border-l border-slate-200 px-2 font-bold text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:text-slate-300"
            aria-label="Halaman berikutnya"
          >
            ›
          </button>
          <button
            type="button"
            onClick={() => setPage(pageCount)}
            disabled={!canNext}
            className="h-8 border-l border-slate-200 px-2 font-bold text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:text-slate-300"
            aria-label="Halaman terakhir"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
