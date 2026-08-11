import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({ page, totalPages, onPageChange, limit, onLimitChange }) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span>Tampilkan</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="border border-slate-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-50"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span>data per halaman</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition"
        >
          <ChevronLeft className="w-4 h-4 text-slate-700" />
        </button>

        <span className="text-sm font-medium text-slate-700 px-3 py-1 bg-slate-100 rounded-lg">
          Halaman {page} dari {totalPages || 1}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition"
        >
          <ChevronRight className="w-4 h-4 text-slate-700" />
        </button>
      </div>
    </div>
  );
};
