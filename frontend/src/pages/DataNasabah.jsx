import React, { useEffect, useState } from 'react';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2, Edit, UserCheck, MapPin, Navigation, ExternalLink, Loader2 } from 'lucide-react';

export const DataNasabah = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ no_rek: '', nama: '', alamat: '', no_hp: '', titik_koordinat: '', status: 'aktif' });
  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchNasabah();
  }, [page, limit, debouncedSearch]);

  const fetchNasabah = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.NASABAH.LIST, { page, limit, search: debouncedSearch });
      if (res.success) {
        setData(res.data || []);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error('Gagal mengambil data nasabah');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({ no_rek: `150.01.${Math.floor(100 + Math.random() * 900)}`, nama: '', alamat: '', no_hp: '', titik_koordinat: '', status: 'aktif' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      no_rek: item.no_rek,
      nama: item.nama,
      alamat: item.alamat,
      no_hp: item.no_hp || '',
      titik_koordinat: item.titik_koordinat || '',
      status: item.status || 'aktif'
    });
    setIsModalOpen(true);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Browser tidak mendukung fitur GPS/Geolokasi');
      return;
    }
    setGettingLocation(true);
    const toastId = toast.loading('Mengambil koordinat GPS...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        const coordStr = `${lat}, ${lng}`;
        setFormData(prev => ({ ...prev, titik_koordinat: coordStr }));
        toast.success(`Lokasi GPS berhasil didapatkan! (${coordStr})`, { id: toastId });
        setGettingLocation(false);
      },
      (error) => {
        let msg = 'Gagal mengambil lokasi GPS';
        if (error.code === 1) msg = 'Izin akses lokasi ditolak browser. Silakan aktifkan izin lokasi.';
        else if (error.code === 2) msg = 'Posisi lokasi GPS tidak terdeteksi.';
        else if (error.code === 3) msg = 'Waktu permintaan lokasi GPS habis (timeout).';
        toast.error(msg, { id: toastId });
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.no_rek || !formData.nama || !formData.alamat) {
      toast.error('No. Rekening, Nama, dan Alamat wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        const res = await request.put(API_ENDPOINTS.NASABAH.UPDATE(editingItem.id), formData);
        if (res.success) toast.success('Data anggota berhasil diperbarui');
      } else {
        const res = await request.post(API_ENDPOINTS.NASABAH.CREATE, formData);
        if (res.success) toast.success('Anggota berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchNasabah();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan data anggota');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, nama) => {
    toast((t) => (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-800">Hapus anggota <span className="font-bold text-rose-600">{nama}</span>?</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs rounded-lg font-medium"
          >
            Batal
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const res = await request.delete(API_ENDPOINTS.NASABAH.DELETE(id));
                if (res.success) {
                  toast.success('Anggota berhasil dihapus');
                  fetchNasabah();
                }
              } catch (err) {
                toast.error('Gagal menghapus anggota');
              }
            }}
            className="px-2.5 py-1 bg-rose-600 text-white text-xs rounded-lg font-medium shadow-sm"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    ), { duration: 5000, position: 'top-center' });
  };

  return (
    <div className="space-y-5">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari Rekening, Nama, Alamat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none bg-slate-50"
          />
        </div>

        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Anggota</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Memuat data anggota...</div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <UserCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-medium text-slate-500">Tidak ada data anggota ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">No. Rekening</th>
                  <th className="py-3 px-4">Nama Anggota</th>
                  <th className="py-3 px-4">Alamat</th>
                  <th className="py-3 px-4">No. HP</th>
                  <th className="py-3 px-4">Titik Koordinat</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-sky-700">{item.no_rek}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{item.nama}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{item.alamat}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{item.no_hp || '-'}</td>
                    <td className="py-3 px-4">
                      {item.titik_koordinat ? (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.titik_koordinat)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-mono text-[11px] transition border border-sky-200 group"
                          title="Buka lokasi di Google Maps"
                        >
                          <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0 group-hover:scale-110 transition" />
                          <span className="truncate max-w-[130px]">{item.titik_koordinat}</span>
                          <ExternalLink className="w-3 h-3 text-sky-400 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">- Belum ada -</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.status === 'aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.status || 'aktif'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                        title="Edit Anggota"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.nama)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus Anggota"
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

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Data Anggota' : 'Tambah Anggota Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">No. Rekening</label>
            <input
              type="text"
              value={formData.no_rek}
              onChange={(e) => setFormData({ ...formData, no_rek: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Anggota</label>
            <input
              type="text"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              placeholder="Contoh: Budi Santoso"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap</label>
            <textarea
              value={formData.alamat}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              placeholder="Alamat domisili atau tempat usaha"
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">No. Handphone (WA)</label>
            <input
              type="text"
              value={formData.no_hp}
              onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
              placeholder="08123456789"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">Titik Koordinat (GPS Lokasi)</label>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={gettingLocation}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-200 transition disabled:opacity-50"
              >
                {gettingLocation ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Mencari GPS...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-3 h-3" />
                    <span>Ambil Lokasi Saat Ini (GPS)</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={formData.titik_koordinat}
                onChange={(e) => setFormData({ ...formData, titik_koordinat: e.target.value })}
                placeholder="Contoh: -6.917464, 107.619123"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none font-mono"
              />
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
              <span>Bisa diisi manual atau klik tombol GPS di atas.</span>
              {formData.titik_koordinat && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.titik_koordinat)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sky-600 hover:underline font-medium"
                >
                  <span>Buka di Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
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
              {submitting ? 'Menyimpan...' : 'Simpan Data Anggota'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

