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

// Test connection on startup and ensure tables exist
(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`survey_pembiayaan\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`tanggal\` DATE NOT NULL,
        \`user_id\` INT NOT NULL,
        \`nama\` VARCHAR(100) NOT NULL,
        \`alamat\` TEXT NOT NULL,
        \`no_hp\` VARCHAR(25) DEFAULT NULL,
        \`jenis_layanan\` ENUM('Survey Pembiayaan', 'Penagihan Pembiayaan') NOT NULL DEFAULT 'Survey Pembiayaan',
        \`jumlah_plafond\` DECIMAL(15,2) DEFAULT 0.00,
        \`hasil_survey\` TEXT DEFAULT NULL,
        \`keterangan\` TEXT DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_user_id\` (\`user_id\`),
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    conn.release();
    console.log('✅ Connected to MySQL Database: ' + (process.env.DB_NAME || 'bmt_hira'));
  } catch (err) {
    console.error('❌ Database Connection Error:', err.message);
  }
})();

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
    return res.status(401).json({ success: false, message: 'Token tidak valid atau telah kedaluwarsa' });
  }
};

// --- AUTH ENDPOINTS ---
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ? AND status = "aktif"', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Username tidak ditemukan atau akun nonaktif' });
    }

    const user = rows[0];
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Password salah' });
    }

    const token = jwt.sign(
      { id: user.id, nama: user.nama, username: user.username, role: user.role, jabatan: user.jabatan },
      process.env.JWT_SECRET || 'bmthira_secret_key_2026_super_secure',
      { expiresIn: '1d' }
    );

    return res.json({
      success: true,
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        nama: user.nama,
        username: user.username,
        role: user.role,
        jabatan: user.jabatan,
        no_hp: user.no_hp
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ success: false, message: 'Gagal login: ' + err.message });
  }
});

app.get('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nama, username, role, jabatan, no_hp, status, created_at FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// --- USERS MANAGEMENT (Admin Only) ---
app.get('/api/users', authMiddleware, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const offset = (page - 1) * limit;

  try {
    const searchPattern = `%${search}%`;
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM users WHERE nama LIKE ? OR username LIKE ?', [searchPattern, searchPattern]);
    const total = countResult[0].total;

    const [rows] = await pool.query(
      'SELECT id, nama, username, role, jabatan, no_hp, status, created_at FROM users WHERE nama LIKE ? OR username LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?',
      [searchPattern, searchPattern, limit, offset]
    );

    return res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('Users Get Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/users', authMiddleware, async (req, res) => {
  const { nama, username, password, role, jabatan, no_hp } = req.body;
  if (!nama || !username || !password) {
    return res.status(400).json({ success: false, message: 'Nama, username, dan password wajib diisi' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO users (nama, username, password, role, jabatan, no_hp) VALUES (?, ?, ?, ?, ?, ?)',
      [nama, username, password, role || 'pegawai', jabatan || 'Marketing', no_hp || '']
    );
    return res.json({ success: true, message: 'Pegawai berhasil ditambahkan', id: result.insertId });
  } catch (err) {
    console.error('Users Create Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/users/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { nama, username, password, role, jabatan, no_hp, status } = req.body;

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
  } catch (err) {
    console.error('Users Update Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/users/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Pegawai berhasil dihapus' });
  } catch (err) {
    console.error('Users Delete Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// --- NASABAH ENDPOINTS ---
app.get('/api/nasabah', authMiddleware, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const offset = (page - 1) * limit;

  try {
    const searchPattern = `%${search}%`;
    const [countRes] = await pool.query(
      'SELECT COUNT(*) as total FROM nasabah WHERE nama LIKE ? OR no_rek LIKE ? OR alamat LIKE ?',
      [searchPattern, searchPattern, searchPattern]
    );
    const total = countRes[0].total;

    const [rows] = await pool.query(
      'SELECT * FROM nasabah WHERE nama LIKE ? OR no_rek LIKE ? OR alamat LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?',
      [searchPattern, searchPattern, searchPattern, limit, offset]
    );

    return res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('Nasabah Get Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/nasabah', authMiddleware, async (req, res) => {
  const { no_rek, nama, alamat, no_hp, titik_koordinat } = req.body;
  if (!no_rek || !nama || !alamat) {
    return res.status(400).json({ success: false, message: 'No. Rekening, Nama, dan Alamat wajib diisi' });
  }

  try {
    const [resDb] = await pool.query(
      'INSERT INTO nasabah (no_rek, nama, alamat, no_hp, titik_koordinat) VALUES (?, ?, ?, ?, ?)',
      [no_rek, nama, alamat, no_hp || '', titik_koordinat || '']
    );
    return res.json({ success: true, message: 'Nasabah berhasil ditambahkan', id: resDb.insertId });
  } catch (err) {
    console.error('Nasabah Create Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/nasabah/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { no_rek, nama, alamat, no_hp, status, titik_koordinat } = req.body;

  try {
    await pool.query(
      'UPDATE nasabah SET no_rek = ?, nama = ?, alamat = ?, no_hp = ?, status = ?, titik_koordinat = ? WHERE id = ?',
      [no_rek, nama, alamat, no_hp, status, titik_koordinat || '', id]
    );
    return res.json({ success: true, message: 'Data nasabah diperbarui' });
  } catch (err) {
    console.error('Nasabah Update Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/nasabah/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM nasabah WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Nasabah berhasil dihapus' });
  } catch (err) {
    console.error('Nasabah Delete Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// --- TRANSAKSI HARIAN (SLIP SETORAN & PENARIKAN) ---
app.get('/api/transaksi', authMiddleware, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const tanggal = req.query.tanggal || '';
  const offset = (page - 1) * limit;

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
  } catch (err) {
    console.error('Transaksi Get Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/transaksi', authMiddleware, async (req, res) => {
  const { tanggal, nasabah_id, tipe, nominal, keterangan } = req.body;
  if (!nasabah_id || !tipe || !nominal) {
    return res.status(400).json({ success: false, message: 'Nasabah, Tipe Transaksi, dan Nominal wajib diisi' });
  }
  const dateStr = tanggal || new Date().toISOString().split('T')[0];

  try {
    const [resDb] = await pool.query(
      'INSERT INTO transaksi_harian (tanggal, nasabah_id, user_id, tipe, nominal, keterangan) VALUES (?, ?, ?, ?, ?, ?)',
      [dateStr, nasabah_id, req.user.id, tipe, nominal, keterangan || '']
    );
    return res.json({ success: true, message: 'Transaksi berhasil disimpan', id: resDb.insertId });
  } catch (err) {
    console.error('Transaksi Create Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/transaksi/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM transaksi_harian WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Transaksi berhasil dihapus' });
  } catch (err) {
    console.error('Transaksi Delete Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// --- DAFTAR PROSPEK ---
app.get('/api/prospek', authMiddleware, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const tanggal = req.query.tanggal || '';
  const offset = (page - 1) * limit;

  try {
    let query = 'SELECT p.*, u.nama as pegawai_nama FROM daftar_prospek p JOIN users u ON p.user_id = u.id WHERE (p.nama LIKE ? OR p.alamat_tempat LIKE ? OR p.no_hp LIKE ?)';
    let params = [`%${search}%`, `%${search}%`, `%${search}%`];
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
  } catch (err) {
    console.error('Prospek Get Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/prospek', authMiddleware, async (req, res) => {
  const { tanggal, nama, alamat_tempat, no_hp, hasil, keterangan } = req.body;
  if (!nama || !alamat_tempat) {
    return res.status(400).json({ success: false, message: 'Nama & Alamat Tempat wajib diisi' });
  }
  const dateStr = tanggal || new Date().toISOString().split('T')[0];

  try {
    const [resDb] = await pool.query(
      'INSERT INTO daftar_prospek (tanggal, user_id, nama, alamat_tempat, no_hp, hasil, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [dateStr, req.user.id, nama, alamat_tempat, no_hp || '', hasil || '', keterangan || '']
    );
    return res.json({ success: true, message: 'Data prospek berhasil ditambahkan', id: resDb.insertId });
  } catch (err) {
    console.error('Prospek Create Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/prospek/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { tanggal, nama, alamat_tempat, no_hp, hasil, keterangan } = req.body;

  try {
    await pool.query(
      'UPDATE daftar_prospek SET tanggal = ?, nama = ?, alamat_tempat = ?, no_hp = ?, hasil = ?, keterangan = ? WHERE id = ?',
      [tanggal, nama, alamat_tempat, no_hp || '', hasil || '', keterangan || '', id]
    );
    return res.json({ success: true, message: 'Data prospek berhasil diperbarui' });
  } catch (err) {
    console.error('Prospek Update Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/prospek/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM daftar_prospek WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Prospek berhasil dihapus' });
  } catch (err) {
    console.error('Prospek Delete Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// --- DAFTAR ANGGOTA TIDAK TRANSAKSI & TIDAK DIKUNJUNGI ---
const createModuleEndpoints = (endpointRoute, dbTableName, itemLabel) => {
  app.get(`/api/${endpointRoute}`, authMiddleware, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const tanggal = req.query.tanggal || '';
    const offset = (page - 1) * limit;

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
    } catch (err) {
      console.error(`${endpointRoute} Get Error:`, err);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post(`/api/${endpointRoute}`, authMiddleware, async (req, res) => {
    const { tanggal, no_rek, nama, alamat, keterangan } = req.body;
    if (!no_rek || !nama) {
      return res.status(400).json({ success: false, message: 'No Rekening & Nama wajib diisi' });
    }
    const dateStr = tanggal || new Date().toISOString().split('T')[0];

    try {
      const [resDb] = await pool.query(
        `INSERT INTO \`${dbTableName}\` (tanggal, user_id, no_rek, nama, alamat, keterangan) VALUES (?, ?, ?, ?, ?, ?)`,
        [dateStr, req.user.id, no_rek, nama, alamat || '', keterangan || '']
      );
      return res.json({ success: true, message: `Data ${itemLabel} berhasil disimpan`, id: resDb.insertId });
    } catch (err) {
      console.error(`${endpointRoute} Create Error:`, err);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete(`/api/${endpointRoute}/:id`, authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query(`DELETE FROM \`${dbTableName}\` WHERE id = ?`, [id]);
      return res.json({ success: true, message: `Data ${itemLabel} berhasil dihapus` });
    } catch (err) {
      console.error(`${endpointRoute} Delete Error:`, err);
      return res.status(500).json({ success: false, message: err.message });
    }
  });
};

