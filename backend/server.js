const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'bmt_hira',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware Test Connection / Fallback In-Memory Storage if MySQL not active yet
let isDbConnected = false;
async function checkDb() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    isDbConnected = true;
    console.log('✅ Connected to MySQL Database: bmt_hira');
  } catch (err) {
    isDbConnected = false;
    console.log('⚠️ MySQL not reachable yet. Operating with fallback in-memory mock storage mode.');
  }
}
checkDb();

// In-Memory mock store for development backup
const mockStore = {
  users: [
    { id: 1, nama: 'Administrator BMT', username: 'admin', password: 'admin123', role: 'admin', jabatan: 'Manager Cabang', no_hp: '081234567890', status: 'aktif' },
    { id: 2, nama: 'Ahmad Teller', username: 'ahmad', password: 'pegawai123', role: 'pegawai', jabatan: 'Teller / Kolektor', no_hp: '089876543210', status: 'aktif' }
  ],
  nasabah: [
    { id: 1, no_rek: '101.01.001', nama: 'Budi Santoso', alamat: 'Jl. Merdeka No. 12, Bandung', no_hp: '0811111111', status: 'aktif' },
    { id: 2, no_rek: '101.01.002', nama: 'Siti Aminah', alamat: 'Pasar Baru Blok A No. 4', no_hp: '0822222222', status: 'aktif' },
    { id: 3, no_rek: '101.01.003', nama: 'Toko Berkah Raya', alamat: 'Jl. Sunda No. 45', no_hp: '0833333333', status: 'aktif' }
  ],
  transaksi: [
    { id: 1, tanggal: new Date().toISOString().split('T')[0], nasabah_id: 1, no_rek: '101.01.001', nama: 'Budi Santoso', alamat: 'Jl. Merdeka No. 12, Bandung', user_id: 2, tipe: 'setoran', nominal: 150000, keterangan: 'Setoran Harian Sibela' },
    { id: 2, tanggal: new Date().toISOString().split('T')[0], nasabah_id: 2, no_rek: '101.01.002', nama: 'Siti Aminah', alamat: 'Pasar Baru Blok A No. 4', user_id: 2, tipe: 'setoran', nominal: 50000, keterangan: 'Setoran Tabungan' },
    { id: 3, tanggal: new Date().toISOString().split('T')[0], nasabah_id: 3, no_rek: '101.01.003', nama: 'Toko Berkah Raya', alamat: 'Jl. Sunda No. 45', user_id: 2, tipe: 'penarikan', nominal: 200000, keterangan: 'Penarikan Tunai' }
  ],
  prospek: [
    { id: 1, tanggal: new Date().toISOString().split('T')[0], user_id: 2, nama: 'Warung Ibu Hani', alamat_tempat: 'Jl. Cihampelas No. 8', hasil: 'Tertarik', keterangan: 'Buka simpanan minggu depan' }
  ],
  tidak_transaksi: [
    { id: 1, tanggal: new Date().toISOString().split('T')[0], user_id: 2, no_rek: '101.01.005', nama: 'Deden Supriatna', alamat: 'Jl. Asia Afrika', keterangan: 'Toko Tutup' }
  ],
  tidak_dikunjungi: [
    { id: 1, tanggal: new Date().toISOString().split('T')[0], user_id: 2, no_rek: '101.01.008', nama: 'Rina Marlina', alamat: 'Kopo Sayati', keterangan: 'Hujan Deras / Akses Banjir' }
  ],
  laporan_kas: [
    { id: 1, tanggal: new Date().toISOString().split('T')[0], user_id: 2, kas_kantor: 500000, kolektor: 200000, penerimaan_sibela: 150000, penerimaan_lain: 0, pengeluaran_sibela: 200000, pengeluaran_pinjaman: 0, pengeluaran_operasional: 0, pengeluaran_lain: 0, total_kas_masuk: 850000, total_kas_keluar: 200000 }
  ],
  pecahan: [
    { id: 1, tanggal: new Date().toISOString().split('T')[0], user_id: 2, p100k: 5, p50k: 5, p20k: 4, p10k: 10, p5k: 4, p2k: 0, p1k: 0, p500: 0, p200: 0, p100: 0, jumlah_total: 850000, selisih: 0, teller_name: 'Ahmad Teller', mengetahui_name: 'Koordinator Kolektor', manager_name: 'Administrator BMT' }
  ]
};

