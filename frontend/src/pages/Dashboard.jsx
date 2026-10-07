import React, { useEffect, useState } from 'react';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { Modal } from '../components/Modal';
import toast from 'react-hot-toast';
import {
  Users,
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  UserCheck,
  Calendar,
  Banknote,
  Plus,
  Clock,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTodayString, formatDateDisplay } from '../utils/date';

export const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalNasabah: 0,
    transaksiHariIni: 0,
    setoranHariIni: 0,
    penarikanHariIni: 0,
    prospekTotal: 0
  });
  const [collectorStats, setCollectorStats] = useState({
    total_transaksi: 0,
    total_nominal: 0,
    count: 0,
    list: []
  });
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Bottom Tab: 'slip' | 'collector'
  const [activeTab, setActiveTab] = useState('collector');

  // Quick Modal Input Collector on Dashboard
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userOptions, setUserOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    tanggal: getTodayString(),
    user_id: user?.id || '',
    jumlah_transaksi: '',
    jumlah_nominal: '',
    keterangan: ''
  });

  useEffect(() => {
    fetchDashboardData();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.USERS.LIST, { limit: 100 });
      if (res.success) {
        setUserOptions(res.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const today = getTodayString();
      const [nasabahRes, txRes, prospekRes, collectorRes] = await Promise.all([
        request.get(API_ENDPOINTS.NASABAH.LIST, { limit: 1 }),
        request.get(API_ENDPOINTS.TRANSAKSI.LIST, { tanggal: today, limit: 100 }),
        request.get(API_ENDPOINTS.PROSPEK.LIST, { limit: 1 }),
        request.get(API_ENDPOINTS.COLLECTOR.SUMMARY_TODAY, { tanggal: today })
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

      setRecentTx(txData.slice(0, 8));

      if (collectorRes.success && collectorRes.data) {
        setCollectorStats(collectorRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModalCollector = () => {
    setFormData({
      tanggal: getTodayString(),
      user_id: user?.id || '',
      jumlah_transaksi: '',
      jumlah_nominal: '',
      keterangan: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmitCollector = async (e) => {
    e.preventDefault();
    if (formData.jumlah_transaksi === '' || formData.jumlah_nominal === '') {
      toast.error('Jumlah transaksi dan Nominal wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      const res = await request.post(API_ENDPOINTS.COLLECTOR.CREATE, formData);
      if (res.success) {
        toast.success('Input collector berhasil disimpan!');
        setIsModalOpen(false);
        fetchDashboardData();
      }
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan data collector');
    } finally {
      setSubmitting(false);
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
            <span>Sistem Operasional Rekapitulasi & Collector</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang, {user?.nama}!
          </h1>
          <p className="mt-2 text-sky-100 text-xs sm:text-sm leading-relaxed">
            Kelola pencatatan harian collector, slip setoran/penarikan anggota, prospek, laporan kas kantor, hingga rekapitulasi pecahan uang tunai BMT Hira secara realtime.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={handleOpenModalCollector}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-black rounded-xl shadow-lg shadow-amber-500/30 transition flex items-center gap-2"
            >
              <Banknote className="w-4 h-4 text-slate-900" />
              <span>+ Input Collector</span>
            </button>
            <Link
              to="/collector"
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl backdrop-blur-md transition border border-white/20 flex items-center gap-2"
            >
              <Layers className="w-4 h-4" />
              <span>Menu Data Collector</span>
            </Link>
            <Link
              to="/transaksi"
              className="px-4 py-2.5 bg-sky-500/80 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/30 transition flex items-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              <span>Input Transaksi Slip</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Cards Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Total Anggota */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Anggota</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{stats.totalNasabah}</h3>
          </div>
        </div>

        {/* Card 2: Card Total Collector Hari Ini (Requested) */}
        <div className="bg-gradient-to-br from-white to-amber-50/40 p-5 rounded-2xl border-2 border-amber-300/80 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Banknote className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] font-black text-amber-800 uppercase tracking-wider">Total Collector</p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded-md">
                Hari Ini
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5 truncate">
              {formatRupiah(collectorStats.total_nominal)}
            </h3>
            <p className="text-[11px] font-bold text-amber-700 mt-0.5">
              {collectorStats.total_transaksi} Transaksi ({collectorStats.count} Input)
            </p>
          </div>
        </div>

        {/* Card 3: Setoran Tunai */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Setoran Slip (Hari Ini)</p>
            <h3 className="text-base sm:text-lg font-black text-emerald-600 mt-0.5">{formatRupiah(stats.setoranHariIni)}</h3>
          </div>
        </div>

        {/* Card 4: Penarikan Tunai */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Penarikan Slip (Hari Ini)</p>
            <h3 className="text-base sm:text-lg font-black text-rose-600 mt-0.5">{formatRupiah(stats.penarikanHariIni)}</h3>
          </div>
        </div>

        {/* Card 5: Daftar Prospek */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Daftar Prospek</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{stats.prospekTotal}</h3>
          </div>
        </div>
      </div>

      {/* Interactive Tabs Section for Collector and Slip Entries */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Tab Menu Header */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('collector')}
              className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 ${activeTab === 'collector'
                  ? 'bg-white text-sky-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Banknote className="w-4 h-4 text-amber-600" />
              <span>Hasil Inputan Collector Hari Ini</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-black">
                {collectorStats.list?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('slip')}
              className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 ${activeTab === 'slip'
                  ? 'bg-white text-sky-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Receipt className="w-4 h-4 text-sky-600" />
              <span>Transaksi Slip Harian</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-800 font-black">
                {recentTx.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'collector' ? (
              <>
                <button
                  onClick={handleOpenModalCollector}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Input Collector</span>
                </button>
                <Link
                  to="/collector"
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700"
                >
                  Kelola Lengkap →
                </Link>
              </>
            ) : (
              <Link
                to="/transaksi"
                className="text-xs font-semibold text-sky-600 hover:text-sky-700"
              >
                Lihat Semua Slip →
              </Link>
            )}
          </div>
        </div>

        {/* Tab 1: Hasil Inputan Collector Hari Ini */}
        {activeTab === 'collector' && (
          <div>
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Memuat data collector...</div>
            ) : (!collectorStats.list || collectorStats.list.length === 0) ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                  <Banknote className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-500">Belum ada catatan input collector hari ini</p>
                <button
                  onClick={handleOpenModalCollector}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-black rounded-xl transition inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Input Collector Sekarang</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">No</th>
                      <th className="py-2.5 px-3">Petugas Marketing / Collector</th>
                      <th className="py-2.5 px-3 text-center">Jumlah Transaksi</th>
                      <th className="py-2.5 px-3 text-right">Jumlah Nominal</th>
                      <th className="py-2.5 px-3">Keterangan</th>
                      <th className="py-2.5 px-3 text-center">Waktu Input</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {collectorStats.list.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-amber-50/40 transition">
                        <td className="py-3 px-3 text-center font-medium text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {item.pegawai_nama || '-'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 text-[10px]">
                            {item.jumlah_transaksi} Transaksi
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-black text-emerald-700 text-xs sm:text-sm">
                          {formatRupiah(item.jumlah_nominal)}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {item.keterangan || '-'}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-[10px] text-slate-400">
                          {item.created_at ? new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Transaksi Slip Harian Terakhir */}
        {activeTab === 'slip' && (
          <div>
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Memuat data transaksi...</div>
            ) : recentTx.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Belum ada transaksi slip tercatat hari ini</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">No. Rek</th>
                      <th className="py-2.5 px-3">Nama Anggota</th>
                      <th className="py-2.5 px-3">Tipe</th>
                      <th className="py-2.5 px-3 text-right">Nominal</th>
                      <th className="py-2.5 px-3">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentTx.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-mono font-medium text-slate-700">{tx.no_rek}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800">{tx.nama}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${tx.tipe === 'setoran' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                            {tx.tipe}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-800">{formatRupiah(tx.nominal)}</td>
                        <td className="py-3 px-3 text-slate-500">{tx.keterangan || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Modal Input Collector from Dashboard */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Input Data Collector Harian"
      >
        <form onSubmit={handleSubmitCollector} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
            <input
              type="date"
              value={formData.tanggal}
              onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Petugas Marketing / Collector</label>
            <select
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none bg-white font-medium"
              required
            >
              {userOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nama} ({u.jabatan || 'Marketing'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Jumlah Transaksi
            </label>
            <input
              type="number"
              min="0"
              placeholder="Contoh: 20"
              value={formData.jumlah_transaksi}
              onChange={(e) => setFormData({ ...formData, jumlah_transaksi: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none font-medium"
              required
            />
            <p className="text-[10px] text-slate-400 mt-1">Total jumlah slip / transaksi yang ditangani collector</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Jumlah Nominal (Rp)
            </label>
            <input
              type="number"
              min="0"
              placeholder="Contoh: 2500000"
              value={formData.jumlah_nominal}
              onChange={(e) => setFormData({ ...formData, jumlah_nominal: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none font-bold text-slate-800"
              required
            />
            {formData.jumlah_nominal && (
              <p className="text-xs font-bold text-emerald-700 mt-1">
                Terbaca: {formatRupiah(formData.jumlah_nominal)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Keterangan / Wilayah
            </label>
            <textarea
              rows="3"
              placeholder="Catatan rute, pasar, atau rekap setoran..."
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-slate-900 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md shadow-amber-500/30 transition disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Data Collector'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
