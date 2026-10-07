import React, { useEffect, useState } from 'react';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2, Edit, ClipboardCheck, Phone, Filter, DollarSign } from 'lucide-react';
import { getTodayString, formatDateDisplay } from '../utils/date';

export const SurveyPembiayaan = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tanggal, setTanggal] = useState(getTodayString());
  const [filterJenis, setFilterJenis] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    tanggal: getTodayString(),
    nama: '',
    alamat: '',
    no_hp: '',
    jenis_layanan: 'Survey Pembiayaan',
    jumlah_plafond: '',
    hasil_survey: '',
    keterangan: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchSurveyData();
  }, [page, limit, debouncedSearch, tanggal, filterJenis]);

  const fetchSurveyData = async () => {
    setLoading(true);
    try {
      const params = { page, limit, search: debouncedSearch, tanggal };
      if (filterJenis) params.jenis = filterJenis;
      const res = await request.get(API_ENDPOINTS.SURVEY_PEMBIAYAAN.LIST, params);
      if (res.success) {
        setData(res.data || []);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error('Gagal memuat data survey pembiayaan');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      tanggal: tanggal || getTodayString(),
      nama: '',
      alamat: '',
      no_hp: '',
      jenis_layanan: 'Survey Pembiayaan',
      jumlah_plafond: '',
      hasil_survey: '',
      keterangan: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      tanggal: item.tanggal ? formatDateDisplay(item.tanggal) : getTodayString(),
      nama: item.nama || '',
      alamat: item.alamat || '',
      no_hp: item.no_hp || '',
      jenis_layanan: item.jenis_layanan || 'Survey Pembiayaan',
      jumlah_plafond: item.jumlah_plafond || '',
      hasil_survey: item.hasil_survey || '',
      keterangan: item.keterangan || ''
    });
    setIsModalOpen(true);
  };

  const formatWaUrl = (phone) => {
    if (!phone) return '#';
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    return `https://wa.me/${clean}`;
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama || !formData.alamat) {
      toast.error('Nama dan Alamat wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        const res = await request.put(API_ENDPOINTS.SURVEY_PEMBIAYAAN.UPDATE(editingItem.id), formData);
        if (res.success) {
          toast.success('Data survey pembiayaan berhasil diperbarui');
          setIsModalOpen(false);
          fetchSurveyData();
        }
      } else {
        const res = await request.post(API_ENDPOINTS.SURVEY_PEMBIAYAAN.CREATE, formData);
        if (res.success) {
          toast.success('Data survey pembiayaan berhasil ditambahkan');
          setIsModalOpen(false);
          fetchSurveyData();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan data');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, nama) => {
    toast((t) => (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-800">
          Hapus catatan <span className="font-bold text-rose-600">{nama || 'ini'}</span>?
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => toast.dismiss(t.id)} className="px-2.5 py-1 bg-slate-200 text-xs rounded-lg font-medium">
            Batal
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const res = await request.delete(API_ENDPOINTS.SURVEY_PEMBIAYAAN.DELETE(id));
                if (res.success) {
                  toast.success('Data berhasil dihapus');
                  fetchSurveyData();
                }
              } catch (err) {
                toast.error('Gagal menghapus data');
              }
            }}
            className="px-2.5 py-1 bg-rose-600 text-white text-xs rounded-lg font-medium shadow-sm"
          >
            Hapus
          </button>
        </div>
      </div>
    ), { duration: 5000, position: 'top-center' });
  };

  return (
    <div className="space-y-5">
      {/* Top Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari Nama, Alamat, No HP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none bg-slate-50"
            />
          </div>

          {/* Date Filter */}
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none bg-slate-50"
          />

          {/* Jenis Layanan Filter */}
          <select
            value={filterJenis}
            onChange={(e) => { setFilterJenis(e.target.value); setPage(1); }}
            className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none bg-slate-50 font-medium text-slate-700"
          >
            <option value="">-- Semua Jenis Opsi --</option>
            <option value="Survey Pembiayaan">Survey Pembiayaan</option>
            <option value="Penagihan Pembiayaan">Penagihan Pembiayaan</option>
          </select>
        </div>

        {/* Action Button */}
        <button
          onClick={handleOpenCreate}
          className="w-full md:w-auto px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Data Survey</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              SURVEY & PENAGIHAN PEMBIAYAAN
            </h3>
          </div>
          <span className="text-xs font-medium text-slate-500">Tanggal: {tanggal}</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Memuat data survey pembiayaan...</div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-medium text-slate-500">Belum ada catatan survey/penagihan pada tanggal ini</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">NO</th>
                  <th className="py-3 px-4">NAMA</th>
                  <th className="py-3 px-4">ALAMAT</th>
                  <th className="py-3 px-4">NO. HP / WA</th>
                  <th className="py-3 px-4 text-center">OPSI / LAYANAN</th>
                  <th className="py-3 px-4 text-right">PLAFOND (RP)</th>
                  <th className="py-3 px-4">HASIL SURVEY / PENAGIHAN</th>
                  <th className="py-3 px-4">KETERANGAN</th>
                  <th className="py-3 px-4 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((item, idx) => {
                  const isSurvey = item.jenis_layanan === 'Survey Pembiayaan';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 text-center text-slate-500 font-medium">
                        {(page - 1) * limit + idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">{item.nama}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs">{item.alamat}</td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {item.no_hp ? (
                          <a
                            href={formatWaUrl(item.no_hp)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-semibold transition"
                            title="Chat via WhatsApp"
                          >
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{item.no_hp}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] tracking-wide uppercase ${
                            isSurvey
                              ? 'bg-sky-100 text-sky-700 border border-sky-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {item.jenis_layanan}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatRupiah(item.jumlah_plafond)}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs">
                        <p className="line-clamp-2">{item.hasil_survey || '-'}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {item.keterangan || '-'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                          title="Edit Catatan"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.nama)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus Catatan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Navigation */}
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        limit={limit}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
      />

      {/* Create & Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Edit Data Survey / Penagihan" : "Tambah Data Survey / Penagihan Pembiayaan"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
              <input
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Opsi Layanan</label>
              <select
                value={formData.jenis_layanan}
                onChange={(e) => setFormData({ ...formData, jenis_layanan: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-sky-500 bg-white font-medium"
                required
              >
                <option value="Survey Pembiayaan">Survey Pembiayaan</option>
                <option value="Penagihan Pembiayaan">Penagihan Pembiayaan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Calon / Anggota</label>
            <input
              type="text"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              placeholder="Contoh: Hj. Rohimah / Pak Bambang"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap / Lokasi Usaha</label>
            <input
              type="text"
              value={formData.alamat}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              placeholder="Contoh: Pasar Baru Timur No. 15 / Jl. Sukajadi No. 77"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">No. HP / WhatsApp (WA)</label>
              <input
                type="text"
                value={formData.no_hp}
                onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                placeholder="Contoh: 085728042009"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Plafond (Rp)</label>
              <input
                type="number"
                min="0"
                step="10000"
                value={formData.jumlah_plafond}
                onChange={(e) => setFormData({ ...formData, jumlah_plafond: e.target.value })}
                placeholder="Contoh: 15000000"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Hasil Survey / Catatan Penagihan</label>
            <textarea
              value={formData.hasil_survey}
              onChange={(e) => setFormData({ ...formData, hasil_survey: e.target.value })}
              rows={2}
              placeholder="Contoh: Usaha aktif, omset stabil, jaminan BPKB / Janji bayar tgl 5..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan Tambahan</label>
            <input
              type="text"
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              placeholder="Catatan rekomendasi / kesepakatan..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-medium rounded-xl hover:bg-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : editingItem ? 'Perbarui Data' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
