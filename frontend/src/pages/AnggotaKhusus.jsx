import React, { useEffect, useState } from 'react';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2, UserX, UserMinus } from 'lucide-react';

export const AnggotaKhusus = ({ type }) => {
  const isTidakTransaksi = type === 'tidak-transaksi';
  const endpointObj = isTidakTransaksi ? API_ENDPOINTS.TIDAK_TRANSAKSI : API_ENDPOINTS.TIDAK_DIKUNJUNGI;
  const titleText = isTidakTransaksi ? 'DAFTAR ANGGOTA YANG TIDAK TRANSAKSI' : 'DAFTAR ANGGOTA YANG TIDAK DIKUNJUNGI';

  const [data, setData] = useState([]);
  const [nasabahList, setNasabahList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    no_rek: '',
    nama: '',
    alamat: '',
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
    fetchData();
    fetchNasabahList();
  }, [type, page, limit, debouncedSearch, tanggal]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await request.get(endpointObj.LIST, { page, limit, search: debouncedSearch, tanggal });
      if (res.success) {
        setData(res.data || []);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const fetchNasabahList = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.NASABAH.LIST, { limit: 100 });
      if (res.success) setNasabahList(res.data || []);
    } catch (e) {}
  };

  const handleSelectNasabahChange = (e) => {
    const selectedId = e.target.value;
    const selected = nasabahList.find(n => n.id == selectedId);
    if (selected) {
      setFormData({
        ...formData,
        no_rek: selected.no_rek,
        nama: selected.nama,
        alamat: selected.alamat
      });
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      no_rek: '',
      nama: '',
      alamat: '',
      keterangan: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.no_rek || !formData.nama) {
      toast.error('No Rekening & Nama wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      const res = await request.post(endpointObj.CREATE, formData);
      if (res.success) {
        toast.success('Data berhasil disimpan');
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-800">Hapus catatan ini?</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => toast.dismiss(t.id)} className="px-2.5 py-1 bg-slate-200 text-xs rounded-lg">Batal</button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const res = await request.delete(endpointObj.DELETE(id));
                if (res.success) {
                  toast.success('Berhasil dihapus');
                  fetchData();
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

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari Rekening / Nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none bg-slate-50"
            />
          </div>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none bg-slate-50"
          />
        </div>

        <button
          onClick={handleOpenCreate}
          className="w-full md:w-auto px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Catat {isTidakTransaksi ? 'Tidak Transaksi' : 'Tidak Dikunjungi'}</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{titleText}</h3>
          <span className="text-xs font-medium text-slate-500">Tanggal: {tanggal}</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Memuat data...</div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            {isTidakTransaksi ? <UserX className="w-10 h-10 text-slate-300 mx-auto" /> : <UserMinus className="w-10 h-10 text-slate-300 mx-auto" />}
            <p className="text-xs font-medium text-slate-500">Tidak ada catatan pada tanggal ini</p>
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Form ${isTidakTransaksi ? 'Anggota Tidak Transaksi' : 'Anggota Tidak Dikunjungi'}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
            <input
              type="date"
              value={formData.tanggal}
              onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pilih dari Master Nasabah (Opsional Auto Fill)</label>
            <select
              onChange={handleSelectNasabahChange}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none bg-white mb-2"
            >
              <option value="">-- Pilih Nasabah --</option>
              {nasabahList.map(n => (
                <option key={n.id} value={n.id}>{n.no_rek} - {n.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">No. Rekening</label>
            <input
              type="text"
              value={formData.no_rek}
              onChange={(e) => setFormData({ ...formData, no_rek: e.target.value })}
              placeholder="Contoh: 101.01.005"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Anggota</label>
            <input
              type="text"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              placeholder="Nama Lengkap"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Alamat</label>
            <input
              type="text"
              value={formData.alamat}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              placeholder="Alamat"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan Alasan</label>
            <input
              type="text"
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              placeholder={isTidakTransaksi ? "Toko Tutup / Tidak ada orang" : "Hujan deras / Akses banjir"}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-medium rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
