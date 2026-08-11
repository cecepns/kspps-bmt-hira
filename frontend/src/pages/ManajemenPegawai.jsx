import React, { useEffect, useState } from 'react';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2, Edit, ShieldCheck } from 'lucide-react';

export const ManajemenPegawai = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    nama: '', username: '', password: '', role: 'pegawai', jabatan: 'Teller/Kolektor', no_hp: '', status: 'aktif'
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
    setFormData({ nama: '', username: '', password: '', role: 'pegawai', jabatan: 'Teller/Kolektor', no_hp: '', status: 'aktif' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (userItem) => {
    setEditingItem(userItem);
    setFormData({
      nama: userItem.nama,
      username: userItem.username,
      password: '',
      role: userItem.role,
      jabatan: userItem.jabatan || 'Teller/Kolektor',
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
        <p className="text-xs font-semibold text-slate-800">Hapus akun pegawai <span className="font-bold text-rose-600">{nama}</span>?</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => toast.dismiss(t.id)} className="px-2.5 py-1 bg-slate-200 text-xs rounded-lg">Batal</button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const res = await request.delete(API_ENDPOINTS.USERS.DELETE(id));
                if (res.success) {
                  toast.success('Pegawai berhasil dihapus');
                  fetchUsers();
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

        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pegawai Baru</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Memuat data pegawai...</div>
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
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 font-black flex items-center justify-center text-xs">
                        {u.nama.charAt(0)}
                      </div>
                      <span>{u.nama}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-600">{u.username}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{u.jabatan || 'Teller'}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{u.no_hp || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.status === 'aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.status || 'aktif'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id, u.nama)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Username Login</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="ahmad"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none font-mono"
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
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none"
              required={!editingItem}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Role Akses</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none bg-white"
              >
                <option value="pegawai">Pegawai / Teller</option>
                <option value="admin">Admin / Manager</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan</label>
              <input
                type="text"
                value={formData.jabatan}
                onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                placeholder="Kolektor / Teller"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">No. HP / WA</label>
            <input
              type="text"
              value={formData.no_hp}
              onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
              placeholder="08123456789"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none font-mono"
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
              {submitting ? 'Menyimpan...' : 'Simpan Data Pegawai'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
