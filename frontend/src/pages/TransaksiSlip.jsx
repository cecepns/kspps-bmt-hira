import React, { useEffect, useState } from 'react';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2, Receipt, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export const TransaksiSlip = () => {
  const [data, setData] = useState([]);
  const [nasabahList, setNasabahList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    nasabah_id: '',
    tipe: 'setoran',
    nominal: '',
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
    fetchTransaksi();
    fetchNasabahOptions();
  }, [page, limit, debouncedSearch, tanggal]);

  const fetchTransaksi = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.TRANSAKSI.LIST, { page, limit, search: debouncedSearch, tanggal });
      if (res.success) {
        setData(res.data || []);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error('Gagal memuat transaksi');
    } finally {
      setLoading(false);
    }
  };

  const fetchNasabahOptions = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.NASABAH.LIST, { limit: 100 });
      if (res.success) {
        setNasabahList(res.data || []);
      }
    } catch (err) { console.error(err); }
  };

  const handleOpenCreate = () => {
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      nasabah_id: nasabahList.length > 0 ? nasabahList[0].id : '',
      tipe: 'setoran',
      nominal: '',
      keterangan: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nasabah_id || !formData.nominal) {
      toast.error('Pilih Nasabah dan masukkan Nominal');
      return;
    }

    setSubmitting(true);
    try {
      const res = await request.post(API_ENDPOINTS.TRANSAKSI.CREATE, formData);
      if (res.success) {
        toast.success('Transaksi slip berhasil dicatat');
        setIsModalOpen(false);
        fetchTransaksi();
      }
    } catch (err) {
      toast.error(err.message || 'Gagal mencatat transaksi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-800">Hapus transaksi slip ini?</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => toast.dismiss(t.id)} className="px-2.5 py-1 bg-slate-200 text-xs rounded-lg">Batal</button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const res = await request.delete(API_ENDPOINTS.TRANSAKSI.DELETE(id));
                if (res.success) {
                  toast.success('Transaksi dihapus');
                  fetchTransaksi();
                }
              } catch (err) { toast.error('Gagal menghapus'); }
            }}
            className="px-2.5 py-1 bg-rose-600 text-white text-xs rounded-lg"
          >
            Hapus
          </button>
        </div>
      </div>
    ));
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
  };

  return (
    <div className="space-y-5">
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari Rekening / Nama Anggota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none bg-slate-50"
            />
          </div>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none bg-slate-50"
          />
        </div>

        <button
          onClick={handleOpenCreate}
          className="w-full md:w-auto px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Slip Setoran/Penarikan</span>
        </button>
      </div>

      {/* Table Data (Slip Format Excel) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            DAFTAR ANGGOTA PENARIKAN DAN SETORAN TUNAI (SLIP)
          </h3>
          <span className="text-xs font-medium text-slate-500">Tanggal: {tanggal}</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Memuat transaksi slip...</div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-medium text-slate-500">Belum ada transaksi slip pada tanggal ini</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">NO</th>
                  <th className="py-3 px-4">REK</th>
                  <th className="py-3 px-4">NAMA</th>
                  <th className="py-3 px-4">ALAMAT</th>
                  <th className="py-3 px-4 text-center">TIPE SLIP</th>
                  <th className="py-3 px-4 text-right">NOMINAL (Rp)</th>
                  <th className="py-3 px-4">KETERANGAN</th>
                  <th className="py-3 px-4 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-center text-slate-500 font-medium">{(page - 1) * limit + idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-sky-700">{item.no_rek}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{item.nama}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{item.alamat}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        item.tipe === 'setoran' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {item.tipe === 'setoran' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {item.tipe}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-black ${item.tipe === 'setoran' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatRupiah(item.nominal)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{item.keterangan || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        limit={limit}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
      />

      {/* Input Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Input Slip Penarikan & Setoran Tunai"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Transaksi</label>
            <input
              type="date"
              value={formData.tanggal}
              onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Anggota / Nasabah</label>
            <select
              value={formData.nasabah_id}
              onChange={(e) => setFormData({ ...formData, nasabah_id: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none bg-white"
              required
            >
              <option value="">-- Pilih Nasabah --</option>
              {nasabahList.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.no_rek} - {n.nama} ({n.alamat})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Transaksi Slip</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipe: 'setoran' })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                  formData.tipe === 'setoran'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>SETORAN TUNAI</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipe: 'penarikan' })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                  formData.tipe === 'penarikan'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>PENARIKAN TUNAI</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nominal (Rp)</label>
            <input
              type="number"
              value={formData.nominal}
              onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
              placeholder="Contoh: 100000"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none font-bold text-slate-800"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan / Catatan</label>
            <input
              type="text"
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              placeholder="Contoh: Setoran Sibela / Simpanan Harian"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
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
              {submitting ? 'Menyimpan...' : 'Simpan Transaksi Slip'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
