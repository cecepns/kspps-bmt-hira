import React from 'react';
import { Menu, Calendar, Bell } from 'lucide-react';

export const Header = ({ onToggleSidebar, title, user }) => {
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
          <p className="text-xs text-slate-500 hidden sm:block">Aplikasi Pencatatan KSPPS BMT Hira</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-sky-600" />
          <span>{todayFormatted}</span>
        </div>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-semibold text-slate-700 block">{user?.nama || 'User'}</span>
            <span className="text-[10px] text-slate-500 capitalize">{user?.jabatan || 'Pegawai'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