createModuleEndpoints('tidak-transaksi', 'tidak_transaksi', 'tidak transaksi');
createModuleEndpoints('tidak-dikunjungi', 'tidak_dikunjungi', 'tidak dikunjungi');

// --- SURVEY & PENAGIHAN PEMBIAYAAN ---
app.get('/api/survey-pembiayaan', authMiddleware, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const tanggal = req.query.tanggal || '';
  const jenis = req.query.jenis || '';
  const offset = (page - 1) * limit;

  try {
    let query = 'SELECT s.*, u.nama as pegawai_nama FROM survey_pembiayaan s JOIN users u ON s.user_id = u.id WHERE (s.nama LIKE ? OR s.alamat LIKE ? OR s.no_hp LIKE ?)';
    let params = [`%${search}%`, `%${search}%`, `%${search}%`];
    if (tanggal) {
      query += ' AND s.tanggal = ?';
      params.push(tanggal);
    }
    if (jenis) {
      query += ' AND s.jenis_layanan = ?';
      params.push(jenis);
    }
    const [countRes] = await pool.query(`SELECT COUNT(*) as total FROM (${query}) countTable`, params);
    const total = countRes[0].total;

    query += ' ORDER BY s.id DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const [rows] = await pool.query(query, params);
    return res.json({ success: true, data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Survey Pembiayaan Get Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/survey-pembiayaan', authMiddleware, async (req, res) => {
  const { tanggal, nama, alamat, no_hp, jenis_layanan, jumlah_plafond, hasil_survey, keterangan } = req.body;
  if (!nama || !alamat) {
    return res.status(400).json({ success: false, message: 'Nama dan Alamat wajib diisi' });
  }
  const dateStr = tanggal || new Date().toISOString().split('T')[0];

  try {
    const [resDb] = await pool.query(
      'INSERT INTO survey_pembiayaan (tanggal, user_id, nama, alamat, no_hp, jenis_layanan, jumlah_plafond, hasil_survey, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [dateStr, req.user.id, nama, alamat, no_hp || '', jenis_layanan || 'Survey Pembiayaan', parseFloat(jumlah_plafond) || 0, hasil_survey || '', keterangan || '']
    );
    return res.json({ success: true, message: 'Data survey/penagihan pembiayaan berhasil disimpan', id: resDb.insertId });
  } catch (err) {
    console.error('Survey Pembiayaan Create Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/survey-pembiayaan/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { tanggal, nama, alamat, no_hp, jenis_layanan, jumlah_plafond, hasil_survey, keterangan } = req.body;

  try {
    await pool.query(
      'UPDATE survey_pembiayaan SET tanggal = ?, nama = ?, alamat = ?, no_hp = ?, jenis_layanan = ?, jumlah_plafond = ?, hasil_survey = ?, keterangan = ? WHERE id = ?',
      [tanggal, nama, alamat, no_hp || '', jenis_layanan || 'Survey Pembiayaan', parseFloat(jumlah_plafond) || 0, hasil_survey || '', keterangan || '', id]
    );
    return res.json({ success: true, message: 'Data survey/penagihan pembiayaan berhasil diperbarui' });
  } catch (err) {
    console.error('Survey Pembiayaan Update Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/survey-pembiayaan/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM survey_pembiayaan WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Data survey/penagihan pembiayaan berhasil dihapus' });
  } catch (err) {
    console.error('Survey Pembiayaan Delete Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// --- LAPORAN HARIAN KAS & PECAHAN UANG TUNAI ---
app.get('/api/laporan-kas', authMiddleware, async (req, res) => {
  const tanggal = req.query.tanggal || new Date().toISOString().split('T')[0];
  const userId = req.query.user_id ? parseInt(req.query.user_id) : null;

  try {
    let q = 'SELECT * FROM laporan_harian_kas WHERE tanggal = ?';
    let p = [tanggal];
    if (userId) { q += ' AND user_id = ?'; p.push(userId); }
    q += ' ORDER BY id DESC LIMIT 1';
    const [rows] = await pool.query(q, p);
    return res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    console.error('Laporan Kas Get Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/laporan-kas', authMiddleware, async (req, res) => {
  const { tanggal, kas_kantor, kolektor, penerimaan_sibela, penerimaan_lain, pengeluaran_sibela, pengeluaran_pinjaman, pengeluaran_operasional, pengeluaran_lain } = req.body;
  const dateStr = tanggal || new Date().toISOString().split('T')[0];

  const total_kas_masuk = (parseFloat(kas_kantor) || 0) + (parseFloat(kolektor) || 0) + (parseFloat(penerimaan_sibela) || 0) + (parseFloat(penerimaan_lain) || 0);
  const total_kas_keluar = (parseFloat(pengeluaran_sibela) || 0) + (parseFloat(pengeluaran_pinjaman) || 0) + (parseFloat(pengeluaran_operasional) || 0) + (parseFloat(pengeluaran_lain) || 0);

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
  } catch (err) {
    console.error('Laporan Kas Save Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// --- RINCIAN PECAHAN UANG KAS DISETOR ---
app.get('/api/pecahan', authMiddleware, async (req, res) => {
  const tanggal = req.query.tanggal || new Date().toISOString().split('T')[0];
  const userId = req.query.user_id ? parseInt(req.query.user_id) : null;

  try {
    let q = 'SELECT * FROM rincian_pecahan WHERE tanggal = ?';
    let p = [tanggal];
    if (userId) { q += ' AND user_id = ?'; p.push(userId); }
    q += ' ORDER BY id DESC LIMIT 1';
    const [rows] = await pool.query(q, p);
    return res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    console.error('Pecahan Get Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
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

  try {
    await pool.query(
      `INSERT INTO rincian_pecahan (tanggal, user_id, p100k, p50k, p20k, p10k, p5k, p2k, p1k, p500, p200, p100, jumlah_total, teller_name, mengetahui_name, manager_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE p100k=?, p50k=?, p20k=?, p10k=?, p5k=?, p2k=?, p1k=?, p500=?, p200=?, p100=?, jumlah_total=?, teller_name=?, mengetahui_name=?, manager_name=?`,
      [
        dateStr, req.user.id, p100k || 0, p50k || 0, p20k || 0, p10k || 0, p5k || 0, p2k || 0, p1k || 0, p500 || 0, p200 || 0, p100 || 0, total, teller_name || req.user.nama, mengetahui_name || 'Koordinator Kolektor', manager_name || 'Administrator BMT',
        p100k || 0, p50k || 0, p20k || 0, p10k || 0, p5k || 0, p2k || 0, p1k || 0, p500 || 0, p200 || 0, p100 || 0, total, teller_name || req.user.nama, mengetahui_name || 'Koordinator Kolektor', manager_name || 'Administrator BMT'
      ]
    );
    return res.json({ success: true, message: 'Rincian Pecahan Uang Kas berhasil disimpan', total });
  } catch (err) {
    console.error('Pecahan Save Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// --- REKAPITULASI HARIAN & BULANAN LENGKAP ---
app.get('/api/rekap/harian', authMiddleware, async (req, res) => {
  const tanggal = req.query.tanggal || new Date().toISOString().split('T')[0];
  const userId = req.query.user_id ? parseInt(req.query.user_id) : null;

  try {
    let slipQ = 'SELECT t.*, n.no_rek, n.nama, n.alamat, u.nama as pegawai_nama FROM transaksi_harian t JOIN nasabah n ON t.nasabah_id = n.id JOIN users u ON t.user_id = u.id WHERE t.tanggal = ?';
    let slipP = [tanggal];
    if (userId) { slipQ += ' AND t.user_id = ?'; slipP.push(userId); }
    const [slip] = await pool.query(slipQ, slipP);

    let prospekQ = 'SELECT p.*, u.nama as pegawai_nama FROM daftar_prospek p JOIN users u ON p.user_id = u.id WHERE p.tanggal = ?';
    let prospekP = [tanggal];
    if (userId) { prospekQ += ' AND p.user_id = ?'; prospekP.push(userId); }
    const [prospek] = await pool.query(prospekQ, prospekP);

    let tdkTxQ = 'SELECT t.*, u.nama as pegawai_nama FROM tidak_transaksi t JOIN users u ON t.user_id = u.id WHERE t.tanggal = ?';
    let tdkTxP = [tanggal];
    if (userId) { tdkTxQ += ' AND t.user_id = ?'; tdkTxP.push(userId); }
    const [tidak_transaksi] = await pool.query(tdkTxQ, tdkTxP);

    let tdkKunjungQ = 'SELECT t.*, u.nama as pegawai_nama FROM tidak_dikunjungi t JOIN users u ON t.user_id = u.id WHERE t.tanggal = ?';
    let tdkKunjungP = [tanggal];
    if (userId) { tdkKunjungQ += ' AND t.user_id = ?'; tdkKunjungP.push(userId); }
    const [tidak_dikunjungi] = await pool.query(tdkKunjungQ, tdkKunjungP);

    let surveyQ = 'SELECT s.*, u.nama as pegawai_nama FROM survey_pembiayaan s JOIN users u ON s.user_id = u.id WHERE s.tanggal = ?';
    let surveyP = [tanggal];
    if (userId) { surveyQ += ' AND s.user_id = ?'; surveyP.push(userId); }
    const [survey_pembiayaan] = await pool.query(surveyQ, surveyP);

    let kasQ = 'SELECT * FROM laporan_harian_kas WHERE tanggal = ?';
    let kasP = [tanggal];
    if (userId) { kasQ += ' AND user_id = ?'; kasP.push(userId); }
    kasQ += ' ORDER BY id DESC LIMIT 1';
    const [kasRows] = await pool.query(kasQ, kasP);

    let pecahanQ = 'SELECT * FROM rincian_pecahan WHERE tanggal = ?';
    let pecahanP = [tanggal];
    if (userId) { pecahanQ += ' AND user_id = ?'; pecahanP.push(userId); }
    pecahanQ += ' ORDER BY id DESC LIMIT 1';
    const [pecahanRows] = await pool.query(pecahanQ, pecahanP);

    return res.json({
      success: true,
      data: {
        tanggal,
        slip,
        prospek,
        tidak_transaksi,
        tidak_dikunjungi,
        survey_pembiayaan,
        laporan_kas: kasRows[0] || null,
        rincian_pecahan: pecahanRows[0] || null
      }
    });
  } catch (err) {
    console.error('Rekap Harian Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/rekap/bulanan', authMiddleware, async (req, res) => {
  const bulan = parseInt(req.query.bulan) || (new Date().getMonth() + 1);
  const tahun = parseInt(req.query.tahun) || new Date().getFullYear();
  const userId = req.query.user_id ? parseInt(req.query.user_id) : null;

  try {
    let slipWhere = 'MONTH(tanggal) = ? AND YEAR(tanggal) = ?';
    let params = [bulan, tahun];
    if (userId) { slipWhere += ' AND user_id = ?'; params.push(userId); }

    const [slipRows] = await pool.query(`SELECT tipe, nominal FROM transaksi_harian WHERE ${slipWhere}`, params);
    const totalSetoran = slipRows.filter(t => t.tipe === 'setoran').reduce((acc, curr) => acc + Number(curr.nominal), 0);
    const totalPenarikan = slipRows.filter(t => t.tipe === 'penarikan').reduce((acc, curr) => acc + Number(curr.nominal), 0);
    const totalTxCount = slipRows.length;

    let pParams = [bulan, tahun];
    let pWhere = 'MONTH(tanggal) = ? AND YEAR(tanggal) = ?';
    if (userId) { pWhere += ' AND user_id = ?'; pParams.push(userId); }
    const [prospekRows] = await pool.query(`SELECT COUNT(*) as cnt FROM daftar_prospek WHERE ${pWhere}`, pParams);

    let ttParams = [bulan, tahun];
    let ttWhere = 'MONTH(tanggal) = ? AND YEAR(tanggal) = ?';
    if (userId) { ttWhere += ' AND user_id = ?'; ttParams.push(userId); }
    const [ttRows] = await pool.query(`SELECT COUNT(*) as cnt FROM tidak_transaksi WHERE ${ttWhere}`, ttParams);

    let tkParams = [bulan, tahun];
    let tkWhere = 'MONTH(tanggal) = ? AND YEAR(tanggal) = ?';
    if (userId) { tkWhere += ' AND user_id = ?'; tkParams.push(userId); }
    const [tkRows] = await pool.query(`SELECT COUNT(*) as cnt FROM tidak_dikunjungi WHERE ${tkWhere}`, tkParams);

    let sParams = [bulan, tahun];
    let sWhere = 'MONTH(tanggal) = ? AND YEAR(tanggal) = ?';
    if (userId) { sWhere += ' AND user_id = ?'; sParams.push(userId); }
    const [surveyRows] = await pool.query(`SELECT COUNT(*) as cnt FROM survey_pembiayaan WHERE ${sWhere}`, sParams);

    const [nasabahRows] = await pool.query('SELECT COUNT(*) as cnt FROM nasabah');

    const prospekCount = prospekRows[0]?.cnt || 0;
    const ttCount = ttRows[0]?.cnt || 0;
    const tkCount = tkRows[0]?.cnt || 0;
    const surveyCount = surveyRows[0]?.cnt || 0;
    const totalKunjungan = totalTxCount + prospekCount + ttCount + tkCount + surveyCount;

    return res.json({
      success: true,
      data: {
        bulan,
        tahun,
        total_setoran: totalSetoran,
        total_penarikan: totalPenarikan,
        total_transaksi_count: totalTxCount,
        total_kunjungan_count: totalKunjungan,
        total_prospek_count: prospekCount,
        total_survey_count: surveyCount,
        total_anggota_count: nasabahRows[0]?.cnt || 0
      }
    });
  } catch (err) {
    console.error('Rekap Bulanan Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server KSPPS BMT Hira Running on port ${PORT}`);
});
