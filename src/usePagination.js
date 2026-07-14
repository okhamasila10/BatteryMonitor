import { useMemo, useState } from "react";

// Pagination sisi-klien yang reusable untuk semua tabel.
// items : array data yang sudah terurut sesuai keinginan (mis. terbaru dulu)
// initialPageSize : jumlah baris per halaman
export function usePagination(items, initialPageSize = 25) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  const end = Math.min(total, start + pageSize);

  const pageItems = useMemo(
    () => items.slice(start, start + pageSize),
    [items, start, pageSize],
  );

  const setPageSizeSafe = (size) => {
    setPageSize(size);
    setPage(1);
  };

  return {
    page: safePage,
    pageSize,
    pageCount,
    total,
    start,
    end,
    pageItems,
    setPage,
    setPageSize: setPageSizeSafe,
    prev: () => setPage((p) => Math.max(1, p - 1)),
    next: () => setPage((p) => Math.min(pageCount, p + 1)),
    canPrev: safePage > 1,
    canNext: safePage < pageCount,
  };
}

export default usePagination;
