import React, { useEffect, useState } from 'react';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2, Edit2, Banknote, Calendar, User, TrendingUp, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTodayString, formatDateDisplay } from '../utils/date';

export const Collector = ({ user }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tanggal, setTanggal] = useState(getTodayString());
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userOptions, setUserOptions] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Summary Metrics State
  const [summary, setSummary] = useState({
    total_transaksi: 0,
    total_nominal: 0,
    count: 0
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    tanggal: getTodayString(),
    user_id: user?.id || '',
    jumlah_transaksi: '',
    jumlah_nominal: '',
    keterangan: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchCollectorData();
    fetchSummaryToday();
  }, [page, limit, debouncedSearch, tanggal, selectedUserId]);

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

  const fetchCollectorData = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: debouncedSearch,
        tanggal
      };
      if (selectedUserId) params.user_id = selectedUserId;

      const res = await request.get(API_ENDPOINTS.COLLECTOR.LIST, params);
      if (res.success) {
        setData(res.data || []);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error('Gagal memuat data collector');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummaryToday = async () => {
    try {
      const params = { tanggal };
      if (selectedUserId) params.user_id = selectedUserId;
      const res = await request.get(API_ENDPOINTS.COLLECTOR.SUMMARY_TODAY, params);
      if (res.success) {
        setSummary(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      tanggal: tanggal || getTodayString(),
      user_id: user?.id || '',
      jumlah_transaksi: '',
      jumlah_nominal: '',
      keterangan: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      tanggal: item.tanggal ? formatDateDisplay(item.tanggal) : getTodayString(),
      user_id: item.user_id || user?.id || '',
      jumlah_transaksi: item.jumlah_transaksi,
      jumlah_nominal: item.jumlah_nominal,
      keterangan: item.keterangan || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.jumlah_transaksi === '' || formData.jumlah_nominal === '') {
      toast.error('Jumlah transaksi dan Jumlah nominal wajib diisi!');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const res = await request.put(API_ENDPOINTS.COLLECTOR.UPDATE(editingId), formData);
        if (res.success) {
          toast.success('Data collector berhasil diperbarui');
          setIsModalOpen(false);
          fetchCollectorData();
          fetchSummaryToday();
        }
      } else {
        const res = await request.post(API_ENDPOINTS.COLLECTOR.CREATE, formData);
        if (res.success) {
          toast.success('Input collector berhasil disimpan');
          setIsModalOpen(false);
          fetchCollectorData();
          fetchSummaryToday();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan data collector');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-800">Hapus catatan input collector ini?</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-2.5 py-1 bg-slate-200 text-xs font-medium rounded-lg hover:bg-slate-300 transition"
          >
            Batal
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const res = await request.delete(API_ENDPOINTS.COLLECTOR.DELETE(id));
                if (res.success) {
                  toast.success('Data collector berhasil dihapus');
                  fetchCollectorData();
                  fetchSummaryToday();
                }
              } catch (err) {
                toast.error('Gagal menghapus data');
              }
            }}
            className="px-2.5 py-1 bg-rose-600 text-white text-xs font-medium rounded-lg hover:bg-rose-700 transition"
          >
            Hapus
          </button>
        </div>
      </div>
    ));
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number || 0);
  };

  return (
    <div className="space-y-5">
      {/* Navigation Sub-Tabs to easily jump between Slip and Collector */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl w-fit">
        <Link
          to="/transaksi"
          className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5"
        >
          <Layers className="w-4 h-4 text-slate-500" />
          <span>Transaksi Slip (Setoran / Penarikan)</span>
        </Link>
        <div className="px-4 py-2 text-xs font-bold rounded-xl bg-white text-sky-700 shadow-sm flex items-center gap-1.5">
          <Banknote className="w-4 h-4 text-sky-600" />
          <span>Input Collector</span>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Entri Collector</p>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">{summary.count} Catatan</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Transaksi</p>
            <h3 className="text-lg font-black text-amber-700 mt-0.5">{summary.total_transaksi} Transaksi</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Nominal Collector</p>
            <h3 className="text-lg font-black text-emerald-700 mt-0.5">{formatRupiah(summary.total_nominal)}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Action Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Realtime Search with Debounce */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari Marketing / Keterangan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none bg-slate-50"
            />
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400 hidden sm:block" />
            <input
              type="date"
              value={tanggal}
              onChange={(e) => {
                setTanggal(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none bg-slate-50 font-medium"
            />
          </div>

          {/* Marketing Filter */}
          <select
            value={selectedUserId}
            onChange={(e) => {
              setSelectedUserId(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none bg-slate-50 font-medium"
          >
            <option value="">-- Semua Marketing --</option>
            {userOptions.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nama} ({u.jabatan || 'Marketing'})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleOpenCreate}
          className="w-full md:w-auto px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/30 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Input Collector</span>
        </button>
      </div>

      {/* Table Data Section */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">NO</th>
                <th className="py-3 px-4">TANGGAL</th>
                <th className="py-3 px-4">MARKETING / COLLECTOR</th>
                <th className="py-3 px-4 text-center">JUMLAH TRANSAKSI</th>
                <th className="py-3 px-4 text-right">JUMLAH NOMINAL (Rp)</th>
                <th className="py-3 px-4">KETERANGAN</th>
                <th className="py-3 px-4 text-center w-24">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Memuat data collector...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Belum ada data input collector untuk filter ini
                  </td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-medium text-slate-500">
                      {(page - 1) * limit + idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {formatDateDisplay(item.tanggal)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.pegawai_nama || '-'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full font-bold bg-amber-50 text-amber-700 text-[11px] border border-amber-200">
                        {item.jumlah_transaksi} Transaksi
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-700 text-sm">
                      {formatRupiah(item.jumlah_nominal)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {item.keterangan || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-sky-600 hover:text-sky-800 rounded-lg hover:bg-sky-50 transition"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        limit={limit}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />

      {/* Modal Form Tambah / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Input Collector' : 'Tambah Input Collector'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="block text-xs font-bold text-slate-700 mb-1">Petugas / Marketing</label>
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
              placeholder="Contoh: 15"
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
              placeholder="Contoh: 1500000"
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
              Keterangan / Catatan
            </label>
            <textarea
              rows="3"
              placeholder="Keterangan rute, wilayah pasar, atau catatan setoran..."
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
              className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-md shadow-sky-600/30 transition disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Simpan Data Collector')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