// Auth middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Akses ditolak. Token tidak ditemukan.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bmthira_secret_key_2026_super_secure');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token tidak valid' });
  }
};

// --- AUTH ENDPOINTS ---
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
  }

  let user = null;
  if (isDbConnected) {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE username = ? AND status = "aktif"', [username]);
      if (rows.length > 0) user = rows[0];
    } catch (e) { console.error(e); }
  } else {
    user = mockStore.users.find(u => u.username === username && u.status === 'aktif');
  }

  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, message: 'Username atau password salah' });
  }

  const token = jwt.sign(
    { id: user.id, nama: user.nama, username: user.username, role: user.role, jabatan: user.jabatan },
    process.env.JWT_SECRET || 'bmthira_secret_key_2026_super_secure',
    { expiresIn: '1d' }
  );

  res.json({
    success: true,
    message: 'Login berhasil',
    token,
    user: { id: user.id, nama: user.nama, username: user.username, role: user.role, jabatan: user.jabatan, no_hp: user.no_hp }
  });
});

app.get('/api/auth/profile', authMiddleware, async (req, res) => {
  res.json({ success: true, data: req.user });
});

// --- USERS MANAGEMENT (Admin Only) ---
app.get('/api/users', authMiddleware, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const offset = (page - 1) * limit;

  if (isDbConnected) {
    try {
      const searchPattern = `%${search}%`;
      const [countResult] = await pool.query('SELECT COUNT(*) as total FROM users WHERE nama LIKE ? OR username LIKE ?', [searchPattern, searchPattern]);
      const total = countResult[0].total;

      const [rows] = await pool.query('SELECT id, nama, username, role, jabatan, no_hp, status, created_at FROM users WHERE nama LIKE ? OR username LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?', [searchPattern, searchPattern, limit, offset]);

      return res.json({
        success: true,
        data: rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      });
    } catch (e) {
      console.error(e);
    }
  }

  // Fallback Mock
  let filtered = mockStore.users.filter(u => u.nama.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase()));
  const total = filtered.length;
  const sliced = filtered.slice(offset, offset + limit).map(u => {
    const { password, ...rest } = u;
    return rest;
  });

  res.json({
    success: true,
    data: sliced,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
});

