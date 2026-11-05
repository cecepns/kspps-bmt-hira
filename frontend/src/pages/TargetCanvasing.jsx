import React, { useEffect, useState } from 'react';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import toast from 'react-hot-toast';
import {
  Target,
  Plus,
  Search,
  Trash2,
  Edit2,
  Building2,
  User,
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { getTodayString } from '../utils/date';

export const TargetCanvasing = ({ user }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [userOptions, setUserOptions] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nama_marketing: '',
    cabang: 'Cabang Utama Bandung',
    periode_bulan: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`,
    target_nasabah: '',
    target_nominal: '',
    realisasi_nasabah: '',
    realisasi_nominal: '',
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
    fetchData();
  }, [page, limit, debouncedSearch, bulan, tahun]);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: debouncedSearch,
        bulan,
        tahun
      };
      const res = await request.get(API_ENDPOINTS.TARGET_CANVASING.LIST, params);
      if (res.success) {
        setData(res.data || []);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error('Gagal memuat data target canvasing');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      nama_marketing: '',
      cabang: 'Cabang Utama Bandung',
      periode_bulan: `${tahun}-${String(bulan).padStart(2, '0')}-01`,
      target_nasabah: '',
      target_nominal: '',
      realisasi_nasabah: '0',
      realisasi_nominal: '0',
      keterangan: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    const dateFormatted = item.periode_bulan ? item.periode_bulan.substring(0, 10) : `${tahun}-${String(bulan).padStart(2, '0')}-01`;
    setFormData({
      nama_marketing: item.nama_marketing || '',
      cabang: item.cabang || 'Cabang Utama Bandung',
      periode_bulan: dateFormatted,
      target_nasabah: item.target_nasabah || '',
      target_nominal: item.target_nominal || '',
      realisasi_nasabah: item.realisasi_nasabah ?? 0,
      realisasi_nominal: item.realisasi_nominal ?? 0,
      keterangan: item.keterangan || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama_marketing || !formData.cabang || !formData.periode_bulan) {
      toast.error('Nama Marketing, Cabang, dan Periode wajib diisi!');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const res = await request.put(API_ENDPOINTS.TARGET_CANVASING.UPDATE(editingId), formData);
        if (res.success) {
          toast.success('Target Canvasing berhasil diperbarui');
          setIsModalOpen(false);
          fetchData();
        }
      } else {
        const res = await request.post(API_ENDPOINTS.TARGET_CANVASING.CREATE, formData);
        if (res.success) {
          toast.success('Target Canvasing berhasil ditambahkan');
          setIsModalOpen(false);
          fetchData();
        }
      }
    } catch (err) {
      toast.error('Gagal menyimpan target canvasing');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, nama) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-slate-800">
          Hapus target canvasing untuk <strong>{nama}</strong>?
        </span>
        <div className="flex justify-end gap-2 mt-1">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
          >
            Batal
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const res = await request.delete(API_ENDPOINTS.TARGET_CANVASING.DELETE(id));
                if (res.success) {
                  toast.success('Data berhasil dihapus');
                  fetchData();
                }
              } catch (err) {
                toast.error('Gagal menghapus data');
              }
            }}
            className="px-2.5 py-1 text-xs rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700"
          >
            Hapus
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
  };

  // Summary calculation for loaded data
  const totalTargetNominal = data.reduce((sum, item) => sum + Number(item.target_nominal || 0), 0);
  const totalRealisasiNominal = data.reduce((sum, item) => sum + Number(item.realisasi_nominal || 0), 0);
  const totalTargetNasabah = data.reduce((sum, item) => sum + Number(item.target_nasabah || 0), 0);
  const totalRealisasiNasabah = data.reduce((sum, item) => sum + Number(item.realisasi_nasabah || 0), 0);
  const persentaseCapaian = totalTargetNominal > 0 ? ((totalRealisasiNominal / totalTargetNominal) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">TARGET CANVASING</h1>
            <p className="text-xs text-slate-500">
              Pengaturan target canvasing per marketing cabang yang diinput & dikelola oleh Manajer
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Filter Bulan & Tahun */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={bulan}
              onChange={(e) => setBulan(Number(e.target.value))}
              className="text-xs font-semibold text-slate-700 bg-transparent outline-none"
            >
              {[
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
              ].map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={tahun}
              onChange={(e) => setTahun(Number(e.target.value))}
              className="text-xs font-semibold text-slate-700 bg-transparent outline-none"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Target Marketing</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">TOTAL TARGET NOMINAL</span>
            <h3 className="text-base font-extrabold text-slate-800 mt-1">{formatRupiah(totalTargetNominal)}</h3>
            <span className="text-[10px] text-slate-400 font-medium">Bulan ini ({data.length} Marketing)</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">TOTAL REALISASI</span>
            <h3 className="text-base font-extrabold text-emerald-700 mt-1">{formatRupiah(totalRealisasiNominal)}</h3>
            <span className="text-[10px] text-emerald-600 font-medium">Realisasi perolehan</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">TARGET NASABAH</span>
            <h3 className="text-base font-extrabold text-slate-800 mt-1">
              {totalRealisasiNasabah} / {totalTargetNasabah}
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Realisasi vs Target Nasabah</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">PERSENTASE CAPAIAN</span>
            <h3 className={`text-base font-extrabold mt-1 ${Number(persentaseCapaian) >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {persentaseCapaian}%
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Rata-rata target cabang</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari marketing, cabang..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-500">
            <span>Tampilkan</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 text-xs border border-slate-300 rounded-lg outline-none bg-slate-50 font-medium"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>data</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3 w-12 text-center">NO</th>
                <th className="p-3">MARKETING</th>
                <th className="p-3">CABANG</th>
                <th className="p-3 text-center">TARGET NASABAH</th>
                <th className="p-3 text-right">TARGET NOMINAL (Rp)</th>
                <th className="p-3 text-center">REALISASI NASABAH</th>
                <th className="p-3 text-right">REALISASI NOMINAL (Rp)</th>
                <th className="p-3 text-center">% CAPAIAN</th>
                <th className="p-3">KETERANGAN</th>
                <th className="p-3 text-center w-24">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    Memuat data target canvasing...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    Belum ada data target canvasing pada periode ini. Klik <strong>Tambah Target Marketing</strong> untuk membuat baru.
                  </td>
                </tr>
              ) : (
                data.map((item, idx) => {
                  const capaianPct = Number(item.target_nominal) > 0
                    ? ((Number(item.realisasi_nominal || 0) / Number(item.target_nominal)) * 100).toFixed(1)
                    : 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-center text-slate-500 font-mono">
                        {(page - 1) * limit + idx + 1}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{item.nama_marketing}</div>
                        <span className="text-[10px] text-slate-400">Diisi oleh Manajer</span>
                      </td>
                      <td className="p-3 text-slate-700">
                        <div className="flex items-center gap-1 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{item.cabang}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-700">
                        {item.target_nasabah} Orang
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">
                        {formatRupiah(item.target_nominal)}
                      </td>
                      <td className="p-3 text-center font-bold text-emerald-700">
                        {item.realisasi_nasabah || 0} Orang
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">
                        {formatRupiah(item.realisasi_nominal)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            Number(capaianPct) >= 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : Number(capaianPct) >= 50
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {capaianPct}%
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 max-w-[200px] truncate" title={item.keterangan || '-'}>
                        {item.keterangan || '-'}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.nama_marketing)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Nav */}
        <div className="p-4 border-t border-slate-200">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </div>

      {/* Modal Create & Edit Target Canvasing */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Target Canvasing Marketing' : 'Tambah Target Canvasing Marketing'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih / Nama Marketing <span className="text-rose-500">*</span>
              </label>
              {userOptions.length > 0 ? (
                <div className="space-y-1">
                  <select
                    value={formData.nama_marketing}
                    onChange={(e) => setFormData({ ...formData, nama_marketing: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-sky-500 bg-white font-medium"
                    required
                  >
                    <option value="">-- Pilih Marketing --</option>
                    {userOptions.map((u) => (
                      <option key={u.id} value={u.nama}>
                        {u.nama} ({u.jabatan || 'Marketing'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Ketik Nama Marketing..."
                  value={formData.nama_marketing}
                  onChange={(e) => setFormData({ ...formData, nama_marketing: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cabang <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Cabang Utama Bandung"
                value={formData.cabang}
                onChange={(e) => setFormData({ ...formData, cabang: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Periode Bulan (Tanggal) <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.periode_bulan}
              onChange={(e) => setFormData({ ...formData, periode_bulan: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="text-xs font-bold text-sky-800 uppercase block tracking-wider">
              TARGET YANG DITETAPKAN MANAJER
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Target Jumlah Nasabah</label>
                <input
                  type="number"
                  placeholder="Contoh: 20"
                  value={formData.target_nasabah}
                  onChange={(e) => setFormData({ ...formData, target_nasabah: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-sky-500 outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Target Nominal (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 50000000"
                  value={formData.target_nominal}
                  onChange={(e) => setFormData({ ...formData, target_nominal: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 outline-none bg-white"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
            <span className="text-xs font-bold text-emerald-800 uppercase block tracking-wider">
              REALISASI SAAT INI
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Realisasi Nasabah</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.realisasi_nasabah}
                  onChange={(e) => setFormData({ ...formData, realisasi_nasabah: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Realisasi Nominal (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.realisasi_nominal}
                  onChange={(e) => setFormData({ ...formData, realisasi_nominal: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan / Catatan Manajer</label>
            <textarea
              rows={2}
              placeholder="Catatan arahan target canvasing untuk marketing bersangkutan..."
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-700 shadow-md transition"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Target Canvasing'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

