import React, { useEffect, useState } from 'react';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { Users, Receipt, ArrowDownRight, ArrowUpRight, Wallet, UserCheck, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalNasabah: 0,
    transaksiHariIni: 0,
    setoranHariIni: 0,
    penarikanHariIni: 0,
    prospekTotal: 0
  });
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [nasabahRes, txRes, prospekRes] = await Promise.all([
        request.get(API_ENDPOINTS.NASABAH.LIST, { limit: 1 }),
        request.get(API_ENDPOINTS.TRANSAKSI.LIST, { tanggal: today, limit: 100 }),
        request.get(API_ENDPOINTS.PROSPEK.LIST, { limit: 1 })
      ]);

      const txData = txRes.data || [];
      const setoran = txData.filter(t => t.tipe === 'setoran').reduce((sum, t) => sum + Number(t.nominal), 0);
      const penarikan = txData.filter(t => t.tipe === 'penarikan').reduce((sum, t) => sum + Number(t.nominal), 0);

      setStats({
        totalNasabah: nasabahRes.pagination?.total || 0,
        transaksiHariIni: txData.length,
        setoranHariIni: setoran,
        penarikanHariIni: penarikan,
        prospekTotal: prospekRes.pagination?.total || 0
      });

      setRecentTx(txData.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sky-200 text-xs font-medium backdrop-blur-sm mb-3">
            <Calendar className="w-3.5 h-3.5" />
            <span>Sistem Operasional Rekapitulasi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang, {user?.nama}!
          </h1>
          <p className="mt-2 text-sky-100 text-xs sm:text-sm leading-relaxed">
            Kelola pencatatan harian slip setoran/penarikan, prospek anggota, laporan kas kantor, hingga rekapitulasi pecahan uang tunai BMT Hira secara realtime.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/transaksi"
              className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/30 transition flex items-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              <span>Input Transaksi Slip</span>
            </Link>
            <Link
              to="/pecahan"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl backdrop-blur-md transition border border-white/20 flex items-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              <span>Input Pecahan Kas</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Cards Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Anggota</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{stats.totalNasabah}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Setoran Tunai (Hari Ini)</p>
            <h3 className="text-lg font-black text-emerald-600 mt-0.5">{formatRupiah(stats.setoranHariIni)}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Penarikan Tunai (Hari Ini)</p>
            <h3 className="text-lg font-black text-rose-600 mt-0.5">{formatRupiah(stats.penarikanHariIni)}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Daftar Prospek</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{stats.prospekTotal}</h3>
          </div>
        </div>
      </div>

      {/* Quick Recent Transactions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-800">Transaksi Slip Harian Terakhir</h3>
          <Link to="/transaksi" className="text-xs font-semibold text-sky-600 hover:text-sky-700">Lihat Semua →</Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Memuat data transaksi...</div>
        ) : recentTx.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">Belum ada transaksi tercatat hari ini</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-3">No. Rek</th>
                  <th className="py-2.5 px-3">Nama Anggota</th>
                  <th className="py-2.5 px-3">Tipe</th>
                  <th className="py-2.5 px-3">Nominal</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-mono font-medium text-slate-700">{tx.no_rek}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{tx.nama}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        tx.tipe === 'setoran' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {tx.tipe}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800">{formatRupiah(tx.nominal)}</td>
                    <td className="py-3 px-3 text-slate-500">{tx.keterangan || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