app.post('/api/users', authMiddleware, async (req, res) => {
  const { nama, username, password, role, jabatan, no_hp } = req.body;
  if (!nama || !username || !password) {
    return res.status(400).json({ success: false, message: 'Nama, username, dan password wajib diisi' });
  }

  if (isDbConnected) {
    try {
      const [result] = await pool.query('INSERT INTO users (nama, username, password, role, jabatan, no_hp) VALUES (?, ?, ?, ?, ?, ?)', [nama, username, password, role || 'pegawai', jabatan || 'Teller', no_hp || '']);
      return res.json({ success: true, message: 'Pegawai berhasil ditambahkan', id: result.insertId });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  const newUser = {
    id: mockStore.users.length + 1,
    nama, username, password,
    role: role || 'pegawai',
    jabatan: jabatan || 'Teller',
    no_hp: no_hp || '',
    status: 'aktif'
  };
  mockStore.users.push(newUser);
  res.json({ success: true, message: 'Pegawai berhasil ditambahkan', data: newUser });
});

app.put('/api/users/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { nama, username, password, role, jabatan, no_hp, status } = req.body;

  if (isDbConnected) {
    try {
      let query = 'UPDATE users SET nama = ?, username = ?, role = ?, jabatan = ?, no_hp = ?, status = ?';
      let params = [nama, username, role, jabatan, no_hp, status];
      if (password) {
        query += ', password = ?';
        params.push(password);
      }
      query += ' WHERE id = ?';
      params.push(id);
      await pool.query(query, params);
      return res.json({ success: true, message: 'Data pegawai diperbarui' });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  const user = mockStore.users.find(u => u.id == id);
  if (user) {
    if (nama) user.nama = nama;
    if (username) user.username = username;
    if (password) user.password = password;
    if (role) user.role = role;
    if (jabatan) user.jabatan = jabatan;
    if (no_hp !== undefined) user.no_hp = no_hp;
    if (status) user.status = status;
  }
  res.json({ success: true, message: 'Data pegawai diperbarui' });
});

app.delete('/api/users/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  if (isDbConnected) {
    try {
      await pool.query('DELETE FROM users WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Pegawai berhasil dihapus' });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  mockStore.users = mockStore.users.filter(u => u.id != id);
  res.json({ success: true, message: 'Pegawai berhasil dihapus' });
});

// --- NASABAH ENDPOINTS ---
app.get('/api/nasabah', authMiddleware, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const offset = (page - 1) * limit;

  if (isDbConnected) {
    try {
      const searchPattern = `%${search}%`;
      const [countRes] = await pool.query('SELECT COUNT(*) as total FROM nasabah WHERE nama LIKE ? OR no_rek LIKE ? OR alamat LIKE ?', [searchPattern, searchPattern, searchPattern]);
      const total = countRes[0].total;
      const [rows] = await pool.query('SELECT * FROM nasabah WHERE nama LIKE ? OR no_rek LIKE ? OR alamat LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?', [searchPattern, searchPattern, searchPattern, limit, offset]);

      return res.json({ success: true, data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (e) { console.error(e); }
  }

  let filtered = mockStore.nasabah.filter(n => n.nama.toLowerCase().includes(search.toLowerCase()) || n.no_rek.includes(search) || n.alamat.toLowerCase().includes(search.toLowerCase()));
  const total = filtered.length;
  const sliced = filtered.slice(offset, offset + limit);

  res.json({ success: true, data: sliced, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

app.post('/api/nasabah', authMiddleware, async (req, res) => {
  const { no_rek, nama, alamat, no_hp } = req.body;
  if (!no_rek || !nama || !alamat) {
    return res.status(400).json({ success: false, message: 'No. Rekening, Nama, dan Alamat wajib diisi' });
  }

  if (isDbConnected) {
    try {
      const [resDb] = await pool.query('INSERT INTO nasabah (no_rek, nama, alamat, no_hp) VALUES (?, ?, ?, ?)', [no_rek, nama, alamat, no_hp || '']);
      return res.json({ success: true, message: 'Nasabah berhasil ditambahkan', id: resDb.insertId });
    } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
  }

  const newNasabah = { id: mockStore.nasabah.length + 1, no_rek, nama, alamat, no_hp: no_hp || '', status: 'aktif' };
  mockStore.nasabah.push(newNasabah);
  res.json({ success: true, message: 'Nasabah berhasil ditambahkan', data: newNasabah });
});

app.put('/api/nasabah/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { no_rek, nama, alamat, no_hp, status } = req.body;

  if (isDbConnected) {
    try {
      await pool.query('UPDATE nasabah SET no_rek = ?, nama = ?, alamat = ?, no_hp = ?, status = ? WHERE id = ?', [no_rek, nama, alamat, no_hp, status, id]);
      return res.json({ success: true, message: 'Data nasabah diperbarui' });
    } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
  }

  const item = mockStore.nasabah.find(n => n.id == id);
  if (item) {
    if (no_rek) item.no_rek = no_rek;
    if (nama) item.nama = nama;
    if (alamat) item.alamat = alamat;
    if (no_hp !== undefined) item.no_hp = no_hp;
    if (status) item.status = status;
  }
  res.json({ success: true, message: 'Data nasabah diperbarui' });
});

app.delete('/api/nasabah/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  if (isDbConnected) {
    try {
      await pool.query('DELETE FROM nasabah WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Nasabah berhasil dihapus' });
    } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
  }
  mockStore.nasabah = mockStore.nasabah.filter(n => n.id != id);
  res.json({ success: true, message: 'Nasabah berhasil dihapus' });
});

// --- TRANSAKSI HARIAN (SLIP SETORAN & PENARIKAN) ---
app.get('/api/transaksi', authMiddleware, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const tanggal = req.query.tanggal || '';
  const offset = (page - 1) * limit;

  if (isDbConnected) {
    try {
      let query = `
        SELECT t.*, n.no_rek, n.nama, n.alamat, u.nama as pegawai_nama 
        FROM transaksi_harian t
        JOIN nasabah n ON t.nasabah_id = n.id
        JOIN users u ON t.user_id = u.id
        WHERE (n.nama LIKE ? OR n.no_rek LIKE ?)
      `;
      let params = [`%${search}%`, `%${search}%`];
      if (tanggal) {
        query += ' AND t.tanggal = ?';
        params.push(tanggal);
      }

      const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM (${query}) countTable`, params);
      const total = countRows[0].total;

      query += ' ORDER BY t.id DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [rows] = await pool.query(query, params);
      return res.json({ success: true, data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (e) { console.error(e); }
  }

  let filtered = mockStore.transaksi.filter(t => {
    const matchSearch = t.nama.toLowerCase().includes(search.toLowerCase()) || t.no_rek.includes(search);
    const matchTanggal = tanggal ? t.tanggal === tanggal : true;
    return matchSearch && matchTanggal;
  });
  const total = filtered.length;
  const sliced = filtered.slice(offset, offset + limit);

  res.json({ success: true, data: sliced, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

app.post('/api/transaksi', authMiddleware, async (req, res) => {
  const { tanggal, nasabah_id, tipe, nominal, keterangan } = req.body;
  if (!nasabah_id || !tipe || !nominal) {
    return res.status(400).json({ success: false, message: 'Nasabah, Tipe Transaksi, dan Nominal wajib diisi' });
  }
  const dateStr = tanggal || new Date().toISOString().split('T')[0];

  if (isDbConnected) {
    try {
      const [resDb] = await pool.query('INSERT INTO transaksi_harian (tanggal, nasabah_id, user_id, tipe, nominal, keterangan) VALUES (?, ?, ?, ?, ?, ?)', [dateStr, nasabah_id, req.user.id, tipe, nominal, keterangan || '']);
      return res.json({ success: true, message: 'Transaksi berhasil disimpan', id: resDb.insertId });
    } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
  }

  const nasabahObj = mockStore.nasabah.find(n => n.id == nasabah_id) || { no_rek: '101.01.999', nama: 'Nasabah Umum', alamat: '-' };
  const newTx = {
    id: mockStore.transaksi.length + 1,
    tanggal: dateStr,
    nasabah_id: parseInt(nasabah_id),
    no_rek: nasabahObj.no_rek,
    nama: nasabahObj.nama,
    alamat: nasabahObj.alamat,
    user_id: req.user.id,
    tipe,
    nominal: parseFloat(nominal),
    keterangan: keterangan || ''
  };
  mockStore.transaksi.push(newTx);
  res.json({ success: true, message: 'Transaksi berhasil disimpan', data: newTx });
});

app.delete('/api/transaksi/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  if (isDbConnected) {
    try {
      await pool.query('DELETE FROM transaksi_harian WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Transaksi berhasil dihapus' });
    } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
  }
  mockStore.transaksi = mockStore.transaksi.filter(t => t.id != id);
  res.json({ success: true, message: 'Transaksi berhasil dihapus' });
});

// --- DAFTAR PROSPEK ---
app.get('/api/prospek', authMiddleware, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const tanggal = req.query.tanggal || '';
  const offset = (page - 1) * limit;

  if (isDbConnected) {
    try {
      let query = 'SELECT p.*, u.nama as pegawai_nama FROM daftar_prospek p JOIN users u ON p.user_id = u.id WHERE (p.nama LIKE ? OR p.alamat_tempat LIKE ?)';
      let params = [`%${search}%`, `%${search}%`];
      if (tanggal) {
        query += ' AND p.tanggal = ?';
        params.push(tanggal);
      }
      const [countRes] = await pool.query(`SELECT COUNT(*) as total FROM (${query}) countT`, params);
      const total = countRes[0].total;

      query += ' ORDER BY p.id DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      const [rows] = await pool.query(query, params);
      return res.json({ success: true, data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (e) { console.error(e); }
  }

  let filtered = mockStore.prospek.filter(p => (p.nama.toLowerCase().includes(search.toLowerCase()) || p.alamat_tempat.toLowerCase().includes(search.toLowerCase())) && (tanggal ? p.tanggal === tanggal : true));
  const total = filtered.length;
  const sliced = filtered.slice(offset, offset + limit);
  res.json({ success: true, data: sliced, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

app.post('/api/prospek', authMiddleware, async (req, res) => {
  const { tanggal, nama, alamat_tempat, hasil, keterangan } = req.body;
  if (!nama || !alamat_tempat) {
    return res.status(400).json({ success: false, message: 'Nama & Alamat Tempat wajib diisi' });
  }
  const dateStr = tanggal || new Date().toISOString().split('T')[0];

  if (isDbConnected) {
    try {
      const [resDb] = await pool.query('INSERT INTO daftar_prospek (tanggal, user_id, nama, alamat_tempat, hasil, keterangan) VALUES (?, ?, ?, ?, ?, ?)', [dateStr, req.user.id, nama, alamat_tempat, hasil || '', keterangan || '']);
      return res.json({ success: true, message: 'Data prospek berhasil ditambahkan', id: resDb.insertId });
    } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
  }

  const newP = { id: mockStore.prospek.length + 1, tanggal: dateStr, user_id: req.user.id, nama, alamat_tempat, hasil: hasil || '', keterangan: keterangan || '' };
  mockStore.prospek.push(newP);
  res.json({ success: true, message: 'Data prospek berhasil ditambahkan', data: newP });
});

app.delete('/api/prospek/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  if (isDbConnected) {
    try {
      await pool.query('DELETE FROM daftar_prospek WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Prospek berhasil dihapus' });
    } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
  }
  mockStore.prospek = mockStore.prospek.filter(p => p.id != id);
  res.json({ success: true, message: 'Prospek berhasil dihapus' });
});

// --- DAFTAR ANGGOTA TIDAK TRANSAKSI & TIDAK DIKUNJUNGI ---
const createModuleEndpoints = (endpointRoute, dbTableName, storeKey, itemLabel) => {
  app.get(`/api/${endpointRoute}`, authMiddleware, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const tanggal = req.query.tanggal || '';
    const offset = (page - 1) * limit;

    if (isDbConnected) {
      try {
        let query = `SELECT t.*, u.nama as pegawai_nama FROM \`${dbTableName}\` t JOIN users u ON t.user_id = u.id WHERE (t.nama LIKE ? OR t.no_rek LIKE ?)`;
        let params = [`%${search}%`, `%${search}%`];
        if (tanggal) {
          query += ' AND t.tanggal = ?';
          params.push(tanggal);
        }
        const [countRes] = await pool.query(`SELECT COUNT(*) as total FROM (${query}) countTbl`, params);
        const total = countRes[0].total;

        query += ' ORDER BY t.id DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        const [rows] = await pool.query(query, params);
        return res.json({ success: true, data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
      } catch (e) { console.error(e); }
    }

    let filtered = mockStore[storeKey].filter(x => (x.nama.toLowerCase().includes(search.toLowerCase()) || x.no_rek.includes(search)) && (tanggal ? x.tanggal === tanggal : true));
    const total = filtered.length;
    const sliced = filtered.slice(offset, offset + limit);
    res.json({ success: true, data: sliced, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  });

  app.post(`/api/${endpointRoute}`, authMiddleware, async (req, res) => {
    const { tanggal, no_rek, nama, alamat, keterangan } = req.body;
    if (!no_rek || !nama) {
      return res.status(400).json({ success: false, message: 'No Rekening & Nama wajib diisi' });
    }
    const dateStr = tanggal || new Date().toISOString().split('T')[0];

    if (isDbConnected) {
      try {
        const [resDb] = await pool.query(`INSERT INTO \`${dbTableName}\` (tanggal, user_id, no_rek, nama, alamat, keterangan) VALUES (?, ?, ?, ?, ?, ?)`, [dateStr, req.user.id, no_rek, nama, alamat || '', keterangan || '']);
        return res.json({ success: true, message: `Data ${itemLabel} berhasil disimpan`, id: resDb.insertId });
      } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
    }

    const newItem = { id: mockStore[storeKey].length + 1, tanggal: dateStr, user_id: req.user.id, no_rek, nama, alamat: alamat || '', keterangan: keterangan || '' };
    mockStore[storeKey].push(newItem);
    res.json({ success: true, message: `Data ${itemLabel} berhasil disimpan`, data: newItem });
  });

  app.delete(`/api/${endpointRoute}/:id`, authMiddleware, async (req, res) => {
    const { id } = req.params;
    if (isDbConnected) {
      try {
        await pool.query(`DELETE FROM \`${dbTableName}\` WHERE id = ?`, [id]);
        return res.json({ success: true, message: `Data ${itemLabel} berhasil dihapus` });
      } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
    }
    mockStore[storeKey] = mockStore[storeKey].filter(x => x.id != id);
    res.json({ success: true, message: `Data ${itemLabel} berhasil dihapus` });
  });
};

createModuleEndpoints('tidak-transaksi', 'tidak_transaksi', 'tidak_transaksi', 'tidak transaksi');
createModuleEndpoints('tidak-dikunjungi', 'tidak_dikunjungi', 'tidak_dikunjungi', 'tidak dikunjungi');

// --- LAPORAN HARIAN KAS & PECAHAN UANG TUNAI ---
app.get('/api/laporan-kas', authMiddleware, async (req, res) => {
  const tanggal = req.query.tanggal || new Date().toISOString().split('T')[0];

  if (isDbConnected) {
    try {
      const [rows] = await pool.query('SELECT * FROM laporan_harian_kas WHERE tanggal = ? ORDER BY id DESC LIMIT 1', [tanggal]);
      return res.json({ success: true, data: rows[0] || null });
    } catch (e) { console.error(e); }
  }

  const record = mockStore.laporan_kas.find(l => l.tanggal === tanggal) || null;
  res.json({ success: true, data: record });
});

app.post('/api/laporan-kas', authMiddleware, async (req, res) => {
  const { tanggal, kas_kantor, kolektor, penerimaan_sibela, penerimaan_lain, pengeluaran_sibela, pengeluaran_pinjaman, pengeluaran_operasional, pengeluaran_lain } = req.body;
  const dateStr = tanggal || new Date().toISOString().split('T')[0];

  const total_kas_masuk = (parseFloat(kas_kantor) || 0) + (parseFloat(kolektor) || 0) + (parseFloat(penerimaan_sibela) || 0) + (parseFloat(penerimaan_lain) || 0);
  const total_kas_keluar = (parseFloat(pengeluaran_sibela) || 0) + (parseFloat(pengeluaran_pinjaman) || 0) + (parseFloat(pengeluaran_operasional) || 0) + (parseFloat(pengeluaran_lain) || 0);

  if (isDbConnected) {
    try {
      await pool.query(
        `INSERT INTO laporan_harian_kas (tanggal, user_id, kas_kantor, kolektor, penerimaan_sibela, penerimaan_lain, pengeluaran_sibela, pengeluaran_pinjaman, pengeluaran_operasional, pengeluaran_lain, total_kas_masuk, total_kas_keluar)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE kas_kantor=?, kolektor=?, penerimaan_sibela=?, penerimaan_lain=?, pengeluaran_sibela=?, pengeluaran_pinjaman=?, pengeluaran_operasional=?, pengeluaran_lain=?, total_kas_masuk=?, total_kas_keluar=?`,
        [
          dateStr, req.user.id, kas_kantor || 0, kolektor || 0, penerimaan_sibela || 0, penerimaan_lain || 0, pengeluaran_sibela || 0, pengeluaran_pinjaman || 0, pengeluaran_operasional || 0, pengeluaran_lain || 0, total_kas_masuk, total_kas_keluar,
          kas_kantor || 0, kolektor || 0, penerimaan_sibela || 0, penerimaan_lain || 0, pengeluaran_sibela || 0, pengeluaran_pinjaman || 0, pengeluaran_operasional || 0, pengeluaran_lain || 0, total_kas_masuk, total_kas_keluar
        ]
      );
      return res.json({ success: true, message: 'Laporan Harian Kas berhasil diperbarui' });
    } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
  }

  const existingIdx = mockStore.laporan_kas.findIndex(l => l.tanggal === dateStr);
  const newData = {
    id: existingIdx >= 0 ? mockStore.laporan_kas[existingIdx].id : mockStore.laporan_kas.length + 1,
    tanggal: dateStr,
    user_id: req.user.id,
    kas_kantor: parseFloat(kas_kantor) || 0,
    kolektor: parseFloat(kolektor) || 0,
    penerimaan_sibela: parseFloat(penerimaan_sibela) || 0,
    penerimaan_lain: parseFloat(penerimaan_lain) || 0,
    pengeluaran_sibela: parseFloat(pengeluaran_sibela) || 0,
    pengeluaran_pinjaman: parseFloat(pengeluaran_pinjaman) || 0,
    pengeluaran_operasional: parseFloat(pengeluaran_operasional) || 0,
    pengeluaran_lain: parseFloat(pengeluaran_lain) || 0,
    total_kas_masuk,
    total_kas_keluar
  };

  if (existingIdx >= 0) mockStore.laporan_kas[existingIdx] = newData;
  else mockStore.laporan_kas.push(newData);

  res.json({ success: true, message: 'Laporan Harian Kas berhasil diperbarui', data: newData });
});

// --- RINCIAN PECAHAN UANG KAS DISETOR ---
app.get('/api/pecahan', authMiddleware, async (req, res) => {
  const tanggal = req.query.tanggal || new Date().toISOString().split('T')[0];

  if (isDbConnected) {
    try {
      const [rows] = await pool.query('SELECT * FROM rincian_pecahan WHERE tanggal = ? ORDER BY id DESC LIMIT 1', [tanggal]);
      return res.json({ success: true, data: rows[0] || null });
    } catch (e) { console.error(e); }
  }

  const item = mockStore.pecahan.find(p => p.tanggal === tanggal) || null;
  res.json({ success: true, data: item });
});

app.post('/api/pecahan', authMiddleware, async (req, res) => {
  const { tanggal, p100k, p50k, p20k, p10k, p5k, p2k, p1k, p500, p200, p100, teller_name, mengetahui_name, manager_name } = req.body;
  const dateStr = tanggal || new Date().toISOString().split('T')[0];

  const total =
    (parseInt(p100k) || 0) * 100000 +
    (parseInt(p50k) || 0) * 50000 +
    (parseInt(p20k) || 0) * 20000 +
    (parseInt(p10k) || 0) * 10000 +
    (parseInt(p5k) || 0) * 5000 +
    (parseInt(p2k) || 0) * 2000 +
    (parseInt(p1k) || 0) * 1000 +
    (parseInt(p500) || 0) * 500 +
    (parseInt(p200) || 0) * 200 +
    (parseInt(p100) || 0) * 100;

  if (isDbConnected) {
    try {
      await pool.query(
        `INSERT INTO rincian_pecahan (tanggal, user_id, p100k, p50k, p20k, p10k, p5k, p2k, p1k, p500, p200, p100, jumlah_total, teller_name, mengetahui_name, manager_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [dateStr, req.user.id, p100k || 0, p50k || 0, p20k || 0, p10k || 0, p5k || 0, p2k || 0, p1k || 0, p500 || 0, p200 || 0, p100 || 0, total, teller_name || req.user.nama, mengetahui_name || 'Koordinator Kolektor', manager_name || 'Administrator BMT']
      );
      return res.json({ success: true, message: 'Rincian Pecahan Uang Kas berhasil disimpan', total });
    } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
  }

  const existingIdx = mockStore.pecahan.findIndex(p => p.tanggal === dateStr);
  const newData = {
    id: existingIdx >= 0 ? mockStore.pecahan[existingIdx].id : mockStore.pecahan.length + 1,
    tanggal: dateStr,
    user_id: req.user.id,
    p100k: parseInt(p100k) || 0,
    p50k: parseInt(p50k) || 0,
    p20k: parseInt(p20k) || 0,
    p10k: parseInt(p10k) || 0,
    p5k: parseInt(p5k) || 0,
    p2k: parseInt(p2k) || 0,
    p1k: parseInt(p1k) || 0,
    p500: parseInt(p500) || 0,
    p200: parseInt(p200) || 0,
    p100: parseInt(p100) || 0,
    jumlah_total: total,
    selisih: 0,
    teller_name: teller_name || req.user.nama,
    mengetahui_name: mengetahui_name || 'Koordinator Kolektor',
    manager_name: manager_name || 'Administrator BMT'
  };

  if (existingIdx >= 0) mockStore.pecahan[existingIdx] = newData;
  else mockStore.pecahan.push(newData);

  res.json({ success: true, message: 'Rincian Pecahan Uang Kas berhasil disimpan', data: newData });
});

// --- REKAPITULASI HARIAN & BULANAN LENGKAP ---
app.get('/api/rekap/harian', authMiddleware, async (req, res) => {
  const tanggal = req.query.tanggal || new Date().toISOString().split('T')[0];

  const slip = mockStore.transaksi.filter(t => t.tanggal === tanggal);
  const prospek = mockStore.prospek.filter(p => p.tanggal === tanggal);
  const tidak_transaksi = mockStore.tidak_transaksi.filter(x => x.tanggal === tanggal);
  const tidak_dikunjungi = mockStore.tidak_dikunjungi.filter(x => x.tanggal === tanggal);
  const laporan_kas = mockStore.laporan_kas.find(l => l.tanggal === tanggal) || null;
  const rincian_pecahan = mockStore.pecahan.find(p => p.tanggal === tanggal) || null;

  res.json({
    success: true,
    data: {
      tanggal,
      slip,
      prospek,
      tidak_transaksi,
      tidak_dikunjungi,
      laporan_kas,
      rincian_pecahan
    }
  });
});

app.get('/api/rekap/bulanan', authMiddleware, async (req, res) => {
  const bulan = req.query.bulan || (new Date().getMonth() + 1);
  const tahun = req.query.tahun || new Date().getFullYear();

  const totalSetoran = mockStore.transaksi
    .filter(t => t.tipe === 'setoran')
    .reduce((acc, curr) => acc + curr.nominal, 0);

  const totalPenarikan = mockStore.transaksi
    .filter(t => t.tipe === 'penarikan')
    .reduce((acc, curr) => acc + curr.nominal, 0);

  res.json({
    success: true,
    data: {
      bulan,
      tahun,
      total_setoran: totalSetoran,
      total_penarikan: totalPenarikan,
      total_transaksi_count: mockStore.transaksi.length,
      total_prospek_count: mockStore.prospek.length,
      total_anggota_count: mockStore.nasabah.length
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server KSPPS BMT Hira Running on port ${PORT}`);
});
