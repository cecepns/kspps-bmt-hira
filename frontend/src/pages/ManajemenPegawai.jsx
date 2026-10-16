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
  ShieldCheck,
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Users
} from 'lucide-react';

export const ManajemenPegawai = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    username: '',
    password: '',
    role: 'pegawai',
    jabatan: 'Marketing',
    no_hp: '',
    status: 'aktif'
  });
  const [submitting, setSubmitting] = useState(false);

  // Bulk Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importFileName, setImportFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [page, limit, debouncedSearch]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.USERS.LIST, { page, limit, search: debouncedSearch });
      if (res.success) {
        setData(res.data || []);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error('Gagal mengambil data pegawai');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      nama: '',
      username: '',
      password: '',
      role: 'pegawai',
      jabatan: 'Marketing',
      no_hp: '',
      status: 'aktif'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (userItem) => {
    setEditingItem(userItem);
    setFormData({
      nama: userItem.nama,
      username: userItem.username,
      password: '',
      role: userItem.role,
      jabatan: userItem.jabatan || (userItem.role === 'admin' ? 'Admin' : userItem.role === 'manager' ? 'Manager Cabang' : 'Marketing'),
      no_hp: userItem.no_hp || '',
      status: userItem.status || 'aktif'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama || !formData.username) {
      toast.error('Nama dan Username wajib diisi');
      return;
    }
    if (!editingItem && !formData.password) {
      toast.error('Password wajib diisi untuk user baru');
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        const res = await request.put(API_ENDPOINTS.USERS.UPDATE(editingItem.id), formData);
        if (res.success) toast.success('Data pegawai diperbarui');
      } else {
        const res = await request.post(API_ENDPOINTS.USERS.CREATE, formData);
        if (res.success) toast.success('Pegawai baru berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan data pegawai');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, nama) => {
    toast((t) => (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-800">
          Hapus akun pegawai <span className="font-bold text-rose-600">{nama}</span>?
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => toast.dismiss(t.id)} className="px-2.5 py-1 bg-slate-200 text-xs rounded-lg">
            Batal
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const res = await request.delete(API_ENDPOINTS.USERS.DELETE(id));
                if (res.success) {
                  toast.success('Pegawai berhasil dihapus');
                  fetchUsers();
                }
              } catch (err) {
                toast.error('Gagal menghapus');
              }
            }}
            className="px-2.5 py-1 bg-rose-600 text-white text-xs rounded-lg"
          >
            Hapus
          </button>
        </div>
      </div>
    ));
  };

  // --- BULK INSERT EXCEL HANDLERS ---
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
        ['Nama Pegawai', 'Username', 'Password', 'Role (pegawai/admin/manager)', 'Jabatan', 'No. HP (WA)', 'Status (aktif/nonaktif)'],
        ['Ahmad Syahputra', 'ahmad_marketing', '123456', 'pegawai', 'Marketing', '081234567890', 'aktif'],
        ['Budi Santoso', 'budi_admin', 'admin123', 'admin', 'Admin Operasional', '081298765432', 'aktif'],
        ['Dewi Lestari', 'dewi_manager', 'manager123', 'manager', 'Manager Cabang', '085712345678', 'aktif']
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [
        { wch: 25 },
        { wch: 20 },
        { wch: 16 },
        { wch: 30 },
        { wch: 22 },
        { wch: 18 },
        { wch: 22 }
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template_Pegawai');
      XLSX.writeFile(wb, 'Template_Import_Pegawai_BMT.xlsx');
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
              if (keys.some((target) => cleanK.includes(target))) {
                return String(row[k] || '').trim();
              }
            }
            return '';
          };

          const nama = findVal(['nama', 'name', 'pegawai', 'karyawan', 'lengkap']);
          const username = findVal(['username', 'user', 'akun', 'id']);
          const password = findVal(['password', 'pass', 'sandi']) || '123456';

          let rawRole = findVal(['role', 'peran', 'akses', 'tingkat']).toLowerCase();
          let role = 'pegawai';
          if (rawRole.includes('admin')) role = 'admin';
          else if (rawRole.includes('manag')) role = 'manager';
          else if (rawRole.includes('pegawai') || rawRole.includes('marketing')) role = 'pegawai';

          let jabatan = findVal(['jabatan', 'posisi', 'divisi', 'title']);
          if (!jabatan) {
            jabatan = role === 'admin' ? 'Admin' : role === 'manager' ? 'Manager Cabang' : 'Marketing';
          }

          const no_hp = findVal(['hp', 'wa', 'phone', 'telp', 'handphone', 'whatsapp']);
          const rawStatus = findVal(['status', 'aktif']).toLowerCase();
          const status =
            rawStatus === 'nonaktif' || rawStatus === 'non aktif' || rawStatus === 'tidak aktif'
              ? 'nonaktif'
              : 'aktif';

          const isValid = Boolean(nama && username);
          const errors = [];
          if (!nama) errors.push('Nama');
          if (!username) errors.push('Username');

          return {
            rowNumber: idx + 2,
            nama,
            username,
            password,
            role,
            jabatan,
            no_hp,
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
    const validRows = importRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error('Tidak ada data pegawai yang valid untuk diimport.');
      return;
    }

    setImporting(true);
    const toastId = toast.loading(`Mengimport ${validRows.length} data pegawai...`);
    try {
      const res = await request.post(API_ENDPOINTS.USERS.IMPORT_BATCH, {
        usersList: validRows.map(({ nama, username, password, role, jabatan, no_hp, status }) => ({
          nama,
          username,
          password,
          role,
          jabatan,
          no_hp,
          status
        }))
      });

      if (res.success) {
        toast.success(res.message || 'Import data pegawai berhasil!', { id: toastId });
        setIsImportModalOpen(false);
        setImportRows([]);
        setImportFileName('');
        fetchUsers();
      } else {
        toast.error(res.message || 'Gagal mengimport data', { id: toastId });
      }
    } catch (err) {
      toast.error(err.message || 'Terjadi kesalahan saat mengimport', { id: toastId });
    } finally {
      setImporting(false);
    }
  };

  const validCount = importRows.filter((r) => r.isValid).length;
  const invalidCount = importRows.length - validCount;

  return (
    <div className="space-y-5">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari Nama / Username..."
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
            <span>Tambah Pegawai Baru</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Memuat data pegawai...</div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-medium text-slate-500">Tidak ada data pegawai ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Nama Pegawai</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Jabatan</th>
                  <th className="py-3 px-4">No. HP</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 font-black flex items-center justify-center text-xs shrink-0">
                        {u.nama ? u.nama.charAt(0).toUpperCase() : 'P'}
                      </div>
                      <span>{u.nama}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-600">{u.username}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          u.role === 'admin'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : u.role === 'manager'
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : 'bg-sky-100 text-sky-800 border-sky-200'
                        }`}
                      >
                        {u.role === 'pegawai' ? 'Marketing' : u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{u.jabatan || 'Marketing'}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{u.no_hp || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.status === 'aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {u.status || 'aktif'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                        title="Edit Pegawai"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id, u.nama)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus Pegawai"
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
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />

      {/* Form Modal (Create / Edit) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Pegawai</label>
            <input
              type="text"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              placeholder="Contoh: Ahmad Syahputra"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Username Login</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="ahmad_syahputra"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none font-mono focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password {editingItem && <span className="text-slate-400 font-normal">(Kosongkan jika tidak diubah)</span>}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="******"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-sky-500"
              required={!editingItem}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Role Akses</label>
              <select
                value={formData.role}
                onChange={(e) => {
                  const newRole = e.target.value;
                  let defaultJabatan = formData.jabatan;
                  if (
                    newRole === 'pegawai' &&
                    (!formData.jabatan || formData.jabatan === 'Admin' || formData.jabatan === 'Manager Cabang')
                  ) {
                    defaultJabatan = 'Marketing';
                  } else if (
                    newRole === 'admin' &&
                    (!formData.jabatan || formData.jabatan === 'Marketing' || formData.jabatan === 'Manager Cabang')
                  ) {
                    defaultJabatan = 'Admin';
                  } else if (
                    newRole === 'manager' &&
                    (!formData.jabatan || formData.jabatan === 'Marketing' || formData.jabatan === 'Admin')
                  ) {
                    defaultJabatan = 'Manager Cabang';
                  }
                  setFormData({ ...formData, role: newRole, jabatan: defaultJabatan });
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none bg-white focus:ring-2 focus:ring-sky-500"
              >
                <option value="pegawai">Marketing</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan</label>
              <input
                type="text"
                value={formData.jabatan}
                onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                placeholder="Marketing / Teller / Kolektor"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">No. HP / WA</label>
              <input
                type="text"
                value={formData.no_hp}
                onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                placeholder="08123456789"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none font-mono focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status Akun</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none bg-white focus:ring-2 focus:ring-sky-500"
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 transition"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Data Pegawai'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Bulk Import Excel */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Data Pegawai dari Excel"
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
                Kolom wajib: <strong>Nama Pegawai</strong> dan <strong>Username</strong>. Kolom opsional: Password (default: 123456), Role (<strong>pegawai</strong>, <strong>admin</strong>, atau <strong>manager</strong>), Jabatan, No. HP, dan Status.
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
              id="excel-pegawai-file-input"
            />
            <label
              htmlFor="excel-pegawai-file-input"
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

          {/* Error Message */}
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
                      <th className="py-2.5 px-3">Nama Pegawai</th>
                      <th className="py-2.5 px-3">Username</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Jabatan</th>
                      <th className="py-2.5 px-3">No. HP</th>
                      <th className="py-2.5 px-3 text-center">Status Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importRows.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/40'}>
                        <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{row.rowNumber}</td>
                        <td className="py-2 px-3 font-bold text-slate-800">
                          {row.nama || <span className="text-rose-500 italic">Kosong</span>}
                        </td>
                        <td className="py-2 px-3 font-mono font-medium text-slate-600">
                          {row.username || <span className="text-rose-500 italic">Kosong</span>}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              row.role === 'admin'
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : row.role === 'manager'
                                ? 'bg-purple-100 text-purple-800 border-purple-200'
                                : 'bg-sky-100 text-sky-800 border-sky-200'
                            }`}
                          >
                            {row.role === 'pegawai' ? 'Marketing' : row.role}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">{row.jabatan}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{row.no_hp || '-'}</td>
                        <td className="py-2 px-3 text-center">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
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

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {importRows.length > 0 ? `${validCount} dari ${importRows.length} baris siap diproses` : 'Pilih file excel untuk pratinjau'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Tutup
              </button>
              <button
                type="button"
                disabled={validCount === 0 || importing}
                onClick={handleProcessImport}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-40 transition flex items-center gap-1.5"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{importing ? 'Mengimport...' : `Import ${validCount} Pegawai`}</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
