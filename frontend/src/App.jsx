import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { DataNasabah } from './pages/DataNasabah';
import { TransaksiSlip } from './pages/TransaksiSlip';
import { DaftarProspek } from './pages/DaftarProspek';
import { AnggotaKhusus } from './pages/AnggotaKhusus';
import { LaporanKas } from './pages/LaporanKas';
import { KasDisetorPecahan } from './pages/KasDisetorPecahan';
import { RekapLaporan } from './pages/RekapLaporan';
import { ManajemenPegawai } from './pages/ManajemenPegawai';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bmt_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  if (!user) {
    return (
      <BrowserRouter>
        <Toaster position="top-right" reverseOrder={false} />
        <Routes>
          <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="min-h-screen bg-slate-50 flex">
        {/* Responsive Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          user={user}
        />

        {/* Main Content Layout Area */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
          <Header
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            title="KSPPS BMT HIRA"
            user={user}
          />

          <main className="p-4 sm:p-6 lg:p-8 flex-1">
            <Routes>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/nasabah" element={<DataNasabah />} />
              <Route path="/transaksi" element={<TransaksiSlip />} />
              <Route path="/prospek" element={<DaftarProspek />} />
              <Route path="/tidak-transaksi" element={<AnggotaKhusus type="tidak-transaksi" />} />
              <Route path="/tidak-dikunjungi" element={<AnggotaKhusus type="tidak-dikunjungi" />} />
              <Route path="/laporan-kas" element={<LaporanKas />} />
              <Route path="/pecahan" element={<KasDisetorPecahan user={user} />} />
              <Route path="/rekap" element={<RekapLaporan />} />
              {user.role === 'admin' && (
                <Route path="/pegawai" element={<ManajemenPegawai />} />
              )}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
