import React, { useEffect, useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  UserCheck, 
  MapPin, 
  Navigation, 
  ExternalLink, 
  Loader2,
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RefreshCw,
  X
} from 'lucide-react';

export const DataNasabah = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Modal Create/Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ no_rek: '', nama: '', alamat: '', no_hp: '', titik_koordinat: '', status: 'aktif' });
  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Modal Import Excel State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importFileName, setImportFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);

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

  // --- EXCEL IMPORT LOGIC ---
  const handleOpenImportModal = () => {
    setImportRows([]);
    setImportFileName('');
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsImportModalOpen(true);
  };

  const handleDownloadTemplate = () => {
    try {
      const wsData = [
        ['No. Rekening', 'Nama Anggota', 'Alamat', 'No. HP (WA)', 'Titik Koordinat GPS', 'Status (aktif/nonaktif)'],
        ['150.01.101', 'Ahmad Fauzi', 'Jl. Merdeka No. 12, Bandung', '081234567890', '-6.917464, 107.619123', 'aktif'],
        ['150.01.102', 'Siti Nurhaliza', 'Pasar Baru Blok A No. 5', '085712345678', '-6.918230, 107.604512', 'aktif'],
        ['150.01.103', 'Rudi Hermawan', 'Jl. Sukajadi No. 88', '081398765432', '-6.889100, 107.598200', 'aktif']
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [
        { wch: 18 },
        { wch: 24 },
        { wch: 34 },
        { wch: 18 },
        { wch: 28 },
        { wch: 18 }
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template_Anggota');
      XLSX.writeFile(wb, 'Template_Import_Anggota_BMT.xlsx');
      toast.success('Template Excel berhasil diunduh');
    } catch (err) {
      console.error('Error generating template:', err);
      toast.error('Gagal mengunduh template Excel');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError('');
    setImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setFileError('File Excel tidak memiliki baris data atau kosong.');
          setImportRows([]);
          return;
        }

        const parsed = rawJson.map((row, idx) => {
          const findVal = (keys) => {
            for (const k of Object.keys(row)) {
              const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
              if (keys.some(target => cleanK.includes(target))) {
                return String(row[k] || '').trim();
              }
            }
            return '';
          };

          const no_rek = findVal(['rek', 'rekening', 'norek', 'account', 'no']);
          const nama = findVal(['nama', 'name', 'lengkap', 'anggota', 'nasabah']);
          const alamat = findVal(['alamat', 'address', 'tempat', 'domisili']);
          const no_hp = findVal(['hp', 'wa', 'phone', 'telp', 'handphone', 'whatsapp']);
          const titik_koordinat = findVal(['koordinat', 'gps', 'lat', 'titik', 'location', 'maps']);
          const rawStatus = findVal(['status', 'aktif']).toLowerCase();
          const status = (rawStatus === 'nonaktif' || rawStatus === 'non aktif' || rawStatus === 'tidak aktif') ? 'nonaktif' : 'aktif';

          const isValid = Boolean(no_rek && nama && alamat);
          const errors = [];
          if (!no_rek) errors.push('No. Rekening');
          if (!nama) errors.push('Nama');
          if (!alamat) errors.push('Alamat');

          return {
            rowNumber: idx + 2,
            no_rek,
            nama,
            alamat,
            no_hp,
            titik_koordinat,
            status,
            isValid,
            error: errors.length > 0 ? `Kurang: ${errors.join(', ')}` : ''
          };
        });

        setImportRows(parsed);
      } catch (err) {
        console.error('Error parsing Excel file:', err);
        setFileError('Gagal membaca file Excel. Pastikan format file valid (.xlsx, .xls, atau .csv).');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleProcessImport = async () => {
    const validRows = importRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast.error('Tidak ada data anggota yang valid untuk diimport.');
      return;
    }

    setImporting(true);
    const toastId = toast.loading(`Mengimport ${validRows.length} data anggota...`);
    try {
      const res = await request.post(API_ENDPOINTS.NASABAH.IMPORT_BATCH, {
        nasabahList: validRows.map(({ no_rek, nama, alamat, no_hp, titik_koordinat, status }) => ({
          no_rek,
          nama,
          alamat,
          no_hp,
          titik_koordinat,
          status
        }))
      });

      if (res.success) {
        toast.success(res.message || 'Import data anggota berhasil!', { id: toastId });
        setIsImportModalOpen(false);
        setImportRows([]);
        setImportFileName('');
        fetchNasabah();
      } else {
        toast.error(res.message || 'Gagal mengimport data', { id: toastId });
      }
    } catch (err) {
      toast.error(err.message || 'Terjadi kesalahan saat mengimport', { id: toastId });
    } finally {
      setImporting(false);
    }
  };

  const validCount = importRows.filter(r => r.isValid).length;
  const invalidCount = importRows.length - validCount;

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

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleOpenImportModal}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Anggota</span>
          </button>
        </div>
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

      {/* Form Modal (Create / Edit) */}
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

      {/* Modal Import Excel */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Data Anggota dari Excel"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          {/* Info & Download Template Banner */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Petunjuk Format File Excel
              </h4>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                Pastikan file memiliki kolom wajib: <strong>No. Rekening</strong>, <strong>Nama Anggota</strong>, dan <strong>Alamat</strong>. Kolom No. HP, Titik Koordinat GPS, dan Status bersifat opsional.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Template Excel</span>
            </button>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50/60 rounded-2xl p-6 text-center transition">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
              id="excel-file-input"
            />
            <label
              htmlFor="excel-file-input"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {importFileName ? (
                    <span className="text-emerald-700 font-mono">{importFileName}</span>
                  ) : (
                    'Klik di sini untuk memilih file Excel (.xlsx / .xls / .csv)'
                  )}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {importFileName ? 'Klik lagi jika ingin mengganti file' : 'Maksimal ukuran 5MB'}
                </p>
              </div>
            </label>
          </div>

          {/* Error message */}
          {fileError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Preview Table */}
          {importRows.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-sky-600" />
                    Pratinjau Data ({importRows.length} Baris)
                  </h4>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md">
                    {validCount} Siap Import
                  </span>
                  {invalidCount > 0 && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-md">
                      {invalidCount} Tidak Valid
                    </span>
                  )}
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 sticky top-0 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Baris</th>
                      <th className="py-2.5 px-3">No. Rekening</th>
                      <th className="py-2.5 px-3">Nama Anggota</th>
                      <th className="py-2.5 px-3">Alamat</th>
                      <th className="py-2.5 px-3">No. HP</th>
                      <th className="py-2.5 px-3">Titik Koordinat</th>
                      <th className="py-2.5 px-3 text-center">Status Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importRows.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/40'}>
                        <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{row.rowNumber}</td>
                        <td className="py-2 px-3 font-mono font-bold text-sky-700">{row.no_rek || <span className="text-rose-500 italic">Kosong</span>}</td>
                        <td className="py-2 px-3 font-bold text-slate-800">{row.nama || <span className="text-rose-500 italic">Kosong</span>}</td>
                        <td className="py-2 px-3 text-slate-600 max-w-xs truncate">{row.alamat || <span className="text-rose-500 italic">Kosong</span>}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{row.no_hp || '-'}</td>
                        <td className="py-2 px-3 text-slate-500 text-[11px] font-mono">{row.titik_koordinat || '-'}</td>
                        <td className="py-2 px-3 text-center">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full" title={row.error}>
                              <AlertCircle className="w-3 h-3" />
                              {row.error}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-medium rounded-xl hover:bg-slate-200 transition"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleProcessImport}
              disabled={validCount === 0 || importing}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengimport...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Proses Import ({validCount} Data)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
