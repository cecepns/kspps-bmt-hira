import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Receipt, 
  UserX, 
  UserMinus, 
  Wallet, 
  Coins, 
  FileSpreadsheet, 
  LogOut,
  X
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose, user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('bmt_token');
    localStorage.removeItem('bmt_user');
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Transaksi Slip (Penarikan/Setoran)', path: '/transaksi', icon: Receipt },
    { label: 'Data Nasabah', path: '/nasabah', icon: UserCheck },
    { label: 'Daftar Prospek', path: '/prospek', icon: Users },
    { label: 'Anggota Tidak Transaksi', path: '/tidak-transaksi', icon: UserX },
    { label: 'Anggota Tidak Dikunjungi', path: '/tidak-dikunjungi', icon: UserMinus },
    { label: 'Laporan Harian Kas', path: '/laporan-kas', icon: Wallet },
    { label: 'Kas Disetor (Pecahan Tunai)', path: '/pecahan', icon: Coins },
    { label: 'Rekapan & Laporan', path: '/rekap', icon: FileSpreadsheet },
  ];

  if (user?.role === 'admin') {
    navItems.push({ label: 'Manajemen Pegawai', path: '/pegawai', icon: Users });
  }

  return (
    <>
      {/* Overlay Backdrop for Mobile */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/logo.jpeg" alt="BMT Hira Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-white tracking-wide text-base leading-tight">BMT HIRA</h1>
              <span className="text-[11px] font-medium text-sky-400 block">KSPPS Mitra Tepat</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User Card */}
        <div className="mx-3 my-3 p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-600 text-white font-bold flex items-center justify-center text-sm shadow-inner">
            {user?.nama ? user.nama.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{user?.nama || 'Pengguna'}</p>
            <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-medium capitalize border border-sky-500/30">
              {user?.role || 'Pegawai'}
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-md shadow-sky-600/30 font-semibold' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-slate-800/80">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Aplikasi</span>
          </button>
        </div>
      </aside>
    </>
  );
};
